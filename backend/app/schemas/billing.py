from pydantic import BaseModel

from app.models.enums import PlanType, SubscriptionStatus


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str


class SubscriptionStatusOut(BaseModel):
    plan: PlanType
    status: SubscriptionStatus
