from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import engine, Base

# Import the routers directly to bypass any __init__.py issues
from app.routers.topics import router as topics_router
from app.routers.progress import router as progress_router

# Create database tables in Postgres
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

# Mount Person 2's Routers using the direct aliases
app.include_router(topics_router)
app.include_router(progress_router)

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "online", "role": "Person 2 - Core Tracker & ML Ready"}