from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.rag import (
    IngestRequest,
    UploadDocumentResponse,
    AskRequest,
    AskQuestionResponse,
    RAGStatusResponse,
    SyncPlanRequest,
    GeneratedFilesBundleResponse,
)
from app.services.rag_service import rag_service

router = APIRouter(prefix="/rag", tags=["RAG Document Processing & DocuQuery"])


@router.post("/ingest", response_model=UploadDocumentResponse)
def ingest_document(
    payload: IngestRequest,
):
    """
    Ingest document via JSON payload (clean extracted text + metadata).
    """
    return rag_service.ingest_document(
        filename=payload.filename,
        text=payload.text or "",
        daily_hours=payload.daily_hours,
        target_weeks=payload.target_weeks,
        goal=payload.goal or "Exam Prep & High Retention",
        difficulty=payload.difficulty or "medium",
        api_key=payload.api_key,
    )


@router.post("/upload", response_model=UploadDocumentResponse)
async def upload_pdf_file(
    file: UploadFile = File(...),
    daily_hours: float = Form(2.0),
    target_weeks: int = Form(4),
    goal: str = Form("Exam Prep & High Retention"),
    difficulty: str = Form("medium"),
):
    """
    Ingest PDF document via direct multipart file upload.
    """
    contents = await file.read()
    return rag_service.ingest_document(
        filename=file.filename or "uploaded.pdf",
        pdf_bytes=contents,
        daily_hours=daily_hours,
        target_weeks=target_weeks,
        goal=goal,
        difficulty=difficulty,
    )


@router.post("/ask", response_model=AskQuestionResponse)
def ask_question(payload: AskRequest):
    """
    Query the active RAG vector index.
    """
    return rag_service.ask_question(
        question=payload.question,
        doc_id=payload.doc_id,
        api_key=payload.api_key,
    )


@router.post("/load-sample", response_model=UploadDocumentResponse)
def load_sample(daily_hours: float = 2.0, target_weeks: int = 4):
    """
    Loads the built-in sample academic syllabus.
    """
    sample_text = (
        "PYTHON FULL STACK DEVELOPER PROGRAM SYLLABUS\n"
        "Master Modern Web Engineering from Front-End Interface to Cloud Infrastructure\n\n"
        "Program Overview: 16 Weeks Intensive Duration | 5 Core Modules | 6+ Portfolio Projects\n\n"
        "Section 1: Frontend Engineering & UI/UX\n"
        "Build accessible, dynamic, and reactive web interfaces using HTML5, modern CSS3 (Flexbox & Grid, Tailwind), "
        "interactive JavaScript (ES6+), DOM manipulation, async/await, and component-driven architectures with React.js and Vite.\n\n"
        "Section 2: Advanced Python & Object-Oriented Programming\n"
        "Master advanced Python language features including data structures, generators, decorators, context managers, "
        "OOP principles (inheritance, polymorphism, encapsulation), PyTest TDD, Flake8, and Asyncio concurrency.\n\n"
        "Section 3: Backend Frameworks & RESTful API Design\n"
        "Engineer secure web services using Django, Django REST Framework, ORM modeling, and async FastAPI microservices "
        "with Pydantic validation and OpenAPI docs.\n\n"
        "Section 4: Data Layer, Persistence & Caching\n"
        "Relational SQL databases (PostgreSQL, MySQL, SQLAlchemy ORM), NoSQL document storage (MongoDB), and Redis caching.\n\n"
        "Section 5: DevOps, Containerization & Cloud Deployment\n"
        "Docker containerization, Docker Compose, GitHub Actions CI/CD, Nginx reverse proxies, SSL/TLS, AWS/Render deployment, "
        "and full-stack SaaS capstone project."
    )
    return rag_service.ingest_document(
        filename="python-fullstack-developer-program.pdf",
        text=sample_text,
        daily_hours=daily_hours,
        target_weeks=target_weeks,
        goal="Full Stack Python Mastery & Portfolio Readiness",
        difficulty="medium",
    )


@router.post("/sync-to-planner")
def sync_to_planner(
    payload: SyncPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Syncs the generated study plan directly into the database as a Subject and Topics.
    """
    return rag_service.sync_to_planner(
        db=db,
        user_id=current_user.id,
        study_plan=payload.study_plan,
    )


@router.get("/status", response_model=RAGStatusResponse)
def get_status():
    """
    Check current RAG document index status.
    """
    return rag_service.get_status()


@router.get("/generate-files", response_model=GeneratedFilesBundleResponse)
@router.post("/generate-files", response_model=GeneratedFilesBundleResponse)
def generate_study_files(doc_id: Optional[str] = None, api_key: Optional[str] = None):
    """
    Generate downloadable PDF study files (Flashcards, Notes, Glossary, Mindmap, Practice Exam).
    """
    return rag_service.generate_study_files(doc_id=doc_id, api_key=api_key)


