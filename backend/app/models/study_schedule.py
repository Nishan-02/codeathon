from sqlalchemy import Column, Integer, String, Boolean, Date, Time, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base


class StudySchedule(Base):
    __tablename__ = "study_schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=True)
    scheduled_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    completed = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="study_schedules")
    subject = relationship("Subject", back_populates="study_schedules")
    topic = relationship("Topic", back_populates="study_schedules")
