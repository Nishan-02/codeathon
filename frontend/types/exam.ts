export interface Exam {
  id: string | number;
  user_id?: string | number;
  subject_id: string | number;
  title: string;
  exam_date: string;
  description?: string | null;
  subject_name?: string | null;
  total_modules?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateExamInput {
  subject_id: string | number;
  title: string;
  exam_date: string;
  description?: string;
}

export interface UpdateExamInput {
  subject_id?: string | number;
  title?: string;
  exam_date?: string;
  description?: string;
}
