import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.otp_code import OtpCode
from app.models.user import User
from app.models.enums import OtpPurpose
from app.services.email import otp_email_html, send_email

OTP_TTL_MINUTES = 10

PURPOSE_LABELS = {
    OtpPurpose.email_verification: "Verify your email",
    OtpPurpose.password_reset: "Reset your password",
}


def generate_and_send_otp(db: Session, user: User, purpose: OtpPurpose) -> None:
    code = f"{secrets.randbelow(1_000_000):06d}"
    otp = OtpCode(
        user_id=user.id,
        code=code,
        purpose=purpose,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES),
    )
    db.add(otp)
    db.commit()
    send_email(user.email, PURPOSE_LABELS[purpose], otp_email_html(code, PURPOSE_LABELS[purpose]))


def verify_otp(db: Session, user: User, purpose: OtpPurpose, code: str) -> bool:
    """Checks the most recent unused code of this purpose. Marks it used on success."""
    stmt = (
        select(OtpCode)
        .where(OtpCode.user_id == user.id, OtpCode.purpose == purpose, OtpCode.used_at.is_(None))
        .order_by(OtpCode.created_at.desc())
    )
    otp = db.execute(stmt).scalars().first()
    if otp is None:
        return False
    if otp.expires_at < datetime.now(timezone.utc):
        return False
    if not secrets.compare_digest(otp.code, code):
        return False
    otp.used_at = datetime.now(timezone.utc)
    db.commit()
    return True
