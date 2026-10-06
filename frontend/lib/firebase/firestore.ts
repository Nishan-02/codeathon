import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { app } from './config';
import { auth } from './auth';
import { Subject, CreateSubjectInput, UpdateSubjectInput } from '../../types/subject';
import { Topic, CreateTopicInput, UpdateTopicInput } from '../../types/topic';
import { Exam, CreateExamInput, UpdateExamInput } from '../../types/exam';
import { Assignment, CreateAssignmentInput, UpdateAssignmentInput } from '../../types/assignment';
import { StudySchedule, UpdateScheduleInput } from '../../types/planner';
import { OverallProgress, SubjectProgress } from '../../types/progress';
import { Assessment } from '../../types/assessment';

export const db = getFirestore(app);

const getUserUid = (): string => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Authentication required: User is not logged in.');
  }
  return user.uid;
};

// ── SUBJECTS ─────────────────────────────────────────────────────────────────
export const createSubject = async (data: CreateSubjectInput): Promise<Subject> => {
  const uid = getUserUid();
  const colRef = collection(db, 'users', uid, 'subjects');
  const now = new Date().toISOString();
  const docRef = await addDoc(colRef, {
    name: data.name,
    description: data.description || null,
    difficulty: data.difficulty || 'medium',
    created_at: now,
    updated_at: now,
  });

  const newSubject: Subject = {
    id: docRef.id,
    user_id: uid,
    name: data.name,
    description: data.description || null,
    difficulty: data.difficulty || 'medium',
    created_at: now,
    updated_at: now,
  };

  await calculateAndSaveProgress().catch(() => {});
  return newSubject;
};

export const getSubjects = async (): Promise<Subject[]> => {
  const uid = getUserUid();
  const colRef = collection(db, 'users', uid, 'subjects');
  const snapshot = await getDocs(colRef);
  const subjects: Subject[] = [];
  snapshot.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data();
    subjects.push({
      id: d.id,
      user_id: uid,
      name: data.name || '',
      description: data.description || null,
      difficulty: data.difficulty || 'medium',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
    });
  });
  return subjects;
};

export const getSubjectById = async (subjectId: string | number): Promise<Subject | null> => {
  const uid = getUserUid();
  const idStr = String(subjectId);

  const docRef = doc(db, 'users', uid, 'subjects', idStr);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      user_id: uid,
      name: data.name || '',
      description: data.description || null,
      difficulty: data.difficulty || 'medium',
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  const subjects = await getSubjects();
  return subjects.find((s) => String(s.id) === idStr) || null;
};

export const updateSubject = async (
  subjectId: string | number,
  data: UpdateSubjectInput
): Promise<Subject> => {
  const uid = getUserUid();
  const idStr = String(subjectId);
  const docRef = doc(db, 'users', uid, 'subjects', idStr);
  const now = new Date().toISOString();

  const updateData: Record<string, any> = { updated_at: now };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;

  await updateDoc(docRef, updateData);
  const updated = await getSubjectById(idStr);
  if (!updated) {
    throw new Error(`Subject with ID ${subjectId} not found.`);
  }
  return updated;
};

export const deleteSubject = async (subjectId: string | number): Promise<void> => {
  const uid = getUserUid();
  const idStr = String(subjectId);
  const docRef = doc(db, 'users', uid, 'subjects', idStr);
  await deleteDoc(docRef);
  await calculateAndSaveProgress().catch(() => {});
};

// ── TOPICS ────────────────────────────────────────────────────────────────────
export const createTopic = async (
  subjectId: string | number,
  data: CreateTopicInput
): Promise<Topic> => {
  const uid = getUserUid();
  const colRef = collection(db, 'users', uid, 'topics');
  const now = new Date().toISOString();
  const docRef = await addDoc(colRef, {
    subject_id: String(subjectId),
    name: data.name,
    description: data.description || null,
    difficulty: data.difficulty || 'medium',
    estimated_hours: data.estimated_hours ?? 1.0,
    completed: data.completed ?? false,
    created_at: now,
    updated_at: now,
  });

  const newTopic: Topic = {
    id: docRef.id,
    subject_id: subjectId,
    name: data.name,
    description: data.description || null,
    difficulty: data.difficulty || 'medium',
    estimated_hours: data.estimated_hours ?? 1.0,
    completed: data.completed ?? false,
    created_at: now,
    updated_at: now,
  };

  await calculateAndSaveProgress().catch(() => {});
  return newTopic;
};

