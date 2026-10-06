import { apiFetch } from './api';
import { Assignment, CreateAssignmentInput, UpdateAssignmentInput } from '../types/assignment';

export const AssignmentService = {
  getAll: () => apiFetch<Assignment[]>('/assignments'),
  create: (data: CreateAssignmentInput) => apiFetch<Assignment>('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateAssignmentInput) => apiFetch<Assignment>(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/assignments/${id}`, { method: 'DELETE' }),
};
