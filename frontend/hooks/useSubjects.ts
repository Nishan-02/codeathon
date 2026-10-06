import { useState, useEffect, useCallback } from 'react';
import { Subject, CreateSubjectInput } from '../types/subject';
import { SubjectService } from '../services/subjects';

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SubjectService.getAll();
      if (Array.isArray(data)) {
        setSubjects(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  }, []);

  const addSubject = async (input: CreateSubjectInput) => {
    try {
      const newSubject = await SubjectService.create(input);
      if (newSubject && newSubject.id) {
        setSubjects((prev) => [...prev.filter((s) => s.id !== newSubject.id), newSubject]);
        return newSubject;
      }
      const fallbackSubject: Subject = {
        id: Date.now(),
        name: input.name,
        description: input.description,
        difficulty: input.difficulty || 'medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSubjects((prev) => [...prev, fallbackSubject]);
      return fallbackSubject;
    } catch {
      const fallbackSubject: Subject = {
        id: Date.now(),
        name: input.name,
        description: input.description,
        difficulty: input.difficulty || 'medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSubjects((prev) => [...prev, fallbackSubject]);
      return fallbackSubject;
    }
  };

  const removeSubject = async (id: number) => {
    try {
      await SubjectService.delete(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return { subjects, loading, error, refresh: fetchSubjects, addSubject, removeSubject };
};
