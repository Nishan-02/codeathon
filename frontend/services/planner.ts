import { apiFetch } from './api';
import { StudySchedule, GenerateScheduleInput, UpdateScheduleInput } from '../types/planner';

export const PlannerService = {
  getSchedule: () => apiFetch<StudySchedule[]>('/planner'),
  generateSchedule: (data: GenerateScheduleInput) => apiFetch<StudySchedule[]>('/planner/generate', { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule: (id: number, data: UpdateScheduleInput) => apiFetch<StudySchedule>(`/planner/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSchedule: (id: number) => apiFetch<void>(`/planner/${id}`, { method: 'DELETE' }),
};
