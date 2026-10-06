from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from app.services.ai_service import analyze_voice_assessment

router = APIRouter(prefix="/ai", tags=["AI Assessment"])


class AnswerInput(BaseModel):
    questionId: str
    question: str
    answerText: str
    answeredAt: Optional[str] = None


class VoiceAssessmentRequest(BaseModel):
    subjectId: str
    subjectName: str
    answers: List[AnswerInput]
    studentData: Optional[Dict[str, Any]] = None


class AssessmentPredictionResponse(BaseModel):
    readinessScore: int = Field(ge=0, le=100)
    riskLevel: str
    confidenceLevel: str
    estimatedStudyHoursPerDay: float
    weakAreas: List[str]
    recommendations: List[str]


@router.post("/voice-assessment", response_model=AssessmentPredictionResponse)
def evaluate_voice_assessment(payload: VoiceAssessmentRequest):
    try:
        answers_dict = [a.model_dump() for a in payload.answers]
        result = analyze_voice_assessment(
            subject_id=payload.subjectId,
            subject_name=payload.subjectName,
            answers=answers_dict,
            student_data=payload.studentData
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process voice assessment AI: {str(e)}")
