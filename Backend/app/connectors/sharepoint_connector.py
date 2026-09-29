import os
import requests
import msal

from app.connectors.base import BaseConnector

GRAPH_BASE = "https://graph.microsoft.com/v1.0"

EXTENSION_TO_MIME = {
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


class SharePointConnector(BaseConnector):
    """Connector for a single SharePoint/OneDrive document library, via
    Microsoft Graph. Uses an app-only (client credentials) flow — no
    interactive login — so it needs an Azure AD app registration with
    Sites.Read.All (application permission, admin-consented), plus the
    target drive's ID (Graph /sites/{site}/drives to find it).
    """

    def __init__(
        self,
        tenant_id: str | None = None,
        client_id: str | None = None,
        client_secret: str | None = None,
        drive_id: str | None = None,
    ):
        self.tenant_id = tenant_id or os.getenv("SHAREPOINT_TENANT_ID")
        self.client_id = client_id or os.getenv("SHAREPOINT_CLIENT_ID")
        self.client_secret = client_secret or os.getenv("SHAREPOINT_CLIENT_SECRET")
        self.drive_id = drive_id or os.getenv("SHAREPOINT_DRIVE_ID")
        self.token = None

    def authenticate(self):
        if not all([self.tenant_id, self.client_id, self.client_secret, self.drive_id]):
            raise ValueError(
                "Missing one of SHAREPOINT_TENANT_ID, SHAREPOINT_CLIENT_ID, "
                "SHAREPOINT_CLIENT_SECRET, SHAREPOINT_DRIVE_ID."
            )
        app = msal.ConfidentialClientApplication(
            client_id=self.client_id,
            client_credential=self.client_secret,
            authority=f"https://login.microsoftonline.com/{self.tenant_id}",
        )
        result = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
        if "access_token" not in result:
            raise RuntimeError(f"SharePoint auth failed: {result.get('error_description')}")
        self.token = result["access_token"]
        return self.token

    def _headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    def list_files(self) -> list[dict]:
        if self.token is None:
            self.authenticate()

        files: list[dict] = []

        def walk(item_id: str = "root"):
            url = f"{GRAPH_BASE}/drives/{self.drive_id}/items/{item_id}/children"
            while url:
                response = requests.get(url, headers=self._headers())
                response.raise_for_status()
                data = response.json()

                for item in data.get("value", []):
                    if "folder" in item:
                        walk(item["id"])
                        continue
                    _, ext = os.path.splitext(item["name"].lower())
                    files.append(
                        {
                            "id": item["id"],
                            "name": item["name"],
                            "file_type": EXTENSION_TO_MIME.get(ext, "application/octet-stream"),
                            "modified_time": item.get("lastModifiedDateTime"),
                            "fingerprint": item.get("eTag") or item.get("lastModifiedDateTime"),
                        }
                    )
                url = data.get("@odata.nextLink")

        walk()
        return files

    def download_file(self, file_id: str) -> bytes:
        if self.token is None:
            self.authenticate()
        url = f"{GRAPH_BASE}/drives/{self.drive_id}/items/{file_id}/content"
        response = requests.get(url, headers=self._headers())
        response.raise_for_status()
        return response.content