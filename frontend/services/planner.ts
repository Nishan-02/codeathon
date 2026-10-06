import {
  getSchedule,
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  getSubjects,
  getTopics,
} from '../lib/firebase/firestore';
import { StudySchedule, GenerateScheduleInput, UpdateScheduleInput } from '../types/planner';

export const PlannerService = {
  getSchedule: () => getSchedule(),
  generateSchedule: async (data: GenerateScheduleInput): Promise<StudySchedule[]> => {
    const existing = await getSchedule();
    if (existing.length > 0) return existing;

    const subjects = await getSubjects();
    const topics = await getTopics();

    const todayStr = new Date().toISOString().split('T')[0];
    const generated: StudySchedule[] = [];

    let count = 0;
    for (const topic of topics) {
      if (count >= 5) break;
      const subj = subjects.find((s) => String(s.id) === String(topic.subject_id));
      const item = await createScheduleItem({
        subject_id: topic.subject_id,
        topic_id: topic.id,
        scheduled_date: todayStr,
        start_time: `${9 + count}:00 AM`,
        end_time: `${10 + count}:00 AM`,
        topic_name: topic.name,
        subject_name: subj?.name || 'General',
        duration_minutes: Math.round((topic.estimated_hours || 1) * 60),
        completed: topic.completed,
      });
      generated.push(item);
      count++;
    }

    if (generated.length === 0) {
      const item = await createScheduleItem({
        scheduled_date: todayStr,
        start_time: '09:00 AM',
        end_time: '10:00 AM',
        topic_name: 'Core Study Focus Session',
        subject_name: 'General',
        duration_minutes: 60,
        completed: false,
      });
      generated.push(item);
    }

    return generated;
  },
  updateSchedule: (id: string | number, data: UpdateScheduleInput) => updateScheduleItem(id, data),
  deleteSchedule: (id: string | number) => deleteScheduleItem(id),
};
