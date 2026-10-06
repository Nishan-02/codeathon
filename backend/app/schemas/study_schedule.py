from pydantic import BaseModel
from datetime import date, time
from typing import Optional


class StudyScheduleBase(BaseModel):
    subject_id: int
    topic_id: Optional[int] = None
    scheduled_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    completed: Optional[bool] = False


class StudyScheduleCreate(StudyScheduleBase):
    pass


class StudyScheduleUpdate(BaseModel):
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    scheduled_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    completed: Optional[bool] = None


class GenerateScheduleRequest(BaseModel):
    available_daily_hours: float = 4.0
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class StudyScheduleResponse(StudyScheduleBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
