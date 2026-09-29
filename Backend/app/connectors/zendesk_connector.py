import os
import requests

from app.connectors.base import BaseConnector


class ZendeskConnector(BaseConnector):
    """Treats each support ticket as one 'file' — subject + full comment
    thread flattened to text, which is the real Q&A shape that's most
    useful for RAG/training. Needs a subdomain
    (yourcompany.zendesk.com -> 'yourcompany'), an agent email, and an
    API token (Admin Center > Apps and integrations > APIs > Zendesk
    API > Token access).
    """

    def __init__(self, subdomain=None, email=None, api_token=None):
        self.subdomain = subdomain or os.getenv("ZENDESK_SUBDOMAIN")
        self.email = email or os.getenv("ZENDESK_EMAIL")
        self.api_token = api_token or os.getenv("ZENDESK_API_TOKEN")
        self.auth = None

    def authenticate(self):
        if not all([self.subdomain, self.email, self.api_token]):
            raise ValueError("Set ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN.")
        self.auth = (f"{self.email}/token", self.api_token)
        return self.auth

    def _base_url(self) -> str:
        return f"https://{self.subdomain}.zendesk.com/api/v2"

    def list_files(self) -> list[dict]:
        if self.auth is None:
            self.authenticate()

        tickets: list[dict] = []
        url = f"{self._base_url()}/tickets.json"
        while url:
            response = requests.get(url, auth=self.auth)
            response.raise_for_status()
            data = response.json()
            for ticket in data.get("tickets", []):
                tickets.append(
                    {
                        "id": str(ticket["id"]),
                        "name": ticket.get("subject") or f"Ticket #{ticket['id']}",
                        "file_type": "text/plain",
                        "modified_time": ticket.get("updated_at"),
                        "fingerprint": ticket.get("updated_at"),
                    }
                )
            url = data.get("next_page")
        return tickets

    def download_file(self, file_id: str) -> bytes:
        if self.auth is None:
            self.authenticate()
        url = f"{self._base_url()}/tickets/{file_id}/comments.json"
        response = requests.get(url, auth=self.auth)
        response.raise_for_status()
        comments = response.json().get("comments", [])
        lines = [c.get("plain_body") or c.get("body", "") for c in comments]
        return "\n\n".join(lines).encode("utf-8")