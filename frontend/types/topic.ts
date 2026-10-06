export interface Topic {
  id: number;
  subject_id: number;
  name: string;
  description?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_hours: number;
  completed: boolean;
  created_at: string;
}

export interface CreateTopicInput {
  name: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  estimated_hours?: number;
  completed?: boolean;
}

export interface UpdateTopicInput {
  name?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  estimated_hours?: number;
  completed?: boolean;
}
