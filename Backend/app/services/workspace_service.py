from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.file_record import FileRecord
from app.models.source import Source
from app.models.text_chunk import TextChunk
from app.repositories.file_record_repository import FileRecordRepository
from app.repositories.source_repository import SourceRepository
from app.repositories.sync_log_repository import SyncLogRepository


def _owned_chunks(db: Session, owner_id: str):
    return (
        db.query(TextChunk)
        .join(FileRecord, TextChunk.file_id == FileRecord.id)
        .join(Source, FileRecord.source_id == Source.id)
        .filter(Source.owner_id == owner_id)
    )


def sample_chunks(db: Session, owner_id: str, limit: int = 12) -> list[dict]:
    rows = (
        db.query(TextChunk.chunk_text, FileRecord.file_name)
        .join(FileRecord, TextChunk.file_id == FileRecord.id)
        .join(Source, FileRecord.source_id == Source.id)
        .filter(Source.owner_id == owner_id)
        .order_by(func.random())
        .limit(limit)
        .all()
    )
    return [{"file_name": name, "text": text} for text, name in rows]


def workspace_snapshot(db: Session, owner_id: str) -> dict:
    sources = SourceRepository(db).get_by_owner(owner_id)
    file_repo = FileRecordRepository(db)
    log_repo = SyncLogRepository(db)

    per_source = []
    processed_total = 0
    failed_total = 0

    for source in sources:
        files = file_repo.get_by_source(source.id)
        logs = log_repo.get_by_source(source.id)
        processed = sum(1 for f in files if f.status == "processed")
        failed = sum(1 for f in files if f.status == "failed")
        processed_total += processed
        failed_total += failed
        per_source.append(
            {
                "name": source.name,
                "type": source.type,
                "files": len(files),
                "processed": processed,
                "failed": failed,
                "last_sync_status": logs[0].status if logs else None,
            }
        )

    return {
        "source_count": len(sources),
        "files_processed": processed_total,
        "files_failed": failed_total,
        "chunks": _owned_chunks(db, owner_id).count(),
        "per_source": per_source,
    }


def format_snapshot(snapshot: dict) -> str:
    if snapshot["source_count"] == 0:
        return "No data sources are connected yet."

    lines = [
        f"Sources connected: {snapshot['source_count']}",
        f"Files indexed: {snapshot['files_processed']}",
        f"Files failed: {snapshot['files_failed']}",
        f"Searchable passages: {snapshot['chunks']}",
    ]
    for s in snapshot["per_source"]:
        lines.append(
            f"- {s['name']} ({s['type']}): {s['files']} files, {s['failed']} failed, "
            f"last sync: {s['last_sync_status'] or 'never'}"
        )
    return "\n".join(lines)