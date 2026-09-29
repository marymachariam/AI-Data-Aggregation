import re
import uuid
from app.models.text_chunk import TextChunk

MIN_CHUNK_LENGTH = 40 


def clean_text(text: str) -> str:
    """Basic AI-readiness pass: collapse whitespace, drop control
    characters that sometimes survive PDF extraction. Extend this later
    with the readiness checks from the README (dedup, consistency, etc.)
    """
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_text(
    file_id: str,
    text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 150,
) -> list[TextChunk]:
    text = clean_text(text)
    if not text:
        return []

    chunks: list[TextChunk] = []
    seen_hashes: set[str] = set()
    start = 0
    order = 0
    step = max(chunk_size - chunk_overlap, 1)

    while start < len(text):
        piece = text[start:start + chunk_size].strip()
        start += step

        if len(piece) < MIN_CHUNK_LENGTH:
            continue  

        piece_hash = hash(piece)
        if piece_hash in seen_hashes:
            continue  
        seen_hashes.add(piece_hash)

        chunks.append(
            TextChunk(
                id=str(uuid.uuid4()),
                file_id=file_id,
                chunk_text=piece,
                chunk_order=order,
            )
        )
        order += 1

    return chunks