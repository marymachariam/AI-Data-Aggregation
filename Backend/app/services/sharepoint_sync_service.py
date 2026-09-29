from app.connectors.sharepoint_connector import SharePointConnector
from app.services.base_sync_service import BaseSyncService


class SharePointSyncService(BaseSyncService):
    def sync(self, source_id: str):
        return self.run(source_id, SharePointConnector())