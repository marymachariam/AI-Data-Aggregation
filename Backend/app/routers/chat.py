from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from app.models.user import User
from app.repositories.chat_log_repository import ChatLogRepository
from app.services.auth_service import get_current_user
from app.services.chat_service import answer_question, assistant_reply, knowledge_summary
from app.services.groq_service import GroqError
from app.services.workspace_service import workspace_snapshot

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatTurn] = Field(default_factory=list, max_length=10)


class FeedbackRequest(BaseModel):
    log_id: str
    rating: Literal["up", "down"]


@router.post("")
def knowledge_chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return answer_question(db, current_user.id, payload.message, payload.history)
    except GroqError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/assistant")
def assistant_chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return assistant_reply(db, current_user.id, payload.message, payload.history)
    except GroqError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/feedback")
def submit_feedback(
    payload: FeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logs = ChatLogRepository(db)
    log = logs.get_for_owner(payload.log_id, current_user.id)
    if log is None:
        raise HTTPException(status_code=404, detail="Answer not found.")
    logs.set_rating(log, payload.rating)
    return {"status": "saved"}


@router.get("/insights")
def insights(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    snapshot = workspace_snapshot(db, current_user.id)
    logs = ChatLogRepository(db)
    gaps = [
        {
            "id": g.id,
            "question": g.question,
            "created_at": g.created_at.isoformat() if g.created_at else None,
            "reason": "no_sources" if g.source_count == 0 else "downvoted",
        }
        for g in logs.knowledge_gaps(current_user.id)
    ]
    return {
        "sources": snapshot["source_count"],
        "files_indexed": snapshot["files_processed"],
        "files_failed": snapshot["files_failed"],
        "chunks": snapshot["chunks"],
        "feedback": logs.rating_counts(current_user.id),
        "gaps": gaps,
    }


@router.post("/insights/summary")
def insights_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return knowledge_summary(db, current_user.id)
    except GroqError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc