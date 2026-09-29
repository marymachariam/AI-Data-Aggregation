import io
from pypdf import PdfReader


def extract_text(file_bytes: bytes, file_type: str) -> str:
    """Turn raw downloaded bytes into plain text, keyed on the file's
    *original* Drive mimeType (not the exported one — a Google Doc still
    shows up here as application/vnd.google-apps.document even though
    download_file() actually fetched a PDF for it).
    """

    if file_type in ("application/pdf", "application/vnd.google-apps.document"):
        reader = PdfReader(io.BytesIO(file_bytes))
        return "\n\n".join(page.extract_text() or "" for page in reader.pages)

    if file_type in (
        "text/plain",
        "text/csv",
        "application/vnd.google-apps.spreadsheet",
    ):
        return file_bytes.decode("utf-8", errors="ignore")

    if file_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        from docx import Document

        doc = Document(io.BytesIO(file_bytes))
        return "\n".join(p.text for p in doc.paragraphs)

    raise ValueError(f"No text extractor for file_type={file_type!r}")