from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class FileRecord(Base):
    __tablename__ = "file_records"

    id = Column(String, primary_key=True, index=True)
    source_id = Column(String, ForeignKey("sources.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    fingerprint = Column(String, nullable=False) 
    status = Column(String, default="new")  
    last_processed_at = Column(DateTime(timezone=True), nullable=True)