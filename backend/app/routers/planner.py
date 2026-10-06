from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.study_schedule import StudySchedule
from app.schemas.study_schedule import (
    StudyScheduleResponse,
    StudyScheduleUpdate,
    GenerateScheduleRequest
)
from app.services.planner_service import PlannerService

router = APIRouter(prefix="/planner", tags=["Planner"])


@router.get("", response_model=List[StudyScheduleResponse])
def get_planner_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(StudySchedule).filter(
        StudySchedule.user_id == current_user.id
    ).order_by(StudySchedule.scheduled_date.asc(), StudySchedule.start_time.asc()).all()


@router.post("/generate", response_model=List[StudyScheduleResponse])
def generate_planner_schedule(
    req: GenerateScheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return PlannerService.generate_schedule(db, current_user.id, req)


@router.put("/{id}", response_model=StudyScheduleResponse)
def update_planner_schedule(
    id: int,
    schedule_in: StudyScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    schedule = db.query(StudySchedule).filter(
        StudySchedule.id == id,
        StudySchedule.user_id == current_user.id
    ).first()

    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule entry not found")

    update_data = schedule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(schedule, field, value)

    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_planner_schedule(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    schedule = db.query(StudySchedule).filter(
        StudySchedule.id == id,
        StudySchedule.user_id == current_user.id
    ).first()

    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule entry not found")

    db.delete(schedule)
    db.commit()
    return None
