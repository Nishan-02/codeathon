from typing import List, Optional
from pydantic import BaseModel, Field


class ChunkInfo(BaseModel):
    index: int
    distance: float = 0.0
    similarity: Optional[float] = 1.0
    text: str


class StudyModule(BaseModel):
    week_number: int
    title: str
    estimated_hours: float
    description: str
    topics: List[str]
    key_concepts: List[str]
    practice_tasks: List[str]


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str


class PersonalizedStudyPlan(BaseModel):
    title: str
    source_filename: Optional[str] = None
    summary: str
    difficulty: str = "medium"
    target_completion_weeks: int
    daily_commitment_minutes: int
    total_estimated_hours: float
    modules: List[StudyModule]
    high_yield_exam_tips: Optional[List[str]] = None
    practice_quiz: Optional[List[QuizQuestion]] = None


class IngestRequest(BaseModel):
    filename: str
    text: Optional[str] = ""
    daily_hours: float = 2.0
    target_weeks: int = 4
    goal: Optional[str] = "Exam Prep & High Retention"
    difficulty: Optional[str] = "medium"
    api_key: Optional[str] = None


class UploadDocumentResponse(BaseModel):
    success: bool = True
    document_id: str
    filename: str
    chunks_count: int
    preview_snippet: str
    study_plan: PersonalizedStudyPlan


class AskRequest(BaseModel):
    question: str
    doc_id: Optional[str] = None
    api_key: Optional[str] = None


class AskQuestionResponse(BaseModel):
    answer: str
    chunks: List[ChunkInfo]
    document_id: Optional[str] = None
    filename: Optional[str] = None


class RAGStatusResponse(BaseModel):
    has_document: bool
    document_id: Optional[str] = None
    filename: Optional[str] = None
    chunks_count: int = 0
    has_study_plan: bool = False


class SyncPlanRequest(BaseModel):
    study_plan: PersonalizedStudyPlan


class FlashcardItem(BaseModel):
    front: str
    back: str
    category: str = "General"


class GeneratedFileAsset(BaseModel):
    file_id: str
    title: str
    file_type: str
    extension: str
    content: str
    summary: str


class GeneratedFilesBundleResponse(BaseModel):
    success: bool = True
    document_id: str
    filename: str
    files: List[GeneratedFileAsset]

