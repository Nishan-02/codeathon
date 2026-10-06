from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, time


class TaskStatusUpdate(BaseModel):
    completed: bool
    status: str = Field(default="completed", description="'completed', 'missed', or 'pending'")
    actual_hours_spent: Optional[float] = 0.0


class ScheduleSlotOut(BaseModel):
    id: int
    user_id: int
    subject_id: int
    topic_id: Optional[int]
    scheduled_date: date
    start_time: Optional[time]
    end_time: Optional[time]
    completed: bool

    class Config:
        from_attributes = True


class SubjectProgressMetric(BaseModel):
    subject_id: int
    subject_name: str
    completed_topics: int
    total_topics: int
    progress_percentage: float
    is_weak: bool
    recommended_extra_hours: float


class ProgressResponse(BaseModel):
    overall_progress_percentage: float
    total_completed_topics: int
    total_topics: int
    subject_breakdown: List[SubjectProgressMetric]


class PredictionAnalyticsResponse(BaseModel):
    predicted_score: float
    confidence_level: str
    overall_completion_rate: float
    estimated_total_study_hours: float
    weak_subject_names: List[str]