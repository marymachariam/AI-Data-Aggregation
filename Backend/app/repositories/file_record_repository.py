from sqlalchemy.orm import Session
from app.models.file_record import FileRecord


class FileRecordRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, file_record: FileRecord) -> FileRecord:
        self.db.add(file_record)
        self.db.commit()
        self.db.refresh(file_record)
        return file_record

    def get_by_id(self, file_id: str) -> FileRecord | None:
        return self.db.query(FileRecord).filter(FileRecord.id == file_id).first()

    def get_by_source(self, source_id: str) -> list[FileRecord]:
        return self.db.query(FileRecord).filter(FileRecord.source_id == source_id).all()

    def get_by_fingerprint(self, source_id: str, fingerprint: str) -> FileRecord | None:
        return (
            self.db.query(FileRecord)
            .filter(
                FileRecord.source_id == source_id,
                FileRecord.fingerprint == fingerprint,
            )
            .first()
        )

    def update_status(self, file_id: str, status: str, processed_at=None) -> None:
        values = {"status": status}
        if processed_at is not None:
            values["last_processed_at"] = processed_at
        self.db.query(FileRecord).filter(FileRecord.id == file_id).update(values)
        self.db.commit()
        
    def delete_by_source(self, source_id: str) -> None:
        self.db.query(FileRecord).filter(FileRecord.source_id == source_id).delete()
        self.db.commit()