export interface QuestionItem {
  id: string;
  question: string;
  type: 'scale' | 'text';
  options?: string[];
}

export const ASSESSMENT_QUESTIONS: QuestionItem[] = [
  {
    id: "confidence",
    question: "How confident are you about this subject from 1 to 10?",
    type: "scale"
  },
  {
    id: "daily_hours",
    question: "How much time can you study this subject each day?",
    type: "text"
  },
  {
    id: "difficult_topics",
    question: "Which topics in this subject do you find difficult?",
    type: "text"
  },
  {
    id: "syllabus_completion",
    question: "How much of the syllabus have you completed?",
    type: "text"
  },
  {
    id: "consistency",
    question: "How consistently have you been studying this subject recently?",
    type: "text"
  },
  {
    id: "exam_readiness",
    question: "Do you feel ready for your upcoming exam?",
    type: "text"
  }
];
