from app.connectors.sql_connector import SQLConnector
from app.services.base_sync_service import BaseSyncService


class SQLSyncService(BaseSyncService):
    def sync(self, source_id: str):
        return self.run(source_id, SQLConnector())