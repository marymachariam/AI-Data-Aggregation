from dotenv import load_dotenv

load_dotenv()

import os  # noqa: E402

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from database import Base, engine  # noqa: E402
from app.models import user, source, file_record, text_chunk, sync_log, chat_log  # noqa: E402,F401
from app.routers import auth, sources, search, uploads, chat  # noqa: E402
from app.services.scheduler import start_scheduler  # noqa: E402

app = FastAPI(title="AI-Ready Data Aggregator")

allowed_origins = [
    o.strip()
    for o in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(sources.router)
app.include_router(search.router)
app.include_router(uploads.router)
app.include_router(chat.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    start_scheduler()


@app.get("/health")
def health_check():
    return {"status": "ok"}