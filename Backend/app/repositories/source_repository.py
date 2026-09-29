from sqlalchemy.orm import Session
from app.models.source import Source


class SourceRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, source: Source) -> Source:
        self.db.add(source)
        self.db.commit()
        self.db.refresh(source)
        return source

    def get_by_id(self, source_id: str) -> Source | None:
        return self.db.query(Source).filter(Source.id == source_id).first()

    def get_all(self) -> list[Source]:
        return self.db.query(Source).all()

    def update_status(self, source_id: str, status: str) -> None:
        self.db.query(Source).filter(Source.id == source_id).update(
            {"connection_status": status}
        )
        self.db.commit()
        
    def get_by_owner(self, owner_id: str) -> list[Source]:
        return self.db.query(Source).filter(Source.owner_id == owner_id).all()
    
    def delete(self, source: Source) -> None:
        self.db.delete(source)
        self.db.commit()