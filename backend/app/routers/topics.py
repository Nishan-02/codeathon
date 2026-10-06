from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.subject import Subject
from app.models.topic import Topic
from app.schemas.topic import TopicCreate, TopicUpdate, TopicResponse
from app.services.progress_service import ProgressService

router = APIRouter(tags=["Topics"])


@router.get("/subjects/{subject_id}/topics", response_model=List[TopicResponse])
def get_topics(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    return db.query(Topic).filter(Topic.subject_id == subject_id).all()


@router.post("/subjects/{subject_id}/topics", response_model=TopicResponse, status_code=status.HTTP_201_CREATED)
def create_topic(
    subject_id: int,
    topic_in: TopicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    topic = Topic(**topic_in.model_dump(), subject_id=subject_id)
    db.add(topic)
    db.commit()
    db.refresh(topic)

    # Recalculate progress for this subject
    ProgressService.update_subject_progress(db, current_user.id, subject_id)

    return topic


@router.put("/topics/{id}", response_model=TopicResponse)
def update_topic(
    id: int,
    topic_in: TopicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    topic = db.query(Topic).join(Subject).filter(Topic.id == id, Subject.user_id == current_user.id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    update_data = topic_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(topic, field, value)

    db.commit()
    db.refresh(topic)

    # Update subject progress
    ProgressService.update_subject_progress(db, current_user.id, topic.subject_id)

    return topic


@router.delete("/topics/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_topic(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    topic = db.query(Topic).join(Subject).filter(Topic.id == id, Subject.user_id == current_user.id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    subject_id = topic.subject_id
    db.delete(topic)
    db.commit()

    # Update subject progress
    ProgressService.update_subject_progress(db, current_user.id, subject_id)

    return None
