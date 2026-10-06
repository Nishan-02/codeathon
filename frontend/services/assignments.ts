import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '../lib/firebase/firestore';
import { Assignment, CreateAssignmentInput, UpdateAssignmentInput } from '../types/assignment';

export const AssignmentService = {
  getAll: () => getAssignments(),
  create: (data: CreateAssignmentInput) => createAssignment(data),
  update: (id: string | number, data: UpdateAssignmentInput) => updateAssignment(id, data),
  delete: (id: string | number) => deleteAssignment(id),
};
