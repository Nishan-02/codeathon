import { apiFetch } from './api';
import { Topic, CreateTopicInput, UpdateTopicInput } from '../types/topic';

export const TopicService = {
  getBySubject: (subjectId: number) => apiFetch<Topic[]>(`/subjects/${subjectId}/topics`),
  create: (subjectId: number, data: CreateTopicInput) => apiFetch<Topic>(`/subjects/${subjectId}/topics`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateTopicInput) => apiFetch<Topic>(`/topics/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/topics/${id}`, { method: 'DELETE' }),
};
