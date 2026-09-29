from sqlalchemy.orm import Session
from app.models.text_chunk import TextChunk


class TextChunkRepository:
    def __init__(self, db: Session):
        self.db = db

    def bulk_create(self, chunks: list[TextChunk]) -> list[TextChunk]:
        self.db.add_all(chunks)
        self.db.commit()
        for chunk in chunks:
            self.db.refresh(chunk)
        return chunks

    def get_by_file(self, file_id: str) -> list[TextChunk]:
        return (
            self.db.query(TextChunk)
            .filter(TextChunk.file_id == file_id)
            .order_by(TextChunk.chunk_order)
            .all()
        )

    def delete_by_file(self, file_id: str) -> None:
        self.db.query(TextChunk).filter(TextChunk.file_id == file_id).delete()
        self.db.commit()