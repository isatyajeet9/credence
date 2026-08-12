import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import PlanType


class User(Base):
    # single account type for everyone, plan is the only thing that varies
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    # null for accounts that only ever signed in via Google - there's no
    # password to hash for those
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Google's stable per-account id ("sub" claim) - the durable identifier
    # for Google-linked accounts, not the email (which could theoretically change)
    google_sub: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    plan: Mapped[PlanType] = mapped_column(Enum(PlanType, name="plan_type"), default=PlanType.free, nullable=False)
    # existing accounts are grandfathered in as verified by the migration's
    # server_default; new signups start False and must confirm an OTP
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
