export interface SubjectProgress {
  id?: string | number;
  user_id?: string | number;
  subject_id: string | number;
  completed_topics: number;
  total_topics: number;
  progress_percentage: number;
  updated_at?: string;
  total_hours?: number;
  completed_hours?: number;
}

export interface OverallProgress {
  total_subjects: number;
  total_topics: number;
  completed_topics: number;
  overall_percentage: number;
  subject_progress?: SubjectProgress[];
  total_study_hours?: number;
  completed_study_hours?: number;
}
