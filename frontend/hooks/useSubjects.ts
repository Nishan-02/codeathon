import { useState, useEffect, useCallback } from 'react';
import { Subject, CreateSubjectInput } from '../types/subject';
import { SubjectService } from '../services/subjects';
import { useAuth } from './useAuth';

export const useSubjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    if (!user) {
      setSubjects([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await SubjectService.getAll();
      if (Array.isArray(data)) {
        setSubjects(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subjects from Firestore');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addSubject = async (input: CreateSubjectInput) => {
    if (!user) {
      throw new Error('User must be logged in to create a subject.');
    }
    try {
      const newSubject = await SubjectService.create(input);
      setSubjects((prev) => [...prev.filter((s) => s.id !== newSubject.id), newSubject]);
      return newSubject;
    } catch (err: any) {
      setError(err.message || 'Failed to save subject');
      throw err;
    }
  };

  const removeSubject = async (id: string | number) => {
    if (!user) return;
    try {
      await SubjectService.delete(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete subject');
      throw err;
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return { subjects, loading, error, refresh: fetchSubjects, addSubject, removeSubject };
};
