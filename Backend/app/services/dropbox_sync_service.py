from app.connectors.dropbox_connector import DropboxConnector
from app.services.base_sync_service import BaseSyncService


class DropboxSyncService(BaseSyncService):
    def sync(self, source_id: str):
        connector = DropboxConnector()
        return self.run(source_id, connector)