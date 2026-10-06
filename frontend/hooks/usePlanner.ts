import { useState, useEffect, useCallback } from 'react';
import { StudySchedule, GenerateScheduleInput } from '../types/planner';
import { PlannerService } from '../services/planner';

export const usePlanner = () => {
  const [schedule, setSchedule] = useState<StudySchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PlannerService.getSchedule();
      setSchedule(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateSchedule = async (input: GenerateScheduleInput) => {
    try {
      setLoading(true);
      const newSchedule = await PlannerService.generateSchedule(input);
      setSchedule(newSchedule);
      return newSchedule;
    } catch (err: any) {
      setError(err.message || 'Failed to generate schedule');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompleted = async (id: number, completed: boolean) => {
    try {
      const updated = await PlannerService.updateSchedule(id, { completed });
      setSchedule((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err: any) {
      throw err;
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return { schedule, loading, error, refresh: fetchSchedule, generateSchedule, toggleTaskCompleted };
};
