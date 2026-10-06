from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.progress_service import ProgressService

router = APIRouter(prefix="/progress", tags=["Progress & Analytics"])


@router.get("/dashboard")
def get_user_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ProgressService.get_progress_dashboard(db=db, user_id=current_user.id)


@router.get("/predict")
def predict_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ProgressService.get_exam_prediction(db=db, user_id=current_user.id)