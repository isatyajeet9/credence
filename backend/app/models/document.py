import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import DocumentSourceType


class Document(Base):
    # whatever gets submitted (pasted text, pdf, docx, later handwriting)
    # ends up as plain text here, same pipeline downstream either way
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    original_filename: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_type: Mapped[DocumentSourceType] = mapped_column(
        Enum(DocumentSourceType, name="document_source_type"), nullable=False
    )
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
