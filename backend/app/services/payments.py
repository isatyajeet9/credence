import razorpay
from fastapi import HTTPException, status

from app.config import settings

_client: razorpay.Client | None = None


def get_client() -> razorpay.Client:
    global _client
    if _client is None:
        if not settings.razorpay_key_id or not settings.razorpay_key_secret:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Payments aren't configured yet - missing Razorpay test API keys.",
            )
        _client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
    return _client


def create_pro_upgrade_order(user_id: str) -> dict:
    client = get_client()
    order = client.order.create(
        {
            "amount": settings.pro_plan_amount_paise,
            "currency": "INR",
            "receipt": f"pro-upgrade-{user_id}",
            "notes": {"user_id": user_id, "purpose": "pro_plan_upgrade"},
        }
    )
    return order


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    if not settings.razorpay_webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Webhook secret isn't configured.",
        )
    try:
        razorpay.Utility().verify_webhook_signature(body.decode("utf-8"), signature, settings.razorpay_webhook_secret)
        return True
    except razorpay.errors.SignatureVerificationError:
        return False
