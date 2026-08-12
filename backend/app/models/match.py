import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import MatchSourceType


class Match(Base):
    # one row per source flagged as similar, this is the evidence
    # behind an originality score. not used until phase 2
    __tablename__ = "matches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    check_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("checks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_type: Mapped[MatchSourceType] = mapped_column(Enum(MatchSourceType, name="match_source_type"), nullable=False)
    source_reference: Mapped[str] = mapped_column(Text, nullable=False)
    matched_excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    similarity_score: Mapped[float] = mapped_column(Float, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
