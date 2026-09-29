import os
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from app.models.source import Source
from app.models.user import User
from app.repositories.source_repository import SourceRepository
from app.services.auth_service import get_current_user
from app.services.google_drive_sync_service import GoogleDriveSyncService
from app.services.dropbox_sync_service import DropboxSyncService
from app.services.slack_sync_service import SlackSyncService
from app.services.notion_sync_service import NotionSyncService
from app.services.sharepoint_sync_service import SharePointSyncService
from app.services.airtable_sync_service import AirtableSyncService
from app.services.sql_sync_service import SQLSyncService
from app.services.zendesk_sync_service import ZendeskSyncService
from app.services.website_crawler_sync_service import WebsiteCrawlerSyncService
from app.services.email_sync_service import EmailSyncService
from app.services.vector_exporter import delete_chunks_for_files
from app.repositories.file_record_repository import FileRecordRepository
from app.repositories.sync_log_repository import SyncLogRepository

router = APIRouter(prefix="/sources", tags=["sources"])


class SourceCreate(BaseModel):
    name: str
    type: str = "google_drive"


@router.post("")
def create_source(
    payload: SourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = SourceRepository(db)
    return repo.create(
        Source(
            id=str(uuid.uuid4()),
            owner_id=current_user.id,
            name=payload.name,
            type=payload.type,
        )
    )


@router.get("")
def list_sources(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return SourceRepository(db).get_by_owner(current_user.id)


def _get_owned_source(source_id: str, db: Session, current_user: User) -> Source:
    source = SourceRepository(db).get_by_id(source_id)
    if source is None or source.owner_id != current_user.id:
        # 404, not 403 — don't reveal that a source exists but belongs
        # to someone else.
        raise HTTPException(status_code=404, detail=f"No source with id={source_id!r}")
    return source


@router.post("/{source_id}/sync")
def sync_source(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    source = _get_owned_source(source_id, db, current_user)

    if source.type == "google_drive":
        credentials_path = os.getenv("GOOGLE_DRIVE_CREDENTIALS_PATH", "credentials.json")
        if not os.path.exists(credentials_path):
            raise HTTPException(400, f"No OAuth client secret found at {credentials_path}.")
        return GoogleDriveSyncService(db).sync(source_id, credentials_path)

    if source.type == "dropbox":
        return DropboxSyncService(db).sync(source_id)

    if source.type == "slack":
        return SlackSyncService(db).sync(source_id)

    if source.type == "notion":
        return NotionSyncService(db).sync(source_id)

    if source.type == "sharepoint":
        return SharePointSyncService(db).sync(source_id)

    if source.type == "airtable":
        return AirtableSyncService(db).sync(source_id)

    if source.type == "sql":
        return SQLSyncService(db).sync(source_id)

    if source.type == "zendesk":
        return ZendeskSyncService(db).sync(source_id)

    if source.type == "website_crawler":
        return WebsiteCrawlerSyncService(db).sync(source_id)

    if source.type == "email":
        return EmailSyncService(db).sync(source_id)

    raise HTTPException(400, f"Unknown source type {source.type!r}")

@router.delete("/{source_id}")
def delete_source(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    source = _get_owned_source(source_id, db, current_user)

    file_repo = FileRecordRepository(db)
    file_ids = [f.id for f in file_repo.get_by_source(source_id)]
    delete_chunks_for_files(file_ids)

    file_repo.delete_by_source(source_id)
    SyncLogRepository(db).delete_by_source(source_id)
    SourceRepository(db).delete(source)

    return {"status": "deleted"}