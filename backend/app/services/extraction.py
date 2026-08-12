import io

from docx import Document as DocxDocument
from fastapi import HTTPException, status
from pypdf import PdfReader


def extract_pdf_text(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = [page.extract_text() or "" for page in reader.pages]
    text = "\n".join(pages).strip()
    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract any text from this PDF (it may be a scanned image with no text layer).",
        )
    return text


def extract_docx_text(file_bytes: bytes) -> str:
    doc = DocxDocument(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    text = "\n".join(paragraphs).strip()
    if not text:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="This DOCX file has no readable text.")
    return text


def extract_text(filename: str, file_bytes: bytes) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return extract_pdf_text(file_bytes)
    if lower.endswith(".docx"):
        return extract_docx_text(file_bytes)
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only .pdf and .docx files are supported.")
