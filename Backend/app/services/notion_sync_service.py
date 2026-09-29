from app.connectors.notion_connector import NotionConnector
from app.services.base_sync_service import BaseSyncService


class NotionSyncService(BaseSyncService):
    def sync(self, source_id: str):
        connector = NotionConnector()
        return self.run(source_id, connector)