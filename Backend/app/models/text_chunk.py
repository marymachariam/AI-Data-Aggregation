from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from database import Base


class TextChunk(Base):
    __tablename__ = "text_chunks"

    id = Column(String, primary_key=True, index=True)
    file_id = Column(String, ForeignKey("file_records.id"), nullable=False)
    chunk_text = Column(Text, nullable=False)
    chunk_order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())