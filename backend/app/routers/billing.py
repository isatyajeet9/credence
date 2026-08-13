import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.config import settings
from app.database import get_db
from app.models.enums import PlanType, SubscriptionProvider, SubscriptionStatus
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.billing import CreateOrderResponse, SubscriptionStatusOut
from app.services.payments import create_pro_upgrade_order, verify_webhook_signature

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/create-order", response_model=CreateOrderResponse)
def create_order(current_user: User = Depends(get_current_user)):
    if current_user.plan == PlanType.pro:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already on the Pro plan.")

    order = create_pro_upgrade_order(str(current_user.id))
    return CreateOrderResponse(
        order_id=order["id"],
        amount=order["amount"],
        currency=order["currency"],
        key_id=settings.razorpay_key_id,
    )


@router.get("/status", response_model=SubscriptionStatusOut)
def billing_status(response: Response, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    response.headers["Cache-Control"] = "no-store"
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if sub is None:
        return SubscriptionStatusOut(plan=current_user.plan, status=SubscriptionStatus.none)
    return SubscriptionStatusOut(plan=sub.plan, status=sub.status)


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    if not verify_webhook_signature(body, signature):
        logger.warning("Rejected payment webhook: signature verification failed")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")

    payload = await request.json()
    event = payload.get("event")

    if event != "payment.captured":
        # we only act on confirmed captures - ignore everything else (created, failed, etc.)
        return {"status": "ignored", "event": event}

    payment_entity = payload["payload"]["payment"]["entity"]
    order_id = payment_entity.get("order_id")
    notes = payment_entity.get("notes", {})
    user_id = notes.get("user_id")

    if not user_id:
        logger.warning("Payment webhook missing user_id in order notes, order_id=%s", order_id)
        return {"status": "ignored", "reason": "no user_id in notes"}

    user = db.get(User, user_id)
    if user is None:
        logger.warning("Payment webhook references unknown user_id=%s", user_id)
        return {"status": "ignored", "reason": "unknown user"}

    user.plan = PlanType.pro

    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if sub is None:
        sub = Subscription(user_id=user.id)
        db.add(sub)

    sub.plan = PlanType.pro
    sub.provider = SubscriptionProvider.razorpay
    sub.provider_subscription_id = order_id
    sub.provider_customer_id = payment_entity.get("customer_id")
    sub.status = SubscriptionStatus.active
    sub.current_period_end = datetime.now(timezone.utc) + timedelta(days=30)

    db.commit()
    logger.info("Upgraded user %s to Pro via verified Razorpay webhook", user_id)
    return {"status": "ok"}
