import logging

from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.config import settings

logger = logging.getLogger(__name__)
_request = google_requests.Request()


def verify_google_id_token(token: str) -> dict:
    """
    Verifies the token's signature against Google's public keys, checks it
    was issued for OUR app (audience = our client ID) and hasn't expired.
    Raises 401 on anything wrong. Returns the decoded claims on success -
    'sub' (Google's stable user id), 'email', 'email_verified', 'name'.
    """
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Sign-In isn't configured yet - missing GOOGLE_CLIENT_ID.",
        )
    try:
        claims = id_token.verify_oauth2_token(
            token, _request, settings.google_client_id, clock_skew_in_seconds=25000
        )
    except ValueError as e:
        logger.error("Google id_token verification failed: %s", e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google sign-in token")

    if not claims.get("email_verified"):
        # Google itself is telling us this email wasn't verified on their end -
        # don't trust it any more than we'd trust an unverified signup
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google account email is not verified")

    return claims
