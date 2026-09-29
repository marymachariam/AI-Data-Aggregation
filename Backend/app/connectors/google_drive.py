import io
import os
from typing import Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

from app.connectors.base import BaseConnector

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# Google's native Docs/Sheets/Slides have no raw bytes — they must be
# *exported* into a real format first.
GOOGLE_NATIVE_EXPORT_MIME = {
    "application/vnd.google-apps.document": "application/pdf",
    "application/vnd.google-apps.spreadsheet": "text/csv",
    "application/vnd.google-apps.presentation": "application/pdf",
}


class GoogleDriveConnector(BaseConnector):
    """Connector for a single Google Drive account.

    `credentials_path` is the OAuth client secret JSON from Google Cloud
    Console (APIs & Services -> Credentials -> OAuth client ID -> Desktop
    app). `token_path` is where the user token gets cached after the first
    consent screen, so later runs skip the browser step.
    """

    def __init__(self, credentials_path: str, token_path: str = "token.json"):
        self.credentials_path = credentials_path
        self.token_path = token_path
        self.service = None

    def authenticate(self):
        creds: Optional[Credentials] = None

        if os.path.exists(self.token_path):
            creds = Credentials.from_authorized_user_file(self.token_path, SCOPES)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_path, SCOPES
                )
                # Spins up a throwaway local server + opens a browser consent
                # screen. Fine for a dev machine; swap for a web redirect-URI
                # flow once this runs headless on a server.
                creds = flow.run_local_server(port=0)

            with open(self.token_path, "w") as token_file:
                token_file.write(creds.to_json())

        self.service = build("drive", "v3", credentials=creds)
        return self.service

    def list_files(self) -> list[dict]:
        if self.service is None:
            self.authenticate()

        files: list[dict] = []
        page_token = None

        while True:
            response = (
                self.service.files()
                .list(
                    q="trashed = false",
                    spaces="drive",
                    fields="nextPageToken, files(id, name, mimeType, modifiedTime, md5Checksum)",
                    pageToken=page_token,
                )
                .execute()
            )

            for f in response.get("files", []):
                files.append(
                    {
                        "id": f["id"],
                        "name": f["name"],
                        "file_type": f["mimeType"],
                        "modified_time": f.get("modifiedTime"),
                        # md5Checksum is absent for native Docs/Sheets/Slides
                        # (no raw bytes); fall back to modifiedTime as the
                        # change-detection fingerprint for those.
                        "fingerprint": f.get("md5Checksum") or f.get("modifiedTime"),
                    }
                )

            page_token = response.get("nextPageToken")
            if not page_token:
                break

        return files

    def download_file(self, file_id: str) -> bytes:
        if self.service is None:
            self.authenticate()

        metadata = self.service.files().get(fileId=file_id, fields="mimeType").execute()
        mime_type = metadata["mimeType"]

        if mime_type in GOOGLE_NATIVE_EXPORT_MIME:
            request = self.service.files().export_media(
                fileId=file_id, mimeType=GOOGLE_NATIVE_EXPORT_MIME[mime_type]
            )
        else:
            request = self.service.files().get_media(fileId=file_id)

        buffer = io.BytesIO()
        downloader = MediaIoBaseDownload(buffer, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()

        return buffer.getvalue()