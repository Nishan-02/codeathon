import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../lib/firebase/firestore';
import { Subject, CreateSubjectInput, UpdateSubjectInput } from '../types/subject';

export const SubjectService = {
  getAll: () => getSubjects(),
  getById: (id: string | number) => getSubjectById(id),
  create: (data: CreateSubjectInput) => createSubject(data),
  update: (id: string | number, data: UpdateSubjectInput) => updateSubject(id, data),
  delete: (id: string | number) => deleteSubject(id),
};
