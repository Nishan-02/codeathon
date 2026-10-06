from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AssignmentBase(BaseModel):
    subject_id: int
    title: str
    due_date: datetime
    description: Optional[str] = None
    completed: Optional[bool] = False


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    subject_id: Optional[int] = None
    title: Optional[str] = None
    due_date: Optional[datetime] = None
    description: Optional[str] = None
    completed: Optional[bool] = None


class AssignmentResponse(AssignmentBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
