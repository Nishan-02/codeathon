export interface SubjectProgress {
  id?: number;
  user_id?: number;
  subject_id: number;
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
