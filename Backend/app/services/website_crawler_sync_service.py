from app.connectors.website_crawler_connector import WebsiteCrawlerConnector
from app.services.base_sync_service import BaseSyncService


class WebsiteCrawlerSyncService(BaseSyncService):
    def sync(self, source_id: str):
        return self.run(source_id, WebsiteCrawlerConnector())