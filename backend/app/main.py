from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, billing, check, feedback, ping

app = FastAPI(title="Credence API", version="0.1.0")

# Local Next.js dev server. Tighten this list before deploying anywhere public.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://credence-checker.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ping.router)
app.include_router(auth.router)
app.include_router(check.router)
app.include_router(feedback.router)
app.include_router(billing.router)
