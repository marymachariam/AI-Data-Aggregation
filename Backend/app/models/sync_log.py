from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(String, primary_key=True, index=True)
    source_id = Column(String, ForeignKey("sources.id"), nullable=False)
    run_started_at = Column(DateTime(timezone=True), server_default=func.now())
    run_completed_at = Column(DateTime(timezone=True), nullable=True)
    files_processed_count = Column(Integer, default=0)
    files_failed_count = Column(Integer, default=0)
    status = Column(String, default="running")  # success / partial / failed