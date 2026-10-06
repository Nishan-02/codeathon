import { apiFetch } from './api';
import { OverallProgress, SubjectProgress } from '../types/progress';

export const ProgressService = {
  getOverallProgress: () => apiFetch<OverallProgress>('/progress'),
  getSubjectProgress: (subjectId: number) => apiFetch<SubjectProgress>(`/progress/${subjectId}`),
};
