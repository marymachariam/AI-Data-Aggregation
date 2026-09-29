import os
from pyairtable import Api

from app.connectors.base import BaseConnector


class AirtableConnector(BaseConnector):
    """Treats each Airtable *table* as one 'file': every record gets
    flattened into plain text, so the whole table becomes one
    searchable document. Needs a personal access token
    (data.records:read scope) and the base ID (starts with 'app...').
    """

    def __init__(self, token: str | None = None, base_id: str | None = None):
        self.token = token or os.getenv("AIRTABLE_TOKEN")
        self.base_id = base_id or os.getenv("AIRTABLE_BASE_ID")
        self.api = None

    def authenticate(self):
        if not self.token or not self.base_id:
            raise ValueError("Set AIRTABLE_TOKEN and AIRTABLE_BASE_ID.")
        self.api = Api(self.token)
        return self.api

    def list_files(self) -> list[dict]:
        if self.api is None:
            self.authenticate()

        base = self.api.base(self.base_id)
        tables = base.schema().tables

        files: list[dict] = []
        for table in tables:
            records = base.table(table.id).all()
            # Row count + last record id: cheap change signal without
            # hashing every cell of every row.
            fingerprint = f"{len(records)}:{records[-1]['id'] if records else 'empty'}"
            files.append(
                {
                    "id": table.id,
                    "name": table.name,
                    "file_type": "text/plain",
                    "modified_time": None,
                    "fingerprint": fingerprint,
                }
            )
        return files

    def download_file(self, file_id: str) -> bytes:
        if self.api is None:
            self.authenticate()

        table = self.api.base(self.base_id).table(file_id)
        lines = []
        for record in table.all():
            fields = record.get("fields", {})
            lines.append(", ".join(f"{k}: {v}" for k, v in fields.items()))
        return "\n".join(lines).encode("utf-8")