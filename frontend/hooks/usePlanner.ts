import { useState, useEffect, useCallback } from 'react';
import { StudySchedule, GenerateScheduleInput } from '../types/planner';
import { PlannerService } from '../services/planner';
import { useAuth } from './useAuth';

export const usePlanner = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<StudySchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    if (!user) {
      setSchedule([]);
      setLoading(false);
      return;
    }
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
  }, [user]);

  const generateSchedule = async (input: GenerateScheduleInput) => {
    if (!user) throw new Error('User must be logged in to generate schedule.');
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

  const toggleTaskCompleted = async (id: string | number, completed: boolean) => {
    if (!user) return;
    try {
      const updated = await PlannerService.updateSchedule(id, { completed });
      setSchedule((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err: any) {
      setError(err.message || 'Failed to update schedule task');
      throw err;
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return { schedule, loading, error, refresh: fetchSchedule, generateSchedule, toggleTaskCompleted };
};
