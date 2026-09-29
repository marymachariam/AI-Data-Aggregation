import logging
import os

from apscheduler.schedulers.background import BackgroundScheduler

from database import SessionLocal
from app.repositories.source_repository import SourceRepository
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

logger = logging.getLogger("aggre8.scheduler")

SYNC_INTERVAL_MINUTES = int(os.getenv("SYNC_INTERVAL_MINUTES", "15"))
GOOGLE_DRIVE_CREDENTIALS_PATH = os.getenv("GOOGLE_DRIVE_CREDENTIALS_PATH", "credentials.json")

_scheduler = None


def sync_all_sources():
    """Runs on a timer, not on request. Walks every connected source and
    pulls in anything new since last time — this is what makes the
    platform 'always scanning' instead of needing someone to click sync.
    """
    db = SessionLocal()
    try:
        sources = SourceRepository(db).get_all()
        for source in sources:
            if source.connection_status != "active":
                continue
            try:
                if source.type == "google_drive":
                    GoogleDriveSyncService(db).sync(source.id, GOOGLE_DRIVE_CREDENTIALS_PATH)
                elif source.type == "dropbox":
                    DropboxSyncService(db).sync(source.id)
                elif source.type == "slack":
                    SlackSyncService(db).sync(source.id)
                elif source.type == "notion":
                    NotionSyncService(db).sync(source.id)
                elif source.type == "sharepoint":
                    SharePointSyncService(db).sync(source.id)
                elif source.type == "airtable":
                    AirtableSyncService(db).sync(source.id)
                elif source.type == "sql":
                    SQLSyncService(db).sync(source.id)
                elif source.type == "zendesk":
                    ZendeskSyncService(db).sync(source.id)
                elif source.type == "website_crawler":
                    WebsiteCrawlerSyncService(db).sync(source.id)
                elif source.type == "email":
                    EmailSyncService(db).sync(source.id)
                else:
                    logger.warning("No sync handler for source type %r", source.type)
                    continue
                logger.info("Synced source %s (%s)", source.id, source.name)
            except Exception:
                logger.exception("Sync failed for source %s (%s)", source.id, source.name)
    finally:
        db.close()


def start_scheduler():
    global _scheduler
    if _scheduler is not None:
        return _scheduler

    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        sync_all_sources,
        "interval",
        minutes=SYNC_INTERVAL_MINUTES,
        id="sync_all_sources",
    )
    _scheduler.start()
    logger.info("Scheduler started — syncing every %s minutes", SYNC_INTERVAL_MINUTES)
    return _scheduler