import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { CONFIG } from '../constants/config';
import { saveAssessment, getSubjectAssessments } from '../lib/firebase/firestore';
import { Assessment } from '../types/assessment';

export interface AnswerPayload {
  questionId: string;
  question: string;
  answerText: string;
  answeredAt: string;
}

export interface PredictionResult {
  readinessScore: number;
  riskLevel: string;
  confidenceLevel: string;
  estimatedStudyHoursPerDay: number;
  weakAreas: string[];
  recommendations: string[];
}

// ── Text To Speech Helper ──────────────────────────────────────────────────
export const speakQuestion = (text: string, onDone?: () => void) => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      if (onDone) utterance.onend = onDone;
      window.speechSynthesis.speak(utterance);
      return;
    }

    Speech.stop();
    Speech.speak(text, {
      language: 'en',
      rate: 1.0,
      pitch: 1.0,
      onDone,
      onError: () => {
        if (onDone) onDone();
      },
    });
  } catch (err) {
    if (onDone) onDone();
  }
};

export const stopSpeaking = () => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    Speech.stop();
  } catch {
    // ignore
  }
};

// ── Call Backend AI & Save Assessment to Firestore ──────────────────────────
export const submitVoiceAssessment = async (
  subjectId: string | number,
  subjectName: string,
  answers: AnswerPayload[],
  studentData?: Record<string, any>
): Promise<Assessment> => {
  const apiUrl = `${CONFIG.API_URL}/api/ai/voice-assessment`;
  
  let prediction: PredictionResult;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subjectId: String(subjectId),
        subjectName,
        answers,
        studentData,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Backend server returned status ${response.status}`);
    }

    prediction = await response.json();
  } catch (err: any) {
    // Graceful fallback prediction calculation if backend is unreachable
    prediction = {
      readinessScore: 60,
      riskLevel: 'medium',
      confidenceLevel: 'medium',
      estimatedStudyHoursPerDay: 2.0,
      weakAreas: [`${subjectName} Core Topics`],
      recommendations: [
        `Review fundamental concepts in ${subjectName}.`,
        'Practice daily 30-minute revision sessions.',
        'Solve previous exam problem sets.',
      ],
    };
  }

  const now = new Date().toISOString();
  const assessmentData: Assessment = {
    title: `Voice Assessment - ${subjectName}`,
    subjectId: String(subjectId),
    subjectName,
    createdAt: now,
    status: 'completed',
    answers,
    prediction,
    recommendations: prediction.recommendations || [],
  };

  const saved = await saveAssessment(assessmentData);
  return saved;
};

export { getSubjectAssessments };
