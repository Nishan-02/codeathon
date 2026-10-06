import {
  getProgress,
  getSubjectProgress,
  calculateAndSaveProgress,
} from '../lib/firebase/firestore';
import { OverallProgress, SubjectProgress } from '../types/progress';

export const ProgressService = {
  getOverallProgress: () => getProgress(),
  getSubjectProgress: (subjectId: string | number) => getSubjectProgress(subjectId),
  recalculate: () => calculateAndSaveProgress(),
};