export const getTopics = async (subjectId?: string | number): Promise<Topic[]> => {
  const uid = getUserUid();
  const colRef = collection(db, 'users', uid, 'topics');
  const snapshot = await getDocs(colRef);
  const topics: Topic[] = [];

  snapshot.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data();
    topics.push({
      id: d.id,
      subject_id: data.subject_id,
      name: data.name || '',
      description: data.description || null,
      difficulty: data.difficulty || 'medium',
      estimated_hours: Number(data.estimated_hours ?? 1.0),
      completed: Boolean(data.completed),
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  });

  if (subjectId !== undefined && subjectId !== null) {
    const targetStr = String(subjectId);
    return topics.filter((t) => String(t.subject_id) === targetStr);
  }
  return topics;
};

export const updateTopic = async (
  topicId: string | number,
  data: UpdateTopicInput
): Promise<Topic> => {
  const uid = getUserUid();
  const idStr = String(topicId);
  const docRef = doc(db, 'users', uid, 'topics', idStr);
  const now = new Date().toISOString();

  const updateFields: Record<string, any> = { updated_at: now };
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.difficulty !== undefined) updateFields.difficulty = data.difficulty;
  if (data.estimated_hours !== undefined) updateFields.estimated_hours = data.estimated_hours;
  if (data.completed !== undefined) updateFields.completed = data.completed;

  await updateDoc(docRef, updateFields);

  const docSnap = await getDoc(docRef);
  const tData = docSnap.data() || {};
  const updatedTopic: Topic = {
    id: docSnap.id,
    subject_id: tData.subject_id,
    name: tData.name || '',
    description: tData.description || null,
    difficulty: tData.difficulty || 'medium',
    estimated_hours: Number(tData.estimated_hours ?? 1.0),
    completed: Boolean(tData.completed),
    created_at: tData.created_at,
    updated_at: tData.updated_at,
  };

  await calculateAndSaveProgress().catch(() => {});
  return updatedTopic;
};

export const deleteTopic = async (topicId: string | number): Promise<void> => {
  const uid = getUserUid();
  const idStr = String(topicId);
  const docRef = doc(db, 'users', uid, 'topics', idStr);
  await deleteDoc(docRef);
  await calculateAndSaveProgress().catch(() => {});
};

// ── EXAMS ────────────────────────────────────────────────────────────────────
export const createExam = async (data: CreateExamInput): Promise<Exam> => {
  const uid = getUserUid();
  const colRef = collection(db, 'users', uid, 'exams');
  const now = new Date().toISOString();

  let subjectName = 'General';
  if (data.subject_id) {
    const subj = await getSubjectById(data.subject_id).catch(() => null);
    if (subj) subjectName = subj.name;
  }

  const docRef = await addDoc(colRef, {
    subject_id: String(data.subject_id),
    title: data.title,
    exam_date: data.exam_date,
    description: data.description || null,
    subject_name: subjectName,
    total_modules: 4,
    created_at: now,
    updated_at: now,
  });

  return {
    id: docRef.id,
    user_id: uid,
    subject_id: data.subject_id,
    title: data.title,
    exam_date: data.exam_date,
    description: data.description || null,
    subject_name: subjectName,
    total_modules: 4,
    created_at: now,
    updated_at: now,
  };
};

export const getExams = async (): Promise<Exam[]> => {
  const uid = getUserUid();
  const colRef = collection(db, 'users', uid, 'exams');
  const snapshot = await getDocs(colRef);
  const exams: Exam[] = [];
  snapshot.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data();
    exams.push({
      id: d.id,
      user_id: uid,
      subject_id: data.subject_id,
      title: data.title || '',
      exam_date: data.exam_date || new Date().toISOString(),
      description: data.description || null,
      subject_name: data.subject_name || 'General',
      total_modules: data.total_modules || 4,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  });
  return exams;
};

