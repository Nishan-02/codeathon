from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class SubjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    difficulty: Optional[str] = "medium"


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None


class SubjectResponse(SubjectBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
