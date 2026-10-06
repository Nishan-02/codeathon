from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.subject import Subject
from app.schemas.progress import ProgressResponse, OverallProgressResponse
from app.schemas.analytics import (
    ProgressResponse as DashboardProgressResponse,
    PredictionAnalyticsResponse,
)
from app.services.progress_service import ProgressService

router = APIRouter(prefix="/progress", tags=["Progress & Analytics"])


@router.get("", response_model=OverallProgressResponse)
def get_overall_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ProgressService.get_overall_progress(db, current_user.id)


@router.get("/dashboard", response_model=DashboardProgressResponse)
def get_progress_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ProgressService.calculate_dashboard_metrics(db=db, user_id=current_user.id)


@router.get("/predict", response_model=PredictionAnalyticsResponse)
def predict_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ProgressService.get_ml_prediction(db=db, user_id=current_user.id)


@router.get("/{subject_id}", response_model=ProgressResponse)
def get_subject_progress(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    progress = ProgressService.update_subject_progress(db, current_user.id, subject_id)
    return progress