export const updateExam = async (
  examId: string | number,
  data: UpdateExamInput
): Promise<Exam> => {
  const uid = getUserUid();
  const idStr = String(examId);
  const docRef = doc(db, 'users', uid, 'exams', idStr);
  const now = new Date().toISOString();

  const updateFields: Record<string, any> = { updated_at: now };
  if (data.title !== undefined) updateFields.title = data.title;
  if (data.exam_date !== undefined) updateFields.exam_date = data.exam_date;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.subject_id !== undefined) updateFields.subject_id = String(data.subject_id);

  await updateDoc(docRef, updateFields);

  const snap = await getDoc(docRef);
  const eData = snap.data() || {};
  return {
    id: snap.id,
    user_id: uid,
    subject_id: eData.subject_id,
    title: eData.title || '',
    exam_date: eData.exam_date || new Date().toISOString(),
    description: eData.description || null,
    subject_name: eData.subject_name || 'General',
    total_modules: eData.total_modules || 4,
    created_at: eData.created_at,
    updated_at: eData.updated_at,
  };
};

export const deleteExam = async (examId: string | number): Promise<void> => {
  const uid = getUserUid();
  const idStr = String(examId);
  const docRef = doc(db, 'users', uid, 'exams', idStr);
  await deleteDoc(docRef);
};

// ── ASSIGNMENTS ──────────────────────────────────────────────────────────────
export const createAssignment = async (data: CreateAssignmentInput): Promise<Assignment> => {
  const uid = getUserUid();
  const colRef = collection(db, 'users', uid, 'assignments');
  const now = new Date().toISOString();

  let subjectName = 'General';
  if (data.subject_id) {
    const subj = await getSubjectById(data.subject_id).catch(() => null);
    if (subj) subjectName = subj.name;
  }

  const docRef = await addDoc(colRef, {
    subject_id: String(data.subject_id),
    title: data.title,
    due_date: data.due_date,
    description: data.description || null,
    completed: data.completed ?? false,
    subject_name: subjectName,
    created_at: now,
    updated_at: now,
  });

  return {
    id: docRef.id,
    user_id: uid,
    subject_id: data.subject_id,
    title: data.title,
    due_date: data.due_date,
    description: data.description || null,
    completed: data.completed ?? false,
    subject_name: subjectName,
    created_at: now,
    updated_at: now,
  };
};

export const getAssignments = async (): Promise<Assignment[]> => {
  const uid = getUserUid();
  const colRef = collection(db, 'users', uid, 'assignments');
  const snapshot = await getDocs(colRef);
  const assignments: Assignment[] = [];
  snapshot.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data();
    assignments.push({
      id: d.id,
      user_id: uid,
      subject_id: data.subject_id,
      title: data.title || '',
      due_date: data.due_date || new Date().toISOString(),
      description: data.description || null,
      completed: Boolean(data.completed),
      subject_name: data.subject_name || 'General',
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  });
  return assignments;
};

export const updateAssignment = async (
  assignmentId: string | number,
  data: UpdateAssignmentInput
): Promise<Assignment> => {
  const uid = getUserUid();
  const idStr = String(assignmentId);
  const docRef = doc(db, 'users', uid, 'assignments', idStr);
  const now = new Date().toISOString();

  const updateFields: Record<string, any> = { updated_at: now };
  if (data.title !== undefined) updateFields.title = data.title;
  if (data.due_date !== undefined) updateFields.due_date = data.due_date;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.completed !== undefined) updateFields.completed = data.completed;
  if (data.subject_id !== undefined) updateFields.subject_id = String(data.subject_id);

  await updateDoc(docRef, updateFields);

  const snap = await getDoc(docRef);
  const aData = snap.data() || {};
  return {
    id: snap.id,
    user_id: uid,
    subject_id: aData.subject_id,
    title: aData.title || '',
    due_date: aData.due_date || new Date().toISOString(),
    description: aData.description || null,
    completed: Boolean(aData.completed),
    subject_name: aData.subject_name || 'General',
    created_at: aData.created_at,
    updated_at: aData.updated_at,
  };
};

export const deleteAssignment = async (assignmentId: string | number): Promise<void> => {
  const uid = getUserUid();
  const idStr = String(assignmentId);
  const docRef = doc(db, 'users', uid, 'assignments', idStr);
  await deleteDoc(docRef);
};

