from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    due_date = Column(DateTime, nullable=False)
    description = Column(String, nullable=True)
    completed = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="assignments")
    subject = relationship("Subject", back_populates="assignments")
