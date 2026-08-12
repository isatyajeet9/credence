from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
CHUNK_SIZE_WORDS = 150
CHUNK_OVERLAP_WORDS = 30

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def chunk_text(text: str) -> list[str]:
    words = text.split()
    if not words:
        return []

    step = CHUNK_SIZE_WORDS - CHUNK_OVERLAP_WORDS
    chunks = []
    start = 0
    while start < len(words):
        chunks.append(" ".join(words[start : start + CHUNK_SIZE_WORDS]))
        if start + CHUNK_SIZE_WORDS >= len(words):
            break
        start += step
    return chunks


def embed_chunks(chunks: list[str]) -> list[list[float]]:
    if not chunks:
        return []
    model = get_model()
    vectors = model.encode(chunks, convert_to_numpy=True, normalize_embeddings=True)
    return vectors.tolist()
