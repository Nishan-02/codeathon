from datetime import date, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.study_schedule import StudySchedule


class SchedulerService:
    @staticmethod
    def calculate_extra_hours_needed(progress_pct: float, avg_diff: float) -> float:
        """
        Calculate recommended extra study hours based on progress gap and subject difficulty.
        """
        if progress_pct >= 90.0:
            return 0.5
        elif progress_pct >= 70.0:
            return 1.5
        gap = max(0.0, 100.0 - progress_pct)
        diff_factor = max(0.6, avg_diff / 5.0)
        extra_hours = (gap / 15.0) * diff_factor
        return round(extra_hours, 1)

    @staticmethod
    def reschedule_missed_schedule(db: Session, schedule_id: int, user_id: int) -> Optional[StudySchedule]:
        """
        Postpones a missed study schedule session to the next day.
        """
        schedule = (
            db.query(StudySchedule)
            .filter(StudySchedule.id == schedule_id, StudySchedule.user_id == user_id)
            .first()
        )
        if not schedule:
            return None

        # Shift to tomorrow or 1 day ahead of scheduled date
        base_date = schedule.scheduled_date if schedule.scheduled_date and schedule.scheduled_date >= date.today() else date.today()
        schedule.scheduled_date = base_date + timedelta(days=1)
        schedule.completed = False

        db.commit()
        db.refresh(schedule)
        return schedule


scheduler_service = SchedulerService()