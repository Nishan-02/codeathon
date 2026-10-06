export interface ChunkInfo {
  index: number;
  distance: number;
  similarity?: number;
  text: string;
}

export interface StudyModule {
  week_number: number;
  title: string;
  estimated_hours: number;
  description: string;
  topics: string[];
  key_concepts: string[];
  practice_tasks: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface PersonalizedStudyPlan {
  title: string;
  source_filename?: string;
  summary: string;
  difficulty: 'easy' | 'medium' | 'hard';
  target_completion_weeks: number;
  daily_commitment_minutes: number;
  total_estimated_hours: number;
  modules: StudyModule[];
  high_yield_exam_tips?: string[];
  practice_quiz?: QuizQuestion[];
}

export interface UploadDocumentResponse {
  success: boolean;
  document_id: string;
  filename: string;
  chunks_count: number;
  preview_snippet: string;
  study_plan: PersonalizedStudyPlan;
}

export interface AskQuestionResponse {
  answer: string;
  chunks: ChunkInfo[];
  document_id?: string;
  filename?: string;
}

export interface RAGStatusResponse {
  has_document: boolean;
  document_id?: string;
  filename?: string;
  chunks_count?: number;
  has_study_plan?: boolean;
}
