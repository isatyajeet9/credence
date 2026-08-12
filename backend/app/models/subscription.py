import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import PlanType, SubscriptionProvider, SubscriptionStatus


class Subscription(Base):
    # payment/plan details, users.plan is the quick flag the app checks,
    # this table is the actual source of truth (provider, ids, renewal)
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    plan: Mapped[PlanType] = mapped_column(Enum(PlanType, name="plan_type"), default=PlanType.free, nullable=False)
    provider: Mapped[SubscriptionProvider] = mapped_column(
        Enum(SubscriptionProvider, name="subscription_provider"), default=SubscriptionProvider.none, nullable=False
    )
    provider_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    provider_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus, name="subscription_status"), default=SubscriptionStatus.none, nullable=False
    )
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
