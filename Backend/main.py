from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db.init_db import init_db
from routers import auth as auth_router
import logging

logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
logger = logging.getLogger(__name__)

INSECURE_DEFAULT_SECRET = "insecure-dev-secret-change-in-production"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup → yield → shutdown."""
    if settings.is_production and settings.secret_key == INSECURE_DEFAULT_SECRET:
        raise RuntimeError(
            "SECRET_KEY is still set to the insecure default. "
            "Set a real SECRET_KEY env var before running in production."
        )
    logger.info("Starting up IDBI Innovate API (env=%s)...", settings.app_env)
    init_db()
    yield
    logger.info("Shutting down IDBI Innovate API.")


app = FastAPI(
    title="IDBI Innovate API",
    description="Backend API for the IDBI Innovate Banking Platform",
    version="1.0.0",
    # Hide docs in production
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Origins are read from CORS_ORIGINS env var (comma-separated).
# Never use allow_origins=["*"] in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.include_router(auth_router.router)


@app.get("/", tags=["Health"])
def read_root():
    return {"message": "Welcome to IDBI Innovate API", "env": settings.app_env}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "version": "1.0.0"}
