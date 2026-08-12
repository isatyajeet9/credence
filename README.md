# Credence

A plagiarism and AI-content detection platform. Every score comes with visible evidence — the matched source, the excerpt, the reasoning — instead of a bare percentage. Covers text (plagiarism + AI-generated text) and images (AI-generation likelihood + C2PA provenance), with real accounts, free/pro plans, usage limits, Razorpay billing, and downloadable PDF reports.

Built for an MCA project at Siksha 'O' Anusandhan Deemed University, ITER, by Satyajeet Nayak, Subhankar Sahoo, and Priyanka Priyadarshini Pradhan.

## Tech stack

| | |
|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS v4 |
| Backend | FastAPI (Python) |
| Database | PostgreSQL 17, SQLAlchemy + Alembic migrations |
| Plagiarism matching | `sentence-transformers` (`all-MiniLM-L6-v2`) — a pre-trained model, not trained by us |
| AI-text / AI-image detection | Hand-written statistical heuristics — **not** a trained model, deliberately (see Design notes below) |
| Auth | bcrypt password hashing, JWT bearer tokens, and Google OAuth |
| Email (OTP verification, password reset) | Resend |
| Payments | Razorpay (test mode) |
| PDF reports | reportlab |

## Project structure

```
backend/app/
  main.py          entry point — wires CORS + routers, run via uvicorn
  config.py        reads .env (database URL, JWT secret, Razorpay/Resend keys)
  database.py      Postgres connection + per-request session
  auth/            password hashing, JWT verify, rate limiting
  models/          one file per DB table (SQLAlchemy)
  schemas/         request/response shapes (Pydantic)
  routers/         API endpoints, one file per feature area
  services/        the actual logic — detection algorithms, email, PDF, payments

frontend/
  app/             one folder per page (dashboard, login, reports, etc.)
  lib/api.ts       the only file that talks to the backend
```

## Local setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL 17 running locally (no Docker — native install)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt

copy .env.example .env          # then fill in real values, see below
alembic upgrade head            # creates all tables
uvicorn app.main:app --reload --port 8000
```

Required values in `backend/.env`:
- `DATABASE_URL` — defaults to a local Postgres install (`postgres`/`postgres`/`credence` db)
- `JWT_SECRET_KEY` — generate with `python -c "import secrets; print(secrets.token_hex(32))"`
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — test keys from the Razorpay dashboard (test mode toggle, top left). Billing endpoints work but return a clear error if left blank.
- `RESEND_API_KEY` — free at resend.com. If left blank, OTP/reset codes are logged to the server console instead of emailed — the app still works for local testing without it.

### Frontend

```bash
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

Runs on `http://localhost:3000`, talks to the backend at `http://localhost:8000`.

### First run

Sign up on `/signup` — this now requires a 6-digit email code before the account activates (see Auth below). If `RESEND_API_KEY` isn't set, the code is printed to the backend's console/log instead of emailed.

## Auth flow

1. **Signup** creates an unverified account and emails (or logs) a 6-digit code. The account can't log in until that code is confirmed via `/auth/verify-email`.
2. **Login** is stateless — a signed JWT (24h expiry), no server-side session table.
3. **Forgot password** works the same way — a code goes to the account's email, confirmed via `/auth/reset-password`.
4. Passwords are bcrypt-hashed; the real password is never stored.

## Known limitations (disclosed on purpose)

- AI-text and AI-image detection are rule-based heuristics, not trained/calibrated ML models — no formal accuracy evaluation exists yet.
- The plagiarism "reference corpus" is 5 fixed passages standing in for a real web search — no live web integration yet.
- `pgvector` isn't installed; similarity search runs in Python/NumPy, fine at this scale, not indexed.
- No OCR — scanned/image-only PDFs fail extraction with a clear error.
- Resend's free tier can only deliver to the account owner's own verified email until a domain is verified — real signups from other people won't receive their code yet.
- **Deployment:** Frontend is deployed live on Vercel (`https://credence-checker.vercel.app`). The backend runs locally via an Ngrok tunnel for development and Razorpay webhook testing.

## Database migrations

Schema changes always go through Alembic, never hand-edited:

```bash
# after changing a model in app/models/
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```
