from app.connectors.zendesk_connector import ZendeskConnector
from app.services.base_sync_service import BaseSyncService


class ZendeskSyncService(BaseSyncService):
    def sync(self, source_id: str):
        return self.run(source_id, ZendeskConnector())