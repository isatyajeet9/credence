import uuid
from datetime import datetime

from sqlalchemy import ARRAY, DateTime, Float, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column

ArrayVariant = JSON().with_variant(ARRAY(Float), "postgresql")

from app.database import Base

# all-MiniLM-L6-v2 output size
EMBEDDING_DIM = 384


class Embedding(Base):
    # one row per text chunk + its vector, used for similarity search
    #
    # plain float array for now, not a real pgvector column - the extension
    # needs a manual admin step to install on this Windows Postgres (compiled,
    # just needs copying into Program Files). similarity search happens in
    # Python instead of via a DB index, which is fine at this project's scale.
    __tablename__ = "embeddings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(ArrayVariant, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
