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
      setSubjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  }, []);

  const addSubject = async (input: CreateSubjectInput) => {
    try {
      const newSubject = await SubjectService.create(input);
      setSubjects((prev) => [...prev, newSubject]);
      return newSubject;
    } catch (err: any) {
      throw err;
    }
  };

  const removeSubject = async (id: number) => {
    try {
      await SubjectService.delete(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      throw err;
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return { subjects, loading, error, refresh: fetchSubjects, addSubject, removeSubject };
};
