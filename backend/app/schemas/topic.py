from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TopicBase(BaseModel):
    name: str
    description: Optional[str] = None
    difficulty: Optional[str] = "medium"
    estimated_hours: Optional[float] = 1.0
    completed: Optional[bool] = False


class TopicCreate(TopicBase):
    pass


class TopicUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    estimated_hours: Optional[float] = None
    completed: Optional[bool] = None


class TopicResponse(TopicBase):
    id: int
    subject_id: int
    created_at: datetime

    class Config:
        from_attributes = True
