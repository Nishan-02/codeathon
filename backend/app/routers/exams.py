from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.subject import Subject
from app.models.exam import Exam
from app.schemas.exam import ExamCreate, ExamUpdate, ExamResponse

router = APIRouter(prefix="/exams", tags=["Exams"])


@router.get("", response_model=List[ExamResponse])
def get_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Exam).filter(Exam.user_id == current_user.id).order_by(Exam.exam_date.asc()).all()


@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(
    exam_in: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(Subject.id == exam_in.subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    exam = Exam(**exam_in.model_dump(), user_id=current_user.id)
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


@router.put("/{id}", response_model=ExamResponse)
def update_exam(
    id: int,
    exam_in: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exam = db.query(Exam).filter(Exam.id == id, Exam.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

    if exam_in.subject_id is not None:
        subject = db.query(Subject).filter(Subject.id == exam_in.subject_id, Subject.user_id == current_user.id).first()
        if not subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    update_data = exam_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(exam, field, value)

    db.commit()
    db.refresh(exam)
    return exam


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exam = db.query(Exam).filter(Exam.id == id, Exam.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

    db.delete(exam)
    db.commit()
    return None
