from fastapi import APIRouter

router = APIRouter(tags=["ping"])


@router.get("/ping")
def ping():
    return {"status": "ok"}
