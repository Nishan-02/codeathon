import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.firebase import initialize_firebase
from app.database.database import Base
from app.database.session import engine

# Import models to ensure metadata registered
import app.models  # noqa: F401

# Import routers
from app.routers import (
    users,
    subjects,
    topics,
    exams,
    assignments,
    planner,
    progress,
    ai
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    logger.info("Initializing database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully.")
    except Exception as e:
        logger.warning(f"Database connection/table creation notice: {e}")

    logger.info("Initializing Firebase Admin...")
    initialize_firebase()
    yield
    # Shutdown tasks
    logger.info("Shutting down application...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS middleware
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Health Check
@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


# Include API Routers
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(subjects.router, prefix=settings.API_V1_STR)
app.include_router(topics.router, prefix=settings.API_V1_STR)
app.include_router(exams.router, prefix=settings.API_V1_STR)
app.include_router(assignments.router, prefix=settings.API_V1_STR)
app.include_router(planner.router, prefix=settings.API_V1_STR)
app.include_router(progress.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
