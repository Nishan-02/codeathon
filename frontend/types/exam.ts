export interface Exam {
  id: number;
  user_id: number;
  subject_id: number;
  title: string;
  exam_date: string;
  description?: string | null;
  // Optional display-friendly fields
  subject_name?: string | null;
  total_modules?: number | null;
}

export interface CreateExamInput {
  subject_id: number;
  title: string;
  exam_date: string;
  description?: string;
}

export interface UpdateExamInput {
  subject_id?: number;
  title?: string;
  exam_date?: string;
  description?: string;
}
