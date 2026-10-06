import { apiFetch } from './api';
import { Exam, CreateExamInput, UpdateExamInput } from '../types/exam';

export const ExamService = {
  getAll: () => apiFetch<Exam[]>('/exams'),
  create: (data: CreateExamInput) => apiFetch<Exam>('/exams', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateExamInput) => apiFetch<Exam>(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/exams/${id}`, { method: 'DELETE' }),
};
