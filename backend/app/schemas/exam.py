from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ExamBase(BaseModel):
    subject_id: int
    title: str
    exam_date: datetime
    description: Optional[str] = None


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    subject_id: Optional[int] = None
    title: Optional[str] = None
    exam_date: Optional[datetime] = None
    description: Optional[str] = None


class ExamResponse(ExamBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
