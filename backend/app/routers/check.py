import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.database import get_db
from app.models.check import Check
from app.models.document import Document
from app.models.embedding import Embedding
from app.models.enums import CheckStatus, CheckType, ConfidenceBand, DocumentSourceType
from app.models.match import Match
from app.models.user import User
from app.schemas.check import CheckHistoryItem, CheckResultOut, CheckTextRequest
from app.services.ai_text import analyze_ai_likelihood
from app.services.embeddings import chunk_text, embed_chunks
from app.services.extraction import extract_text
from app.services.image_analysis import analyze_image
from app.services.plagiarism import analyze_document
from app.services.report_pdf import build_report_pdf
from app.services.usage import enforce_and_increment_check_limit, enforce_pro_plan, record_bulk_check

MAX_BULK_FILES = 10
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10MB per file
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

router = APIRouter(prefix="/check", tags=["check"])


async def read_upload_limited(file: UploadFile) -> bytes:
    """Reads an upload in bounded chunks, rejecting it as soon as it crosses
    the size cap instead of buffering an unbounded amount into memory first."""
    chunks = []
    total = 0
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File is too large - the limit is {MAX_UPLOAD_BYTES // (1024 * 1024)}MB.",
            )
        chunks.append(chunk)
    return b"".join(chunks)


def to_check_result(check: Check) -> CheckResultOut:
    return CheckResultOut(
        check_id=check.id,
        status=check.status,
        originality_score=check.originality_score,
        ai_likelihood_score=check.ai_likelihood_score,
        ai_confidence_band=check.ai_confidence_band,
        result_json=check.result_json,
        created_at=check.created_at,
    )


def run_text_check(db: Session, current_user: User, text: str, source_type: DocumentSourceType, original_filename: str | None) -> Check:
    enforce_and_increment_check_limit(db, current_user)

    document = Document(
        user_id=current_user.id,
        source_type=source_type,
        original_filename=original_filename,
        raw_text=text,
    )
    db.add(document)
    db.flush()

    chunks = chunk_text(text)
    vectors = embed_chunks(chunks)

    for index, (chunk, vector) in enumerate(zip(chunks, vectors)):
        db.add(Embedding(document_id=document.id, chunk_index=index, chunk_text=chunk, embedding=vector))
    db.flush()

    result = analyze_document(db, current_user.id, document, chunks, vectors)
    ai_result = analyze_ai_likelihood(text)

    check = Check(
        user_id=current_user.id,
        document_id=document.id,
        check_type=CheckType.text,
        status=CheckStatus.completed,
        originality_score=result["originality_score"],
        ai_likelihood_score=ai_result["ai_likelihood_score"],
        ai_confidence_band=ConfidenceBand(ai_result["confidence"]),
        result_json={
            "low_confidence": result["low_confidence"],
            "low_confidence_reason": result["reason"],
            "ai_text_reasons": ai_result["reasons"],
            "matches": [
                {
                    "source_type": match["source_type"].value,
                    "source_reference": match["source_reference"],
                    "matched_excerpt": match["matched_excerpt"],
                    "similarity_score": round(match["similarity_score"] * 100, 1),
                }
                for match in result["matches"]
            ],
        },
        completed_at=datetime.now(timezone.utc),
    )
    db.add(check)
    db.flush()

    for match in result["matches"]:
        db.add(
            Match(
                check_id=check.id,
                source_type=match["source_type"],
                source_reference=match["source_reference"],
                matched_excerpt=match["matched_excerpt"],
                similarity_score=match["similarity_score"],
            )
        )

    db.commit()
    db.refresh(check)
    return check


@router.post("/text", response_model=CheckResultOut, status_code=status.HTTP_201_CREATED)
def check_text(
    payload: CheckTextRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check = run_text_check(db, current_user, payload.text, DocumentSourceType.pasted_text, None)
    return to_check_result(check)


@router.post("/document", response_model=CheckResultOut, status_code=status.HTTP_201_CREATED)
async def check_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_bytes = await read_upload_limited(file)
    text = extract_text(file.filename, file_bytes)
    source_type = DocumentSourceType.pdf if file.filename.lower().endswith(".pdf") else DocumentSourceType.docx
    check = run_text_check(db, current_user, text, source_type, file.filename)
    return to_check_result(check)


@router.post("/image", response_model=CheckResultOut, status_code=status.HTTP_201_CREATED)
async def check_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only JPEG, PNG, or WEBP images are supported.")

    enforce_and_increment_check_limit(db, current_user)

    file_bytes = await read_upload_limited(file)
    result = analyze_image(file_bytes, file.content_type)

    document = Document(
        user_id=current_user.id,
        source_type=DocumentSourceType.image,
        original_filename=file.filename,
        raw_text="",
    )
    db.add(document)
    db.flush()

    check = Check(
        user_id=current_user.id,
        document_id=document.id,
        check_type=CheckType.image,
        status=CheckStatus.completed,
        originality_score=None,
        ai_likelihood_score=result["ai_likelihood_score"],
        ai_confidence_band=ConfidenceBand(result["confidence"]),
        result_json={
            "ai_text_reasons": result["reasons"],
            "provenance": result["provenance"],
            "matches": [],
        },
        completed_at=datetime.now(timezone.utc),
    )
    db.add(check)
    db.commit()
    db.refresh(check)
    return to_check_result(check)


@router.post("/bulk", response_model=list[CheckResultOut], status_code=status.HTTP_201_CREATED)
async def check_bulk(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    enforce_pro_plan(current_user)

    if len(files) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files provided.")
    if len(files) > MAX_BULK_FILES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Bulk upload is capped at {MAX_BULK_FILES} files at a time.")

    results = []
    for file in files:
        file_bytes = await read_upload_limited(file)
        text = extract_text(file.filename, file_bytes)
        source_type = DocumentSourceType.pdf if file.filename.lower().endswith(".pdf") else DocumentSourceType.docx
        # each file reuses the exact same single-file pipeline - bulk doesn't
        # duplicate the detection logic, it just calls it once per file
        check = run_text_check(db, current_user, text, source_type, file.filename)
        record_bulk_check(db, current_user)
        results.append(to_check_result(check))

    return results


def _get_owned_check(db: Session, current_user: User, check_id: uuid.UUID) -> Check:
    check = db.get(Check, check_id)
    if check is None or check.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Check not found")
    return check


@router.get("", response_model=list[CheckHistoryItem])
def list_checks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = (
        db.query(Check, Document.original_filename)
        .join(Document, Check.document_id == Document.id)
        .filter(Check.user_id == current_user.id)
        .order_by(Check.created_at.desc())
        .all()
    )
    return [
        CheckHistoryItem(
            check_id=check.id,
            status=check.status,
            originality_score=check.originality_score,
            ai_likelihood_score=check.ai_likelihood_score,
            original_filename=filename,
            created_at=check.created_at,
        )
        for check, filename in rows
    ]


@router.get("/{check_id}", response_model=CheckResultOut)
def get_check(check_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check = _get_owned_check(db, current_user, check_id)
    return to_check_result(check)


@router.get("/{check_id}/pdf")
def get_check_pdf(check_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check = _get_owned_check(db, current_user, check_id)
    document = db.get(Document, check.document_id)
    matches = db.query(Match).filter(Match.check_id == check.id).all()
    pdf_bytes = build_report_pdf(check, document, matches)
    
    # Generate a clean, professional filename
    clean_name = (document.original_filename or "Analysis").rsplit(".", 1)[0]
    safe_name = "".join(c if c.isalnum() else "_" for c in clean_name).strip("_")
    filename = f"Credence_Report_{safe_name}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