// ── STUDY SCHEDULE / PLANNER ──────────────────────────────────────────────────
export const createScheduleItem = async (data: Partial<StudySchedule>): Promise<StudySchedule> => {
  const uid = getUserUid();
  const colRef = collection(db, 'users', uid, 'studySchedule');
  const now = new Date().toISOString();

  const docRef = await addDoc(colRef, {
    subject_id: data.subject_id ? String(data.subject_id) : null,
    topic_id: data.topic_id ? String(data.topic_id) : null,
    scheduled_date: data.scheduled_date || new Date().toISOString().split('T')[0],
    start_time: data.start_time || '09:00 AM',
    end_time: data.end_time || '10:00 AM',
    completed: data.completed ?? false,
    topic_name: data.topic_name || 'Study Session',
    subject_name: data.subject_name || 'General',
    duration_minutes: data.duration_minutes || 60,
    created_at: now,
    updated_at: now,
  });

  return {
    id: docRef.id,
    user_id: uid,
    subject_id: data.subject_id,
    topic_id: data.topic_id,
    scheduled_date: data.scheduled_date || new Date().toISOString().split('T')[0],
    start_time: data.start_time || '09:00 AM',
    end_time: data.end_time || '10:00 AM',
    completed: data.completed ?? false,
    topic_name: data.topic_name || 'Study Session',
    subject_name: data.subject_name || 'General',
    duration_minutes: data.duration_minutes || 60,
    created_at: now,
    updated_at: now,
  };
};

export const getSchedule = async (): Promise<StudySchedule[]> => {
  const uid = getUserUid();
  const colRef = collection(db, 'users', uid, 'studySchedule');
  const snapshot = await getDocs(colRef);
  const list: StudySchedule[] = [];
  snapshot.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data();
    list.push({
      id: d.id,
      user_id: uid,
      subject_id: data.subject_id,
      topic_id: data.topic_id,
      scheduled_date: data.scheduled_date || new Date().toISOString().split('T')[0],
      start_time: data.start_time || '09:00 AM',
      end_time: data.end_time || '10:00 AM',
      completed: Boolean(data.completed),
      topic_name: data.topic_name || 'Study Session',
      subject_name: data.subject_name || 'General',
      duration_minutes: Number(data.duration_minutes || 60),
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  });
  return list;
};

export const updateScheduleItem = async (
  scheduleId: string | number,
  data: UpdateScheduleInput
): Promise<StudySchedule> => {
  const uid = getUserUid();
  const idStr = String(scheduleId);
  const docRef = doc(db, 'users', uid, 'studySchedule', idStr);
  const now = new Date().toISOString();

  const updateFields: Record<string, any> = { updated_at: now };
  if (data.scheduled_date !== undefined) updateFields.scheduled_date = data.scheduled_date;
  if (data.start_time !== undefined) updateFields.start_time = data.start_time;
  if (data.end_time !== undefined) updateFields.end_time = data.end_time;
  if (data.completed !== undefined) updateFields.completed = data.completed;
  if (data.subject_id !== undefined) updateFields.subject_id = String(data.subject_id);
  if (data.topic_id !== undefined) updateFields.topic_id = String(data.topic_id);

  await updateDoc(docRef, updateFields);

  const snap = await getDoc(docRef);
  const sData = snap.data() || {};
  return {
    id: snap.id,
    user_id: uid,
    subject_id: sData.subject_id,
    topic_id: sData.topic_id,
    scheduled_date: sData.scheduled_date || new Date().toISOString().split('T')[0],
    start_time: sData.start_time || '09:00 AM',
    end_time: sData.end_time || '10:00 AM',
    completed: Boolean(sData.completed),
    topic_name: sData.topic_name || 'Study Session',
    subject_name: sData.subject_name || 'General',
    duration_minutes: Number(sData.duration_minutes || 60),
    created_at: sData.created_at,
    updated_at: sData.updated_at,
  };
};

export const deleteScheduleItem = async (scheduleId: string | number): Promise<void> => {
  const uid = getUserUid();
  const idStr = String(scheduleId);
  const docRef = doc(db, 'users', uid, 'studySchedule', idStr);
  await deleteDoc(docRef);
};

// ── PROGRESS ──────────────────────────────────────────────────────────────────
export const saveProgress = async (progressData: OverallProgress): Promise<void> => {
  const uid = getUserUid();
  const docRef = doc(db, 'users', uid, 'progress', 'overall');
  await setDoc(docRef, {
    ...progressData,
    updated_at: new Date().toISOString(),
  });
};

