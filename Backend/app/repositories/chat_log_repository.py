from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.chat_log import ChatLog


class ChatLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, log: ChatLog) -> ChatLog:
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def get_for_owner(self, log_id: str, owner_id: str) -> ChatLog | None:
        return (
            self.db.query(ChatLog)
            .filter(ChatLog.id == log_id, ChatLog.owner_id == owner_id)
            .first()
        )

    def set_rating(self, log: ChatLog, rating: str) -> None:
        log.rating = rating
        self.db.commit()

    def rating_counts(self, owner_id: str) -> dict:
        rows = (
            self.db.query(ChatLog.rating, func.count(ChatLog.id))
            .filter(ChatLog.owner_id == owner_id, ChatLog.rating.isnot(None))
            .group_by(ChatLog.rating)
            .all()
        )
        counts = {"up": 0, "down": 0}
        for rating, total in rows:
            counts[rating] = total
        return counts

    def knowledge_gaps(self, owner_id: str, limit: int = 8) -> list[ChatLog]:
        return (
            self.db.query(ChatLog)
            .filter(
                ChatLog.owner_id == owner_id,
                ChatLog.channel == "knowledge",
                or_(ChatLog.source_count == 0, ChatLog.rating == "down"),
            )
            .order_by(ChatLog.created_at.desc())
            .limit(limit)
            .all()
        )