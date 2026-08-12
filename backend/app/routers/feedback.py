from fastapi import APIRouter, Depends, status

from app.auth.deps import get_current_user
from app.models.user import User
from app.schemas.feedback import FeedbackRequest, FeedbackResponse
from app.services.writing_feedback import analyze_writing

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("/text", response_model=FeedbackResponse, status_code=status.HTTP_200_OK)
def feedback_text(payload: FeedbackRequest, current_user: User = Depends(get_current_user)):
    result = analyze_writing(payload.text)
    return FeedbackResponse(**result)
