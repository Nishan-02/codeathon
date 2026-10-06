export interface Assessment {
  id?: string | number;
  user_id?: string;
  title: string;
  score?: number;
  max_score?: number;
  percentage?: number;
  subject_id?: string | number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}
