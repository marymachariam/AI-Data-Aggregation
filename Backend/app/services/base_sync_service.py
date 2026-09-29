import uuid
from datetime import datetime, timezone

from app.models.file_record import FileRecord
from app.models.sync_log import SyncLog
from app.repositories.file_record_repository import FileRecordRepository
from app.repositories.text_chunk_repository import TextChunkRepository
from app.repositories.sync_log_repository import SyncLogRepository
from app.repositories.source_repository import SourceRepository
from app.services.extraction_service import extract_text
from app.services.chunking_service import chunk_text
from app.services.vector_exporter import export_chunks_to_vector_store


class BaseSyncService:
    """Shared sync loop every connector-specific service builds on. A
    subclass just needs to hand `run()` an authenticated connector — the
    fingerprint check, extraction, chunking, and export are identical
    for every source.
    """

    def __init__(self, db):
        self.db = db
        self.sources = SourceRepository(db)
        self.file_records = FileRecordRepository(db)
        self.text_chunks = TextChunkRepository(db)
        self.sync_logs = SyncLogRepository(db)

    def run(self, source_id: str, connector) -> SyncLog:
        source = self.sources.get_by_id(source_id)
        if source is None:
            raise ValueError(f"No source with id={source_id!r}")

        sync_log = self.sync_logs.create(
            SyncLog(id=str(uuid.uuid4()), source_id=source_id, status="running")
        )

        connector.authenticate()
        processed, failed = 0, 0
        file_record = None

        for remote_file in connector.list_files():
            try:
                existing = self.file_records.get_by_fingerprint(
                    source_id, remote_file["fingerprint"]
                )
                if existing is not None:
                    continue

                file_record = self.file_records.create(
                    FileRecord(
                        id=remote_file["id"],
                        source_id=source_id,
                        file_name=remote_file["name"],
                        file_type=remote_file["file_type"],
                        fingerprint=remote_file["fingerprint"],
                        status="processing",
                    )
                )

                raw_bytes = connector.download_file(remote_file["id"])
                text = extract_text(raw_bytes, remote_file["file_type"])
                chunks = chunk_text(file_record.id, text)

                self.text_chunks.delete_by_file(file_record.id)
                self.text_chunks.bulk_create(chunks)
                export_chunks_to_vector_store(chunks, owner_id=source.owner_id)

                self.file_records.update_status(
                    file_record.id, "processed", datetime.now(timezone.utc)
                )
                processed += 1

            except Exception:
                failed += 1
                if file_record is not None:
                    self.file_records.update_status(file_record.id, "failed")

        self.sources.update_status(source_id, "active")
        self.sync_logs.mark_completed(
            sync_log.id,
            status="success" if failed == 0 else "partial",
            processed=processed,
            failed=failed,
        )
        return sync_log