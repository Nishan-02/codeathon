from sqlalchemy.orm import Session
from app.models.progress import Progress
from app.models.topic import Topic
from app.models.subject import Subject
from app.models.study_schedule import StudySchedule
from app.services.scheduler_service import scheduler_service
from app.services.prediction_service import prediction_service
from app.schemas.analytics import SubjectProgressMetric, ProgressResponse, PredictionAnalyticsResponse


class ProgressService:
    @staticmethod
    def update_topic_progress(db: Session, user_id: int, topic_id: int, completed: bool, is_missed: bool):
        topic = db.query(Topic).filter(Topic.id == topic_id).first()
        if not topic:
            return None

        topic.completed = completed

        # Update schedule entries linked to this topic
        schedules = (
            db.query(StudySchedule)
            .filter(StudySchedule.topic_id == topic_id, StudySchedule.user_id == user_id)
            .all()
        )
        for s in schedules:
            if is_missed:
                scheduler_service.reschedule_missed_schedule(db, s.id, user_id)
            else:
                s.completed = completed

        # Recalculate progress for this subject
        subject_topics = db.query(Topic).filter(Topic.subject_id == topic.subject_id).all()
        total_topics = len(subject_topics)
        completed_topics = sum(1 for t in subject_topics if t.completed)
        progress_pct = (completed_topics / total_topics * 100.0) if total_topics > 0 else 0.0

        progress_record = (
            db.query(Progress)
            .filter(Progress.user_id == user_id, Progress.subject_id == topic.subject_id)
            .first()
        )

        if not progress_record:
            progress_record = Progress(
                user_id=user_id,
                subject_id=topic.subject_id,
                completed_topics=completed_topics,
                total_topics=total_topics,
                progress_percentage=round(progress_pct, 1),
            )
            db.add(progress_record)
        else:
            progress_record.completed_topics = completed_topics
            progress_record.total_topics = total_topics
            progress_record.progress_percentage = round(progress_pct, 1)

        db.commit()
        db.refresh(topic)
        return topic

    @staticmethod
    def calculate_dashboard_metrics(db: Session, user_id: int) -> ProgressResponse:
        progress_records = db.query(Progress).filter(Progress.user_id == user_id).all()

        total_topics = 0
        completed_topics = 0
        breakdown = []

        for record in progress_records:
            total_topics += record.total_topics or 0
            completed_topics += record.completed_topics or 0

            subject = db.query(Subject).filter(Subject.id == record.subject_id).first()
            subject_name = subject.name if subject else f"Subject #{record.subject_id}"

            topics = db.query(Topic).filter(Topic.subject_id == record.subject_id).all()
            diffs = [prediction_service.parse_difficulty(t.difficulty) for t in topics]
            avg_diff = sum(diffs) / len(diffs) if diffs else 6.0

            pct = record.progress_percentage or 0.0
            is_weak = pct < 50.0
            extra_hours = scheduler_service.calculate_extra_hours_needed(pct, avg_diff)

            breakdown.append(
                SubjectProgressMetric(
                    subject_id=record.subject_id,
                    subject_name=subject_name,
                    completed_topics=record.completed_topics or 0,
                    total_topics=record.total_topics or 0,
                    progress_percentage=pct,
                    is_weak=is_weak,
                    recommended_extra_hours=extra_hours,
                )
            )

        overall_pct = (completed_topics / total_topics * 100.0) if total_topics > 0 else 0.0

        return ProgressResponse(
            overall_progress_percentage=round(overall_pct, 1),
            total_completed_topics=completed_topics,
            total_topics=total_topics,
            subject_breakdown=breakdown,
        )

    @staticmethod
    def get_ml_prediction(db: Session, user_id: int) -> PredictionAnalyticsResponse:
        records = db.query(Progress).filter(Progress.user_id == user_id).all()
        total_topics = sum(r.total_topics or 0 for r in records)
        completed_topics = sum(r.completed_topics or 0 for r in records)

        completion_ratio = (completed_topics / total_topics) if total_topics > 0 else 0.0

        user_subject_ids = [r.subject_id for r in records]
        topics = (
            db.query(Topic).filter(Topic.subject_id.in_(user_subject_ids)).all()
            if user_subject_ids
            else []
        )

        total_hours = sum(t.estimated_hours or 1.0 for t in topics if t.completed)
        diff_weights = [prediction_service.parse_difficulty(t.difficulty) for t in topics]
        avg_diff = sum(diff_weights) / len(diff_weights) if diff_weights else 6.0

        score = prediction_service.predict_performance(total_hours, completion_ratio, avg_diff)

        weak_subjects = []
        for r in records:
            if (r.progress_percentage or 0.0) < 50.0:
                s = db.query(Subject).filter(Subject.id == r.subject_id).first()
                weak_subjects.append(s.name if s else f"Subject #{r.subject_id}")

        confidence = "High" if total_topics >= 10 else "Moderate" if total_topics >= 4 else "Preliminary"

        return PredictionAnalyticsResponse(
            predicted_score=score,
            confidence_level=confidence,
            overall_completion_rate=round(completion_ratio * 100.0, 1),
            estimated_total_study_hours=round(total_hours, 1),
            weak_subject_names=weak_subjects,
        )


progress_service = ProgressService()