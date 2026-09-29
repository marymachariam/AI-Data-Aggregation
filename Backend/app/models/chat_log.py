from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from database import Base


class ChatLog(Base):
    __tablename__ = "chat_logs"

    id = Column(String, primary_key=True, index=True)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    channel = Column(String, default="knowledge")
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    source_count = Column(Integer, default=0)
    rating = Column(String, nullable=True)  # "up" or "down"
    created_at = Column(DateTime(timezone=True), server_default=func.now())