import os
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

from app.connectors.base import BaseConnector


class WebsiteCrawlerConnector(BaseConnector):
    """No auth at all — just a starting URL, crawled breadth-first up to
    max_pages, staying on the same domain. Each page's visible text
    becomes one 'file'. Good for public docs/FAQ/product pages; not a
    substitute for a real connector when an API exists.
    """

    def __init__(self, start_url: str | None = None, max_pages: int | None = None):
        self.start_url = start_url or os.getenv("WEBSITE_CRAWL_START_URL")
        self.max_pages = max_pages or int(os.getenv("WEBSITE_CRAWL_MAX_PAGES", "50"))
        self._page_cache: dict[str, str] = {}

    def authenticate(self):
        if not self.start_url:
            raise ValueError("Set WEBSITE_CRAWL_START_URL.")
        return True

    def list_files(self) -> list[dict]:
        if not self.start_url:
            self.authenticate()

        domain = urlparse(self.start_url).netloc
        visited: set[str] = set()
        queue = [self.start_url]
        files: list[dict] = []

        while queue and len(visited) < self.max_pages:
            url = queue.pop(0)
            if url in visited:
                continue
            visited.add(url)

            try:
                response = requests.get(url, timeout=10)
                response.raise_for_status()
            except requests.RequestException:
                continue

            soup = BeautifulSoup(response.text, "html.parser")
            text = soup.get_text(separator="\n", strip=True)
            self._page_cache[url] = text

            files.append(
                {
                    "id": url,
                    "name": url,
                    "file_type": "text/plain",
                    "modified_time": None,
                    "fingerprint": str(hash(text)),
                }
            )

            for link in soup.find_all("a", href=True):
                next_url = urljoin(url, link["href"]).split("#")[0]
                if urlparse(next_url).netloc == domain and next_url not in visited:
                    queue.append(next_url)

        return files

    def download_file(self, file_id: str) -> bytes:
        if file_id in self._page_cache:
            return self._page_cache[file_id].encode("utf-8")
        response = requests.get(file_id, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        return soup.get_text(separator="\n", strip=True).encode("utf-8")