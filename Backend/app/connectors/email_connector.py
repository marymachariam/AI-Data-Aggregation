import email
import hashlib
import imaplib
import os
from email.header import decode_header

from app.connectors.base import BaseConnector


class EmailConnector(BaseConnector):
    """IMAP connector — works with Gmail, Outlook, Yahoo, or any provider
    that exposes IMAP. Each email becomes one 'file'.

    For Gmail specifically: regular password won't work if 2FA is on
    (it usually is) — generate an "app password" instead, from Google
    Account > Security > 2-Step Verification > App passwords.

    Set:
      EMAIL_IMAP_HOST (e.g. imap.gmail.com)
      EMAIL_IMAP_PORT (default 993)
      EMAIL_ADDRESS
      EMAIL_PASSWORD (the app password, not your normal login password)
      EMAIL_FOLDER (default INBOX)
      EMAIL_MAX_MESSAGES (default 200 — most recent N, to keep first
        syncs fast on large mailboxes)
    """

    def __init__(
        self,
        host: str | None = None,
        port: int | None = None,
        address: str | None = None,
        password: str | None = None,
        folder: str | None = None,
        max_messages: int | None = None,
    ):
        self.host = host or os.getenv("EMAIL_IMAP_HOST")
        self.port = port or int(os.getenv("EMAIL_IMAP_PORT", "993"))
        self.address = address or os.getenv("EMAIL_ADDRESS")
        self.password = password or os.getenv("EMAIL_PASSWORD")
        self.folder = folder or os.getenv("EMAIL_FOLDER", "INBOX")
        self.max_messages = max_messages or int(os.getenv("EMAIL_MAX_MESSAGES", "200"))
        self.connection = None

    def authenticate(self):
        if not all([self.host, self.address, self.password]):
            raise ValueError("Set EMAIL_IMAP_HOST, EMAIL_ADDRESS, EMAIL_PASSWORD.")

        self.connection = imaplib.IMAP4_SSL(self.host, self.port)
        self.connection.login(self.address, self.password)
        self.connection.select(self.folder)
        return self.connection

    def _decode(self, raw) -> str:
        if raw is None:
            return ""
        parts = decode_header(raw)
        decoded = ""
        for text, encoding in parts:
            if isinstance(text, bytes):
                decoded += text.decode(encoding or "utf-8", errors="ignore")
            else:
                decoded += text
        return decoded

    def list_files(self) -> list[dict]:
        if self.connection is None:
            self.authenticate()

        status, data = self.connection.search(None, "ALL")
        if status != "OK":
            return []

        message_ids = data[0].split()
        # most recent first, capped at max_messages
        message_ids = message_ids[-self.max_messages:]

        files: list[dict] = []
        for msg_id in message_ids:
            status, header_data = self.connection.fetch(
                msg_id, "(BODY.PEEK[HEADER.FIELDS (SUBJECT DATE)])"
            )
            if status != "OK":
                continue

            header_bytes = header_data[0][1]
            parsed = email.message_from_bytes(header_bytes)
            subject = self._decode(parsed.get("Subject")) or "(no subject)"
            date = parsed.get("Date", "")

            files.append(
                {
                    "id": msg_id.decode(),
                    "name": subject,
                    "file_type": "text/plain",
                    "modified_time": date,
                    # message UID never changes for a given email, so
                    # once processed it's never re-processed
                    "fingerprint": msg_id.decode(),
                }
            )

        return files

    def download_file(self, file_id: str) -> bytes:
        if self.connection is None:
            self.authenticate()

        status, data = self.connection.fetch(file_id.encode(), "(RFC822)")
        if status != "OK":
            raise RuntimeError(f"Could not fetch message {file_id!r}")

        parsed = email.message_from_bytes(data[0][1])
        subject = self._decode(parsed.get("Subject"))
        sender = self._decode(parsed.get("From"))
        date = parsed.get("Date", "")

        body_parts = []
        if parsed.is_multipart():
            for part in parsed.walk():
                content_type = part.get_content_type()
                disposition = str(part.get("Content-Disposition", ""))
                if content_type == "text/plain" and "attachment" not in disposition:
                    payload = part.get_payload(decode=True)
                    if payload:
                        body_parts.append(
                            payload.decode(part.get_content_charset() or "utf-8", errors="ignore")
                        )
        else:
            payload = parsed.get_payload(decode=True)
            if payload:
                body_parts.append(
                    payload.decode(parsed.get_content_charset() or "utf-8", errors="ignore")
                )

        full_text = (
            f"Subject: {subject}\nFrom: {sender}\nDate: {date}\n\n"
            + "\n".join(body_parts)
        )
        return full_text.encode("utf-8")