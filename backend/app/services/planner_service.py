from sqlalchemy.orm import Session
from datetime import date, timedelta, time
from typing import List
from app.models.study_schedule import StudySchedule
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.exam import Exam
from app.models.assignment import Assignment
from app.schemas.study_schedule import GenerateScheduleRequest


class PlannerService:
    @staticmethod
    def generate_schedule(db: Session, user_id: int, req: GenerateScheduleRequest) -> List[StudySchedule]:
        """
        Basic deterministic study schedule generator.
        Distributes uncompleted topics across dates starting from start_date considering available daily study hours.
        Designed to be easily extended with adaptive AI algorithms in later phases.
        """
        start_dt = req.start_date or date.today()
        daily_hours = req.available_daily_hours or 4.0

        # Fetch all user subjects and uncompleted topics
        subjects = db.query(Subject).filter(Subject.user_id == user_id).all()
        subject_ids = [s.id for s in subjects]

        if not subject_ids:
            return []

        # Get pending topics ordered by subject difficulty / topic difficulty
        pending_topics = db.query(Topic).filter(
            Topic.subject_id.in_(subject_ids),
            Topic.completed == False
        ).all()

        if not pending_topics:
            return []

        # Sort topics: hard subjects first, then estimated hours
        difficulty_weight = {"hard": 3, "medium": 2, "easy": 1}
        subject_map = {s.id: s for s in subjects}

        pending_topics.sort(
            key=lambda t: (
                -difficulty_weight.get(subject_map.get(t.subject_id, Subject()).difficulty, 2),
                -difficulty_weight.get(t.difficulty, 2),
                t.estimated_hours
            )
        )

        # Clear future uncompleted study schedules to regenerate
        db.query(StudySchedule).filter(
            StudySchedule.user_id == user_id,
            StudySchedule.scheduled_date >= start_dt,
            StudySchedule.completed == False
        ).delete(synchronize_session=False)

        new_schedules = []
        current_date = start_dt
        accumulated_hours_today = 0.0

        for topic in pending_topics:
            topic_hours = topic.estimated_hours or 1.0

            # If adding this topic exceeds available daily hours and we already scheduled something today, move to next day
            if accumulated_hours_today + topic_hours > daily_hours and accumulated_hours_today > 0:
                current_date += timedelta(days=1)
                accumulated_hours_today = 0.0

            # Calculate simple time window (e.g. starting at 09:00 AM + current accumulated hours)
            start_hour = int(9 + accumulated_hours_today) % 24
            end_hour = int(start_hour + int(topic_hours)) % 24

            schedule_item = StudySchedule(
                user_id=user_id,
                subject_id=topic.subject_id,
                topic_id=topic.id,
                scheduled_date=current_date,
                start_time=time(hour=start_hour, minute=0),
                end_time=time(hour=end_hour if end_hour != start_hour else (start_hour + 1) % 24, minute=0),
                completed=False
            )

            db.add(schedule_item)
            new_schedules.append(schedule_item)
            accumulated_hours_today += topic_hours

            # If max daily hours reached, increment day
            if accumulated_hours_today >= daily_hours:
                current_date += timedelta(days=1)
                accumulated_hours_today = 0.0

        db.commit()
        for sched in new_schedules:
            db.refresh(sched)

        return new_schedules
