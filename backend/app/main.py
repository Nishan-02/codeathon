import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import engine, Base

# Import all models to ensure SQLAlchemy metadata is registered
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
    rag,
)
from app.core.core_tracker import router as core_tracker_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Generate database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Intelligent Study Planner API",
    description="Backend service for tracking study progress, RAG generation, and ML analytics.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers under /api for frontend compatibility
app.include_router(users.router, prefix="/api")
app.include_router(subjects.router, prefix="/api")
app.include_router(topics.router, prefix="/api")
app.include_router(exams.router, prefix="/api")
app.include_router(assignments.router, prefix="/api")
app.include_router(planner.router, prefix="/api")
app.include_router(progress.router, prefix="/api")
app.include_router(rag.router, prefix="/api")

# Core tracker and ML routes (already prefixed with /api)
app.include_router(core_tracker_router)

# Also mount progress, topics, and rag directly
app.include_router(topics.router)
app.include_router(progress.router)
app.include_router(rag.router)


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "message": "Intelligent Study Planner API is running",
    }