from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ProgressResponse(BaseModel):
    id: int
    user_id: int
    subject_id: int
    completed_topics: int
    total_topics: int
    progress_percentage: float
    updated_at: datetime

    class Config:
        from_attributes = True


class OverallProgressResponse(BaseModel):
    total_subjects: int
    total_topics: int
    completed_topics: int
    overall_percentage: float
    subject_progress: List[ProgressResponse]
