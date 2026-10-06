export interface Subject {
  id: string | number;
  user_id?: string | number;
  name: string;
  description?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at?: string;
  updated_at?: string;
}

export interface CreateSubjectInput {
  name: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface UpdateSubjectInput {
  name?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}
