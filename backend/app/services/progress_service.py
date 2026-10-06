from sqlalchemy.orm import Session
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.progress import Progress
from app.schemas.progress import OverallProgressResponse, ProgressResponse
from datetime import datetime


class ProgressService:
    @staticmethod
    def update_subject_progress(db: Session, user_id: int, subject_id: int) -> Progress:
        total_topics = db.query(Topic).filter(Topic.subject_id == subject_id).count()
        completed_topics = db.query(Topic).filter(Topic.subject_id == subject_id, Topic.completed == True).count()
        
        progress_percentage = (completed_topics / total_topics * 100.0) if total_topics > 0 else 0.0

        progress_record = db.query(Progress).filter(
            Progress.user_id == user_id,
            Progress.subject_id == subject_id
        ).first()

        if not progress_record:
            progress_record = Progress(
                user_id=user_id,
                subject_id=subject_id,
                completed_topics=completed_topics,
                total_topics=total_topics,
                progress_percentage=round(progress_percentage, 2)
            )
            db.add(progress_record)
        else:
            progress_record.completed_topics = completed_topics
            progress_record.total_topics = total_topics
            progress_record.progress_percentage = round(progress_percentage, 2)
            progress_record.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(progress_record)
        return progress_record

    @staticmethod
    def get_overall_progress(db: Session, user_id: int) -> OverallProgressResponse:
        subjects = db.query(Subject).filter(Subject.user_id == user_id).all()
        total_subjects = len(subjects)
        
        subject_progress_list = []
        all_completed = 0
        all_total = 0

        for subject in subjects:
            prog = ProgressService.update_subject_progress(db, user_id, subject.id)
            subject_progress_list.append(ProgressResponse.model_validate(prog))
            all_completed += prog.completed_topics
            all_total += prog.total_topics

        overall_pct = (all_completed / all_total * 100.0) if all_total > 0 else 0.0

        return OverallProgressResponse(
            total_subjects=total_subjects,
            total_topics=all_total,
            completed_topics=all_completed,
            overall_percentage=round(overall_pct, 2),
            subject_progress=subject_progress_list
        )
