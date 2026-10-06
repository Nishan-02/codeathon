import {
  getExams,
  createExam,
  updateExam,
  deleteExam,
} from '../lib/firebase/firestore';
import { Exam, CreateExamInput, UpdateExamInput } from '../types/exam';

export const ExamService = {
  getAll: () => getExams(),
  create: (data: CreateExamInput) => createExam(data),
  update: (id: string | number, data: UpdateExamInput) => updateExam(id, data),
  delete: (id: string | number) => deleteExam(id),
};
