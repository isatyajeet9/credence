import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.types import JSON
JSONVariant = JSON().with_variant(JSONB, "postgresql")
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import CheckStatus, CheckType, ConfidenceBand


class Check(Base):
    # one row per detector run, report gets built from this
    # scores stay nullable for now, phase 2/3 fill them in for real
    __tablename__ = "checks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    check_type: Mapped[CheckType] = mapped_column(Enum(CheckType, name="check_type"), nullable=False)
    status: Mapped[CheckStatus] = mapped_column(
        Enum(CheckStatus, name="check_status"), default=CheckStatus.pending, nullable=False
    )

    originality_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_likelihood_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_confidence_band: Mapped[ConfidenceBand | None] = mapped_column(
        Enum(ConfidenceBand, name="confidence_band"), nullable=True
    )
    result_json: Mapped[dict | None] = mapped_column(JSONVariant, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
