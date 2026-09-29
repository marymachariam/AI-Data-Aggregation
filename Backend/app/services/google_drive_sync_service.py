from app.connectors.google_drive import GoogleDriveConnector
from app.services.base_sync_service import BaseSyncService


class GoogleDriveSyncService(BaseSyncService):
    def sync(self, source_id: str, credentials_path: str):
        connector = GoogleDriveConnector(credentials_path=credentials_path)
        return self.run(source_id, connector)