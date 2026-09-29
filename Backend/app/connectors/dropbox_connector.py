import os
import dropbox

from app.connectors.base import BaseConnector

EXTENSION_TO_MIME = {
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


class DropboxConnector(BaseConnector):
    """Connector for a single Dropbox account.

    Simplest path for a first pass: generate a long-lived access token
    from the Dropbox App Console (App > Settings > "Generate access
    token") and set it as DROPBOX_ACCESS_TOKEN. That token expires after
    a few hours on newer apps — swap to a full refresh-token OAuth flow
    (same shape as the Drive connector) once this needs to run
    unattended for longer than that.
    """

    def __init__(self, access_token: str | None = None):
        self.access_token = access_token or os.getenv("DROPBOX_ACCESS_TOKEN")
        self.client = None

    def authenticate(self):
        if not self.access_token:
            raise ValueError(
                "No Dropbox access token found. Set DROPBOX_ACCESS_TOKEN."
            )
        self.client = dropbox.Dropbox(self.access_token)
        return self.client

    def list_files(self) -> list[dict]:
        if self.client is None:
            self.authenticate()

        files: list[dict] = []
        result = self.client.files_list_folder(path="", recursive=True)

        while True:
            for entry in result.entries:
                if isinstance(entry, dropbox.files.FileMetadata):
                    _, ext = os.path.splitext(entry.name.lower())
                    files.append(
                        {
                            "id": entry.path_lower,
                            "name": entry.name,
                            "file_type": EXTENSION_TO_MIME.get(ext, "application/octet-stream"),
                            "modified_time": entry.client_modified.isoformat(),
                            # content_hash changes whenever file bytes change —
                            # exactly what fingerprint is for.
                            "fingerprint": entry.content_hash,
                        }
                    )

            if not result.has_more:
                break
            result = self.client.files_list_folder_continue(result.cursor)

        return files

    def download_file(self, file_id: str) -> bytes:
        if self.client is None:
            self.authenticate()

        _, response = self.client.files_download(path=file_id)
        return response.content