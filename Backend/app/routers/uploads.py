import hashlib
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from app.models.file_record import FileRecord
from app.models.user import User
from app.repositories.file_record_repository import FileRecordRepository
from app.repositories.text_chunk_repository import TextChunkRepository
from app.repositories.source_repository import SourceRepository
from app.services.auth_service import get_current_user
from app.services.extraction_service import extract_text
from app.services.chunking_service import chunk_text
from app.services.vector_exporter import export_chunks_to_vector_store

router = APIRouter(prefix="/sources", tags=["uploads"])

SUPPORTED_CONTENT_TYPES = {
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


@router.post("/{source_id}/upload")
async def upload_file(
    source_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sources = SourceRepository(db)
    source = sources.get_by_id(source_id)
    if source is None or source.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail=f"No source with id={source_id!r}")

    if file.content_type not in SUPPORTED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type {file.content_type!r}. "
            f"Supported: {sorted(SUPPORTED_CONTENT_TYPES)}",
        )

    raw_bytes = await file.read()
    fingerprint = hashlib.sha256(raw_bytes).hexdigest()

    file_records = FileRecordRepository(db)
    text_chunks = TextChunkRepository(db)

    existing = file_records.get_by_fingerprint(source_id, fingerprint)
    if existing is not None:
        return {"status": "unchanged", "file_id": existing.id}

    file_record = file_records.create(
        FileRecord(
            id=str(uuid.uuid4()),
            source_id=source_id,
            file_name=file.filename,
            file_type=file.content_type,
            fingerprint=fingerprint,
            status="processing",
        )
    )

    try:
        text = extract_text(raw_bytes, file.content_type)
        chunks = chunk_text(file_record.id, text)

        text_chunks.delete_by_file(file_record.id)
        text_chunks.bulk_create(chunks)
        export_chunks_to_vector_store(chunks, owner_id=current_user.id)

        file_records.update_status(file_record.id, "processed", datetime.now(timezone.utc))
        return {"status": "processed", "file_id": file_record.id, "chunks_created": len(chunks)}

    except Exception as exc:
        file_records.update_status(file_record.id, "failed")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {exc}") from exc