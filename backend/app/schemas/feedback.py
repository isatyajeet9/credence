from pydantic import BaseModel, Field


class FeedbackRequest(BaseModel):
    text: str = Field(min_length=1, max_length=200_000)


class FeedbackItem(BaseModel):
    sentence: str
    issues: list[str]


class FeedbackResponse(BaseModel):
    sentence_count: int
    flagged_count: int
    feedback: list[FeedbackItem]
