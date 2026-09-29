import os
from notion_client import Client

from app.connectors.base import BaseConnector


class NotionConnector(BaseConnector):
    """Needs an internal integration token (secret_...) from
    notion.so/my-integrations. Notion has no 'grant access to
    everything' option — each page/database has to be explicitly
    shared with the integration from inside Notion.
    """

    def __init__(self, token: str | None = None):
        self.token = token or os.getenv("NOTION_API_TOKEN")
        self.client = None

    def authenticate(self):
        if not self.token:
            raise ValueError("No Notion token found. Set NOTION_API_TOKEN.")
        self.client = Client(auth=self.token)
        return self.client

    def list_files(self) -> list[dict]:
        if self.client is None:
            self.authenticate()

        pages: list[dict] = []
        cursor = None

        while True:
            response = self.client.search(
                filter={"property": "object", "value": "page"}, start_cursor=cursor
            )
            for page in response["results"]:
                pages.append(
                    {
                        "id": page["id"],
                        "name": self._extract_title(page),
                        "file_type": "text/plain",
                        "modified_time": page["last_edited_time"],
                        "fingerprint": page["last_edited_time"],
                    }
                )
            cursor = response.get("next_cursor")
            if not response.get("has_more"):
                break

        return pages

    def _extract_title(self, page: dict) -> str:
        for prop in page.get("properties", {}).values():
            if prop.get("type") == "title" and prop["title"]:
                return "".join(t["plain_text"] for t in prop["title"])
        return page["id"]

    def download_file(self, file_id: str) -> bytes:
        if self.client is None:
            self.authenticate()

        blocks = self._get_all_blocks(file_id)
        lines = [self._block_to_text(b) for b in blocks]
        return "\n".join(line for line in lines if line).encode("utf-8")

    def _get_all_blocks(self, block_id: str) -> list[dict]:
        blocks, cursor = [], None
        while True:
            response = self.client.blocks.children.list(block_id=block_id, start_cursor=cursor)
            blocks.extend(response["results"])
            cursor = response.get("next_cursor")
            if not response.get("has_more"):
                break
        return blocks

    def _block_to_text(self, block: dict) -> str:
        content = block.get(block.get("type"), {})
        return "".join(t.get("plain_text", "") for t in content.get("rich_text", []))