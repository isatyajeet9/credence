import json
import logging
import urllib.error
import urllib.request

from app.config import settings

logger = logging.getLogger(__name__)

RESEND_URL = "https://api.resend.com/emails"


def send_email(to: str, subject: str, html: str) -> None:
    """
    Sends via Resend if an API key is configured. If not, logs the email to
    the server console instead of failing - lets the OTP/reset flow be built
    and tested end-to-end before real email credentials exist.
    """
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not set - email not actually sent. to=%s subject=%s\n%s", to, subject, html)
        return

    body = json.dumps({"from": settings.email_from, "to": [to], "subject": subject, "html": html}).encode("utf-8")
    req = urllib.request.Request(
        RESEND_URL,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
            # Resend sits behind Cloudflare, which silently blocks the
            # default Python-urllib/x.y User-Agent as bot traffic (403,
            # "error code: 1010") - a real UA header is required
            "User-Agent": "Credence-Backend/1.0",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            if res.status >= 300:
                logger.error("Resend responded with status %s for %s", res.status, to)
    except urllib.error.HTTPError as e:
        # a failed send (e.g. sandbox sender restrictions, bad address)
        # should never take down the request that triggered it - log it and
        # let the caller continue. the OTP is already saved in the database
        # either way, so it's still checkable/resendable.
        detail = e.read().decode("utf-8", errors="replace")
        logger.error("Resend send to %s failed: %s %s", to, e.code, detail)
    except Exception:
        logger.exception("Failed to send email to %s via Resend", to)


def otp_email_html(code: str, purpose_label: str) -> str:
    return f"""
    <div style="font-family: -apple-system, Segoe UI, sans-serif; max-width: 420px; margin: 0 auto;">
      <p style="font-size: 14px; color: #5B6672;">Credence</p>
      <h2 style="margin: 8px 0;">{purpose_label}</h2>
      <p style="font-size: 15px; color: #333;">Your verification code is:</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">{code}</p>
      <p style="font-size: 13px; color: #5B6672;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
    </div>
    """
