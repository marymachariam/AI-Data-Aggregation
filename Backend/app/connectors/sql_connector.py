import os
from sqlalchemy import create_engine, inspect, text

from app.connectors.base import BaseConnector


class SQLConnector(BaseConnector):
    """Treats each *table* in a company database as one 'file' — rows
    flattened to plain text. Point this at a read-only user or replica,
    never a production write user — this connector only ever runs
    SELECTs, but least-privilege still applies. Set
    SQL_SOURCE_DATABASE_URL, e.g.
    postgresql://readonly_user:pass@host:5432/dbname
    """

    def __init__(self, database_url: str | None = None):
        self.database_url = database_url or os.getenv("SQL_SOURCE_DATABASE_URL")
        self.engine = None

    def authenticate(self):
        if not self.database_url:
            raise ValueError("Set SQL_SOURCE_DATABASE_URL.")
        self.engine = create_engine(self.database_url)
        with self.engine.connect():
            pass  # fail fast if credentials/host are wrong
        return self.engine

    def list_files(self) -> list[dict]:
        if self.engine is None:
            self.authenticate()

        inspector = inspect(self.engine)
        files: list[dict] = []
        with self.engine.connect() as conn:
            for table_name in inspector.get_table_names():
                count = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
                files.append(
                    {
                        "id": table_name,
                        "name": table_name,
                        "file_type": "text/plain",
                        "modified_time": None,
                        # Row count as a cheap change signal — misses
                        # in-place updates, catches inserts/deletes.
                        "fingerprint": f"rows:{count}",
                    }
                )
        return files

    def download_file(self, file_id: str) -> bytes:
        if self.engine is None:
            self.authenticate()

        lines = []
        with self.engine.connect() as conn:
            result = conn.execute(text(f"SELECT * FROM {file_id} LIMIT 5000"))
            columns = result.keys()
            for row in result:
                lines.append(", ".join(f"{col}: {val}" for col, val in zip(columns, row)))
        return "\n".join(lines).encode("utf-8")