export interface StudySchedule {
  id: number;
  user_id?: number;
  subject_id?: number;
  topic_id?: number | null;
  scheduled_date: string;
  start_time?: string | null;
  end_time?: string | null;
  completed: boolean;
  topic_name?: string | null;
  subject_name?: string | null;
  duration_minutes?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface GenerateScheduleInput {
  available_daily_hours?: number;
  start_date?: string;
  end_date?: string;
}

export interface UpdateScheduleInput {
  subject_id?: number;
  topic_id?: number;
  scheduled_date?: string;
  start_time?: string;
  end_time?: string;
  completed?: boolean;
}
