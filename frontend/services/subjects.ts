import { apiFetch } from './api';
import { Subject, CreateSubjectInput, UpdateSubjectInput } from '../types/subject';

export const SubjectService = {
  getAll: () => apiFetch<Subject[]>('/subjects'),
  getById: (id: number) => apiFetch<Subject>(`/subjects/${id}`),
  create: (data: CreateSubjectInput) => apiFetch<Subject>('/subjects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateSubjectInput) => apiFetch<Subject>(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/subjects/${id}`, { method: 'DELETE' }),
};
