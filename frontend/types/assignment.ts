export interface Assignment {
  id: number;
  user_id?: number;
  subject_id: number;
  title: string;
  due_date: string;
  description?: string | null;
  completed: boolean;
  subject_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAssignmentInput {
  subject_id: number;
  title: string;
  due_date: string;
  description?: string;
  completed?: boolean;
}

export interface UpdateAssignmentInput {
  subject_id?: number;
  title?: string;
  due_date?: string;
  description?: string;
  completed?: boolean;
}
