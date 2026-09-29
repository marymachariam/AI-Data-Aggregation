# Aggre8

Aggre8 connects the tools a company already uses Google Drive, Dropbox, Slack, Notion, SharePoint, Airtable, a SQL database, Zendesk, email, or a website  pulls their files and messages on a schedule, cleans and chunks the text, and indexes it in ChromaDB. A built-in assistant and Knowledge chat then answer questions from that indexed data, with per-company data isolation throughout.

## Architecture

- **Backend** (`Backend/`): FastAPI + SQLAlchemy + Postgres. Connectors implement a shared interface (`authenticate`, `list_files`, `download_file`); a scheduler syncs every active source on an interval; extracted text is chunked and pushed to ChromaDB, scoped per company via an `owner_id` metadata filter.
- **Frontend** (`frontend/`): Next.js (TypeScript, App Router), inline styles, no CSS framework. Talks to the backend over a REST API with a JWT bearer token.
- **Chat**: powered by Groq (OpenAI-compatible chat completions API).

## Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 16+
- A Groq API key ([console.groq.com](https://console.groq.com))
- Tesseract OCR (`apt-get install tesseract-ocr`) — only needed if you sync/upload images

## Backend setup

```bash
cd Backend
pip install -r requirements.txt
```

Create `Backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aggre8_db
SECRET_KEY=generate_with_python_-c_"import secrets; print(secrets.token_hex(32))"
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_ORIGINS=http://localhost:3000

GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile

GOOGLE_DRIVE_CREDENTIALS_PATH=credentials.json
```

Create the database and run migrations:

```bash
createdb aggre8_db
alembic upgrade head
```

Run it:

```bash
uvicorn main:app --reload
```

API docs live at `http://127.0.0.1:8000/docs`.

### Schema changes

After editing anything in `app/models/`:

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

Never delete `app.db` / the database to "fix" a schema mismatch once Alembic is in use — write a migration instead.

## Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Run it:

```bash
npm run dev
```

App runs at `http://localhost:3000`.

## Connecting a data source

Each connector needs its own credentials, entered when adding the source in **Data sources → Add source**:

| Source | What you need |
|---|---|
| Google Drive | OAuth client (Desktop app type) from Google Cloud Console; first sync opens a browser consent screen |
| Dropbox | Access token from the Dropbox App Console |
| Slack | Bot token (`xoxb-...`) with `channels:history`, `channels:read`, `users:read`; bot must be invited to each channel |
| Notion | Internal integration token; pages must be explicitly shared with the integration |
| SharePoint / OneDrive | Azure AD app (client credentials flow) with `Sites.Read.All`, plus the target drive ID |
| Airtable | Personal access token + base ID |
| SQL database | A read-only connection URL |
| Zendesk | Subdomain, agent email, API token |
| Email (IMAP) | Host, address, an app password (not your regular login password) |
| Website crawler | Just a starting URL  no credentials |
| Manual upload | Nothing  drag and drop files directly |

## Deployment

- **Backend**: build from `Backend/Dockerfile` on Render/Railway/Fly. Set every env var above as a platform secret. Run `alembic upgrade head` once after first deploy.
- **Frontend**: build from `frontend/Dockerfile`, or deploy directly to Vercel. Set `NEXT_PUBLIC_API_URL` to the backend's public URL.
- Add the frontend's deployed URL to `FRONTEND_ORIGINS` on the backend, or the browser will block every request with a CORS error.
- Local Docker Compose (`docker-compose.yml` at the repo root) spins up Postgres + backend + frontend together for local testing, if Docker is available on your machine.

## Known limitations (read before real customers use this)

- No per-user rate limiting on `/chat` or `/chat/assistant`  every request costs a Groq API call on your key.
- Only the Dropbox connector reads credentials per-source from the database; the rest still fall back to shared `.env` values, meaning multiple companies using the same connector type currently share one set of credentials for it.
- Google Drive's OAuth app is in "testing" mode until it passes Google's verification — only manually added test users can connect it, and their login expires every 7 days.
- JWT is stored in `localStorage`, not an httpOnly cookie.