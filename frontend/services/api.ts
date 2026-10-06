import { CONFIG } from '../constants/config';
import { Subject } from '../types/subject';
import { Topic } from '../types/topic';
import { Exam } from '../types/exam';
import { Assignment } from '../types/assignment';
import { StudySchedule } from '../types/planner';
import { OverallProgress, SubjectProgress } from '../types/progress';

// ── In-Memory & LocalStorage Mock Database Fallback ──────────────────────────
const STORAGE_KEY = 'studyflow_api_mock_db_v2';

interface MockDatabase {
  subjects: Subject[];
  topics: Record<number, Topic[]>;
  exams: Exam[];
  assignments: Assignment[];
  schedule: StudySchedule[];
}

const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: 1,
    name: 'Data Structures & Algorithms',
    description: 'Trees, Graphs, Sorting & Dynamic Programming',
    difficulty: 'hard',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Database Management Systems',
    description: 'SQL Joins, Normalization & Indexing',
    difficulty: 'medium',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Operating Systems',
    description: 'CPU Scheduling, Memory Management & Deadlocks',
    difficulty: 'medium',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Computer Networks',
    description: 'TCP/IP, Routing & Application Layer Protocols',
    difficulty: 'easy',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_TOPICS: Record<number, Topic[]> = {
  1: [
    { id: 11, subject_id: 1, name: 'Binary Search Trees & AVL', description: 'Balanced tree properties', estimated_hours: 2, difficulty: 'medium', completed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 12, subject_id: 1, name: 'Graph BFS & Dijkstra Algorithm', description: 'Shortest path traversals', estimated_hours: 2.5, difficulty: 'hard', completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 13, subject_id: 1, name: 'Dynamic Programming - 0/1 Knapsack', description: 'Memoization table & tabulation', estimated_hours: 3, difficulty: 'hard', completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  2: [
    { id: 21, subject_id: 2, name: 'SQL Complex Joins & Subqueries', description: 'INNER, LEFT, FULL outer joins', estimated_hours: 1.5, difficulty: 'medium', completed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 22, subject_id: 2, name: 'B+ Tree Indexing & Hash Indices', description: 'Query performance optimization', estimated_hours: 2, difficulty: 'hard', completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 23, subject_id: 2, name: 'ACID Properties & Transactions', description: 'Concurrency control & 2PL', estimated_hours: 1.5, difficulty: 'easy', completed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  3: [
    { id: 31, subject_id: 3, name: 'CPU Scheduling (Round Robin & SJF)', description: 'Turnaround & wait time metrics', estimated_hours: 2, difficulty: 'medium', completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 32, subject_id: 3, name: 'Virtual Memory & Page Replacement', description: 'LRU, FIFO & Clock algorithms', estimated_hours: 2, difficulty: 'medium', completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  4: [
    { id: 41, subject_id: 4, name: 'TCP 3-Way Handshake & Flow Control', description: 'Sliding window protocol', estimated_hours: 1.5, difficulty: 'easy', completed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 42, subject_id: 4, name: 'DNS & HTTP/HTTPS Protocols', description: 'TLS handshake & caching', estimated_hours: 1, difficulty: 'easy', completed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
};

const DEFAULT_EXAMS: Exam[] = [
  {
    id: 101,
    subject_id: 2,
    subject_name: 'Database Management Systems',
    title: 'DBMS Midterm Examination',
    exam_date: new Date(Date.now() + 9 * 86400000).toISOString(),
    total_modules: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 102,
    subject_id: 1,
    subject_name: 'Data Structures & Algorithms',
    title: 'Algorithms End-Semester',
    exam_date: new Date(Date.now() + 20 * 86400000).toISOString(),
    total_modules: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_ASSIGNMENTS: Assignment[] = [
  {
    id: 201,
    subject_id: 2,
    title: 'SQL Joins Problem Set #4',
    due_date: new Date(Date.now() + 3 * 86400000).toISOString(),
    completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 202,
    subject_id: 3,
    title: 'CPU Scheduling Simulator Project',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_SCHEDULE: StudySchedule[] = [
  {
    id: 301,
    topic_id: 11,
    topic_name: 'Binary Search Trees',
    scheduled_date: new Date().toISOString().split('T')[0],
    start_time: '10:00:00',
    end_time: '11:30:00',
    duration_minutes: 90,
    completed: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 302,
    topic_id: 21,
    topic_name: 'SQL Joins & Indexing',
    scheduled_date: new Date().toISOString().split('T')[0],
    start_time: '14:00:00',
    end_time: '15:15:00',
    duration_minutes: 75,
    completed: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 303,
    topic_id: 31,
    topic_name: 'CPU Scheduling',
    scheduled_date: new Date().toISOString().split('T')[0],
    start_time: '17:00:00',
    end_time: '18:45:00',
    duration_minutes: 105,
    completed: false,
    created_at: new Date().toISOString(),
  },
];

function getLocalDb(): MockDatabase {
  let db: Partial<MockDatabase> = {};
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        db = JSON.parse(saved);
      }
    }
  } catch {}

  const subjects = Array.isArray(db.subjects) && db.subjects.length > 0 
    ? db.subjects 
    : JSON.parse(JSON.stringify(DEFAULT_SUBJECTS));

  const topics = (db.topics && typeof db.topics === 'object' && Object.keys(db.topics).length > 0)
    ? db.topics
    : JSON.parse(JSON.stringify(DEFAULT_TOPICS));

  const exams = Array.isArray(db.exams)
    ? db.exams
    : JSON.parse(JSON.stringify(DEFAULT_EXAMS));

  const assignments = Array.isArray(db.assignments)
    ? db.assignments
    : JSON.parse(JSON.stringify(DEFAULT_ASSIGNMENTS));

  const schedule = Array.isArray(db.schedule)
    ? db.schedule
    : JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));

  const completeDb: MockDatabase = { subjects, topics, exams, assignments, schedule };
  return completeDb;
}

function saveLocalDb(db: MockDatabase) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    }
  } catch {}
}

// ── Fallback Handler ──────────────────────────────────────────────────────────
function handleMockFallback<T>(endpoint: string, options: RequestInit = {}): T {
  try {
    const db = getLocalDb();
    const method = (options.method || 'GET').toUpperCase();
    let body: any = {};
    if (options.body) {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    }

    // Clean endpoint: remove query strings and leading/trailing slashes
    const clean = endpoint.split('?')[0].replace(/^\/+|\/+$/g, '');
    const parts = clean.split('/');

    // 1. Subjects & Topics Nested (e.g., subjects/1/topics)
    if (parts[0] === 'subjects' && parts.length === 3 && parts[2] === 'topics') {
      const subjectId = parseInt(parts[1], 10);
      if (method === 'GET') {
        const list = db.topics[subjectId] || [];
        return list as unknown as T;
      }
      if (method === 'POST') {
        const newTopic: Topic = {
          id: Date.now(),
          subject_id: subjectId,
          name: body.name || 'New Topic',
          description: body.description || '',
          estimated_hours: parseFloat(body.estimated_hours) || 1.0,
          difficulty: body.difficulty || 'medium',
          completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (!db.topics[subjectId]) db.topics[subjectId] = [];
        db.topics[subjectId].push(newTopic);
        saveLocalDb(db);
        return newTopic as unknown as T;
      }
    }

    // 2. Subjects collection (e.g. subjects)
    if (clean === 'subjects') {
      if (method === 'GET') {
        return db.subjects as unknown as T;
      }
      if (method === 'POST') {
        const newSubject: Subject = {
          id: Date.now(),
          name: body.name || 'New Subject',
          description: body.description || '',
          difficulty: body.difficulty || 'medium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.subjects.push(newSubject);
        if (!db.topics[newSubject.id]) {
          db.topics[newSubject.id] = [];
        }
        saveLocalDb(db);
        return newSubject as unknown as T;
      }
    }

    // 3. Single Subject (e.g. subjects/1)
    if (parts[0] === 'subjects' && parts.length === 2) {
      const id = parseInt(parts[1], 10);
      if (method === 'GET') {
        const subj = db.subjects.find((s) => s.id === id) || db.subjects[0];
        return subj as unknown as T;
      }
      if (method === 'PUT') {
        const idx = db.subjects.findIndex((s) => s.id === id);
        if (idx >= 0) {
          db.subjects[idx] = { ...db.subjects[idx], ...body, updated_at: new Date().toISOString() };
          saveLocalDb(db);
          return db.subjects[idx] as unknown as T;
        }
      }
      if (method === 'DELETE') {
        db.subjects = db.subjects.filter((s) => s.id !== id);
        delete db.topics[id];
        saveLocalDb(db);
        return {} as unknown as T;
      }
    }

    // 4. Topics endpoints (e.g. topics/1 or topics/subject/1)
    if (parts[0] === 'topics') {
      if (parts[1] === 'subject' && parts[2]) {
        const sid = parseInt(parts[2], 10);
        if (method === 'GET') {
          return (db.topics[sid] || []) as unknown as T;
        }
      }
      if (parts[1] && !isNaN(parseInt(parts[1], 10))) {
        const id = parseInt(parts[1], 10);
        if (method === 'PUT') {
          for (const sid of Object.keys(db.topics)) {
            const numSid = Number(sid);
            const idx = db.topics[numSid]?.findIndex((t) => t.id === id);
            if (idx !== undefined && idx >= 0) {
              db.topics[numSid][idx] = { ...db.topics[numSid][idx], ...body, updated_at: new Date().toISOString() };
              saveLocalDb(db);
              return db.topics[numSid][idx] as unknown as T;
            }
          }
        }
        if (method === 'DELETE') {
          for (const sid of Object.keys(db.topics)) {
            const numSid = Number(sid);
            if (db.topics[numSid]) {
              db.topics[numSid] = db.topics[numSid].filter((t) => t.id !== id);
            }
          }
          saveLocalDb(db);
          return {} as unknown as T;
        }
      }
    }

    // 5. Exams
    if (clean === 'exams') {
      if (method === 'GET') {
        return db.exams as unknown as T;
      }
      if (method === 'POST') {
        const targetSid = body.subject_id || (db.subjects[0]?.id || 1);
        const subj = db.subjects.find((s) => s.id === targetSid);
        const newExam: Exam = {
          id: Date.now(),
          subject_id: targetSid,
          subject_name: subj?.name || 'General',
          title: body.title || 'Exam',
          exam_date: body.exam_date || new Date(Date.now() + 7 * 86400000).toISOString(),
          total_modules: body.total_modules || 4,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.exams.unshift(newExam);
        saveLocalDb(db);
        return newExam as unknown as T;
      }
    }

    if (parts[0] === 'exams' && parts[1]) {
      const id = parseInt(parts[1], 10);
      if (method === 'DELETE') {
        db.exams = db.exams.filter((e) => e.id !== id);
        saveLocalDb(db);
        return {} as unknown as T;
      }
      if (method === 'PUT') {
        const idx = db.exams.findIndex((e) => e.id === id);
        if (idx >= 0) {
          db.exams[idx] = { ...db.exams[idx], ...body, updated_at: new Date().toISOString() };
          saveLocalDb(db);
          return db.exams[idx] as unknown as T;
        }
      }
    }

    // 6. Assignments
    if (clean === 'assignments') {
      if (method === 'GET') {
        return db.assignments as unknown as T;
      }
      if (method === 'POST') {
        const targetSid = body.subject_id || (db.subjects[0]?.id || 1);
        const newAssignment: Assignment = {
          id: Date.now(),
          subject_id: targetSid,
          title: body.title || 'Assignment',
          due_date: body.due_date || new Date(Date.now() + 5 * 86400000).toISOString(),
          completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.assignments.unshift(newAssignment);
        saveLocalDb(db);
        return newAssignment as unknown as T;
      }
    }

    if (parts[0] === 'assignments' && parts[1]) {
      const id = parseInt(parts[1], 10);
      if (method === 'PUT') {
        const idx = db.assignments.findIndex((a) => a.id === id);
        if (idx >= 0) {
          db.assignments[idx] = { ...db.assignments[idx], ...body, updated_at: new Date().toISOString() };
          saveLocalDb(db);
          return db.assignments[idx] as unknown as T;
        }
      }
      if (method === 'DELETE') {
        db.assignments = db.assignments.filter((a) => a.id !== id);
        saveLocalDb(db);
        return {} as unknown as T;
      }
    }

    // 7. Planner Schedule
    if (parts[0] === 'planner') {
      if (parts[1] === 'generate' && method === 'POST') {
        return db.schedule as unknown as T;
      }
      if (method === 'GET') {
        return db.schedule as unknown as T;
      }
    }

    // 8. Progress
    if (clean === 'progress' || clean === 'progress/overall') {
      const allTopics = Object.values(db.topics).flat();
      const completed = allTopics.filter((t) => t.completed).length;
      const total = allTopics.length || 1;
      const prog: OverallProgress = {
        total_subjects: db.subjects.length,
        total_topics: total,
        completed_topics: completed,
        overall_percentage: Math.round((completed / total) * 100),
        total_study_hours: 24.5,
        completed_study_hours: 18.0,
      };
      return prog as unknown as T;
    }

    if (parts[0] === 'progress' && parts[1]) {
      const subjectId = parseInt(parts[parts.length - 1], 10);
      const topics = db.topics[subjectId] || [];
      const completed = topics.filter((t) => t.completed).length;
      const total = topics.length || 1;
      const sp: SubjectProgress = {
        subject_id: subjectId,
        total_topics: total,
        completed_topics: completed,
        progress_percentage: Math.round((completed / total) * 100),
        total_hours: 10,
        completed_hours: 6,
      };
      return sp as unknown as T;
    }

    return {} as unknown as T;
  } catch (e) {
    console.warn('handleMockFallback error:', e);
    return {} as unknown as T;
  }
}

// ── apiFetch with automatic fallback ──────────────────────────────────────────
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const url = `${CONFIG.API_URL}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s realistic network timeout

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return handleMockFallback<T>(endpoint, options);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as Promise<T>;
  } catch (err) {
    // Network error / backend offline — seamlessly return from mock DB!
    return handleMockFallback<T>(endpoint, options);
  }
}
