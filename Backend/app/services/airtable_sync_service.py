from app.connectors.airtable_connector import AirtableConnector
from app.services.base_sync_service import BaseSyncService


class AirtableSyncService(BaseSyncService):
    def sync(self, source_id: str):
        return self.run(source_id, AirtableConnector())