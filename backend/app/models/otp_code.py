import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import OtpPurpose


class OtpCode(Base):
    # one row per code sent - signup verification and password reset both
    # use this, distinguished by purpose. a code is single-use (used_at) and
    # short-lived (expires_at); old/expired rows are just left in place, no
    # cleanup job needed at this scale
    __tablename__ = "otp_codes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    code: Mapped[str] = mapped_column(String(6), nullable=False)
    purpose: Mapped[OtpPurpose] = mapped_column(Enum(OtpPurpose, name="otp_purpose"), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
