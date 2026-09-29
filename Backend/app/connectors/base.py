from abc import ABC, abstractmethod


class BaseConnector(ABC):
    """Every source connector (Google Drive, Slack, etc.) implements this."""

    @abstractmethod
    def authenticate(self):
        """Log in / establish a connection to the source."""
        raise NotImplementedError

    @abstractmethod
    def list_files(self) -> list[dict]:
        """Return a list of files available at the source, with at least
        an id, name, and file type for each."""
        raise NotImplementedError

    @abstractmethod
    def download_file(self, file_id: str) -> bytes:
        """Return the raw bytes of a single file."""
        raise NotImplementedError