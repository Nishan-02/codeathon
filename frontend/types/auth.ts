export interface User {
  id?: number;
  firebase_uid: string;
  email: string;
  name?: string | null;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}
