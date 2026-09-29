from app.connectors.email_connector import EmailConnector
from app.services.base_sync_service import BaseSyncService


class EmailSyncService(BaseSyncService):
    def sync(self, source_id: str):
        return self.run(source_id, EmailConnector())