from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, billing, check, feedback, ping
from app.services.ml_models import model_manager
from app.services.embeddings import get_model

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading models during startup to prevent cold-start timeout...")
    _ = model_manager.text_classifier
    _ = model_manager.image_classifier
    _ = get_model()
    print("All models loaded successfully!")
    yield

app = FastAPI(title="Credence API", version="0.1.0", lifespan=lifespan)

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
