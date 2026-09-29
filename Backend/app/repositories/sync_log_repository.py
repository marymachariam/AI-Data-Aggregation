from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.models.sync_log import SyncLog


class SyncLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, sync_log: SyncLog) -> SyncLog:
        self.db.add(sync_log)
        self.db.commit()
        self.db.refresh(sync_log)
        return sync_log

    def mark_completed(self, sync_id: str, status: str, processed: int, failed: int) -> None:
        self.db.query(SyncLog).filter(SyncLog.id == sync_id).update(
            {
                "run_completed_at": func.now(),
                "status": status,
                "files_processed_count": processed,
                "files_failed_count": failed,
            }
        )
        self.db.commit()

    def get_by_source(self, source_id: str) -> list[SyncLog]:
        return (
            self.db.query(SyncLog)
            .filter(SyncLog.source_id == source_id)
            .order_by(SyncLog.run_started_at.desc())
            .all()
        )

    def delete_by_source(self, source_id: str) -> None:
        self.db.query(SyncLog).filter(SyncLog.source_id == source_id).delete()
        self.db.commit()
