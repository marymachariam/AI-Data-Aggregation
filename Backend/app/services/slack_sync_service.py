from app.connectors.slack_connector import SlackConnector
from app.services.base_sync_service import BaseSyncService


class SlackSyncService(BaseSyncService):
    def sync(self, source_id: str):
        connector = SlackConnector()
        return self.run(source_id, connector)