export const updateProgress = async (progressData: Partial<OverallProgress>): Promise<void> => {
  const uid = getUserUid();
  const docRef = doc(db, 'users', uid, 'progress', 'overall');
  await setDoc(
    docRef,
    {
      ...progressData,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );
};

export const getProgress = async (): Promise<OverallProgress> => {
  const uid = getUserUid();
  const docRef = doc(db, 'users', uid, 'progress', 'overall');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as OverallProgress;
  }
  return await calculateAndSaveProgress();
};

export const getSubjectProgress = async (subjectId: string | number): Promise<SubjectProgress> => {
  const uid = getUserUid();
  const targetIdStr = String(subjectId);
  const topics = await getTopics(targetIdStr);

  const totalTopics = topics.length;
  const completedTopics = topics.filter((t) => t.completed).length;
  const pct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const totalHours = topics.reduce((acc, t) => acc + (t.estimated_hours || 0), 0);
  const completedHours = topics.filter((t) => t.completed).reduce((acc, t) => acc + (t.estimated_hours || 0), 0);

  return {
    subject_id: subjectId,
    user_id: uid,
    total_topics: totalTopics,
    completed_topics: completedTopics,
    progress_percentage: pct,
    total_hours: totalHours,
    completed_hours: completedHours,
    updated_at: new Date().toISOString(),
  };
};

export const calculateAndSaveProgress = async (): Promise<OverallProgress> => {
  const uid = getUserUid();
  const subjects = await getSubjects();
  const allTopics = await getTopics();

  const totalSubjects = subjects.length;
  const totalTopics = allTopics.length;
  const completedTopics = allTopics.filter((t) => t.completed).length;
  const overallPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const subjectProgressList: SubjectProgress[] = subjects.map((sub) => {
    const subTopics = allTopics.filter((t) => String(t.subject_id) === String(sub.id));
    const subTotal = subTopics.length;
    const subComp = subTopics.filter((t) => t.completed).length;
    const subPct = subTotal > 0 ? Math.round((subComp / subTotal) * 100) : 0;
    const totalH = subTopics.reduce((acc, t) => acc + (t.estimated_hours || 0), 0);
    const compH = subTopics.filter((t) => t.completed).reduce((acc, t) => acc + (t.estimated_hours || 0), 0);
    return {
      subject_id: sub.id,
      user_id: uid,
      total_topics: subTotal,
      completed_topics: subComp,
      progress_percentage: subPct,
      total_hours: totalH,
      completed_hours: compH,
      updated_at: new Date().toISOString(),
    };
  });

  const totalStudyHours = allTopics.reduce((acc, t) => acc + (t.estimated_hours || 0), 0);
  const completedStudyHours = allTopics.filter((t) => t.completed).reduce((acc, t) => acc + (t.estimated_hours || 0), 0);

  const overall: OverallProgress = {
    total_subjects: totalSubjects,
    total_topics: totalTopics,
    completed_topics: completedTopics,
    overall_percentage: overallPct,
    subject_progress: subjectProgressList,
    total_study_hours: totalStudyHours,
    completed_study_hours: completedStudyHours,
  };

  await saveProgress(overall).catch(() => {});
  return overall;
};

// ── ASSESSMENTS ───────────────────────────────────────────────────────────────
export const saveAssessment = async (assessmentData: Assessment): Promise<Assessment> => {
  const uid = getUserUid();
  const colRef = collection(db, 'users', uid, 'assessments');
  const now = new Date().toISOString();

  const docRef = await addDoc(colRef, {
    ...assessmentData,
    created_at: now,
    updated_at: now,
  });

  return {
    ...assessmentData,
    id: docRef.id,
    user_id: uid,
    created_at: now,
    updated_at: now,
  };
};

export const getAssessments = async (): Promise<Assessment[]> => {
  const uid = getUserUid();
  const colRef = collection(db, 'users', uid, 'assessments');
  const snapshot = await getDocs(colRef);
  const list: Assessment[] = [];
  snapshot.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
    list.push({
      id: d.id,
      user_id: uid,
      ...d.data(),
    } as Assessment);
  });
  return list;
};
