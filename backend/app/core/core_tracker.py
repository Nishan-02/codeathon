from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.analytics import (
    TaskStatusUpdate,
    ProgressResponse,
    PredictionAnalyticsResponse,
    ScheduleSlotOut,
)
from app.services.progress_service import progress_service
from app.services.scheduler_service import scheduler_service

router = APIRouter(prefix="/api", tags=["Person 2 - Core Tracker & ML"])


@router.put("/tasks/{topic_id}")
def update_task_progress(
    topic_id: int,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_missed = payload.status.lower() == "missed"
    topic = progress_service.update_topic_progress(
        db=db,
        user_id=current_user.id,
        topic_id=topic_id,
        completed=payload.completed,
        is_missed=is_missed,
    )
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    return {"message": "Progress updated successfully", "topic_id": topic.id, "completed": topic.completed}


@router.get("/progress", response_model=ProgressResponse)
def get_user_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return progress_service.calculate_dashboard_metrics(db=db, user_id=current_user.id)


@router.get("/analytics/predict", response_model=PredictionAnalyticsResponse)
def predict_exam_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return progress_service.get_ml_prediction(db=db, user_id=current_user.id)


@router.put("/schedules/{schedule_id}/reschedule", response_model=ScheduleSlotOut)
def reschedule_schedule_slot(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rescheduled = scheduler_service.reschedule_missed_schedule(
        db=db,
        schedule_id=schedule_id,
        user_id=current_user.id,
    )
    if not rescheduled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule slot not found")
    return rescheduled