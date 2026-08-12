import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import CheckStatus, ConfidenceBand


class CheckTextRequest(BaseModel):
    text: str = Field(min_length=1, max_length=200_000)


class CheckResultOut(BaseModel):
    check_id: uuid.UUID
    status: CheckStatus
    originality_score: float | None
    ai_likelihood_score: float | None
    ai_confidence_band: ConfidenceBand | None
    result_json: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CheckHistoryItem(BaseModel):
    check_id: uuid.UUID
    status: CheckStatus
    originality_score: float | None
    ai_likelihood_score: float | None
    original_filename: str | None
    created_at: datetime
