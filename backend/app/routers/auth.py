from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.rate_limit import code_guess_rate_limit, email_action_rate_limit, login_rate_limit, signup_rate_limit
from app.auth.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.enums import OtpPurpose
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    GoogleSignInRequest,
    LoginRequest,
    MessageResponse,
    ResendOtpRequest,
    ResetPasswordRequest,
    SignupRequest,
    SignupResponse,
    TokenResponse,
    VerifyEmailRequest,
)
from app.services.google_auth import verify_google_id_token
from app.services.otp import generate_and_send_otp, verify_otp

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(signup_rate_limit)])
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        email_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    generate_and_send_otp(db, user, OtpPurpose.email_verification)
    return SignupResponse(message="Account created. Enter the 6-digit code we emailed you to finish signing up.", email=user.email)


@router.post("/verify-email", response_model=TokenResponse, dependencies=[Depends(code_guess_rate_limit)])
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No account with this email")

    if user.email_verified:
        token = create_access_token(str(user.id))
        return TokenResponse(access_token=token, user=user)

    if not verify_otp(db, user, OtpPurpose.email_verification, payload.code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="That code is incorrect or has expired")

    user.email_verified = True
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=user)


@router.post("/resend-otp", response_model=MessageResponse, dependencies=[Depends(email_action_rate_limit)])
def resend_otp(payload: ResendOtpRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No account with this email")
    if user.email_verified:
        return MessageResponse(message="This account is already verified - just log in.")

    generate_and_send_otp(db, user, OtpPurpose.email_verification)
    return MessageResponse(message="A new code has been sent.")


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(login_rate_limit)])
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password"
    )

    user = db.query(User).filter(User.email == payload.email).first()
    if user is None:
        raise invalid_credentials

    if user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account was created with Google Sign-In. Use the Google button to log in.",
        )

    if not verify_password(payload.password, user.password_hash):
        raise invalid_credentials

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in. Use /auth/resend-otp if you need a new code.",
        )

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=user)


@router.post("/google", response_model=TokenResponse)
def google_signin(payload: GoogleSignInRequest, db: Session = Depends(get_db)):
    claims = verify_google_id_token(payload.id_token)
    google_sub = claims["sub"]
    email = claims["email"]
    name = claims.get("name")

    # already linked - the common case after the first sign-in
    user = db.query(User).filter(User.google_sub == google_sub).first()

    if user is None:
        # not linked yet - if an account with this email already exists
        # (they signed up the normal way before), link it instead of
        # erroring "email already exists"; Google already verified this
        # email so it's safe to trust it either way
        user = db.query(User).filter(User.email == email).first()
        if user is not None:
            user.google_sub = google_sub
            user.email_verified = True
        else:
            user = User(
                email=email,
                password_hash=None,
                full_name=name,
                google_sub=google_sub,
                email_verified=True,
            )
            db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=user)


@router.post("/forgot-password", response_model=MessageResponse, dependencies=[Depends(email_action_rate_limit)])
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # always return the same message whether or not the account exists -
    # otherwise this endpoint becomes a way to check which emails are registered
    generic = MessageResponse(message="If an account exists for that email, a reset code has been sent.")

    user = db.query(User).filter(User.email == payload.email).first()
    if user is None:
        return generic

    generate_and_send_otp(db, user, OtpPurpose.password_reset)
    return generic


@router.post("/reset-password", response_model=MessageResponse, dependencies=[Depends(code_guess_rate_limit)])
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="That code is incorrect or has expired")

    if not verify_otp(db, user, OtpPurpose.password_reset, payload.code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="That code is incorrect or has expired")

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return MessageResponse(message="Password updated. You can log in with your new password now.")
