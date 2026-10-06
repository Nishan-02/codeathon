import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ASSESSMENT_QUESTIONS } from '../../constants/assessmentQuestions';
import {
  speakQuestion,
  stopSpeaking,
  submitVoiceAssessment,
  AnswerPayload,
} from '../../services/aiAssessment';
import { SubjectService } from '../../services/subjects';
import { TopicService } from '../../services/topics';
import { Assessment } from '../../types/assessment';
import { Subject } from '../../types/subject';
import { useAuth } from '../../hooks/useAuth';

export default function VoiceAssessmentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const idStr = subjectId || '1';

  const [subject, setSubject] = useState<Subject | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerPayload[]>([]);
  const [transcribedText, setTranscribedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Tap microphone to speak');

  const [submitting, setSubmitting] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<Assessment | null>(null);

  const recognitionRef = useRef<any>(null);

  // Load Subject details
  useEffect(() => {
    if (!user) return;
    SubjectService.getById(idStr)
      .then((s) => {
        if (s) setSubject(s);
        else setSubject({ id: idStr, name: 'Subject Assessment', difficulty: 'medium' });
      })
      .catch(() => {
        setSubject({ id: idStr, name: 'Subject Assessment', difficulty: 'medium' });
      });
  }, [idStr, user]);

  const currentQ = ASSESSMENT_QUESTIONS[currentIdx];

  // Speak current question when index changes
  useEffect(() => {
    if (!currentQ) return;
    setTranscribedText('');
    setIsListening(false);
    setStatusMessage('Tap microphone to speak');

    setIsSpeaking(true);
    speakQuestion(currentQ.question, () => {
      setIsSpeaking(false);
    });

    return () => {
      stopSpeaking();
    };
  }, [currentIdx, currentQ]);

  // Handle Speech Recognition initialization
  const toggleListening = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      setStatusMessage('Listening stopped');
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setStatusMessage('Speech recognition unavailable in browser. Please type below.');
        Alert.alert(
          'Speech Recognition Unavailable',
          'Your browser does not support Web Speech Recognition. You can type your answer in the text field below.'
        );
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setStatusMessage('Listening... Speak now 🎙️');
        };

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setTranscribedText(transcript);
        };

        recognition.onerror = (event: any) => {
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setStatusMessage('Microphone access denied. Please type your answer.');
            Alert.alert('Microphone Access Denied', 'Please grant microphone permissions or type your answer.');
          } else {
            setStatusMessage(`Speech error: ${event.error || 'stopped'}. You can type below.`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          setStatusMessage('Speech captured! Review your answer and press Continue.');
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        setIsListening(false);
        setStatusMessage('Speech recognition failed. Please type your answer.');
      }
    } else {
      setStatusMessage('Voice recognition works on Web/Development Build. Please type answer.');
      Alert.alert(
        'Speech Recognition Notice',
        'Speech recognition works directly on Web browsers or Native Expo development builds. You can type your answer below.'
      );
    }
  };

  const handleNext = async () => {
    if (!transcribedText.trim()) {
      Alert.alert('Input Required', 'Please speak or type your answer before continuing.');
      return;
    }

    stopSpeaking();
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }

    const answerPayload: AnswerPayload = {
      questionId: currentQ.id,
      question: currentQ.question,
      answerText: transcribedText.trim(),
      answeredAt: new Date().toISOString(),
    };

    const updatedAnswers = [...answers, answerPayload];
    setAnswers(updatedAnswers);

    if (currentIdx < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // Completed all questions -> submit for AI Analysis
      try {
        setSubmitting(true);
        setStatusMessage('Analyzing responses with AI...');

        const topics = await TopicService.getBySubject(idStr).catch(() => []);
        const completedCount = topics.filter((t) => t.completed).length;

        const result = await submitVoiceAssessment(
          idStr,
          subject?.name || 'Mathematics',
          updatedAnswers,
          {
            totalTopics: topics.length,
            completedTopics: completedCount,
            progressPercentage: topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0,
          }
        );

        setAssessmentResult(result);
      } catch (err: any) {
        Alert.alert('Analysis Notice', err.message || 'Saved assessment locally.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleReplayQuestion = () => {
    if (!currentQ) return;
    setIsSpeaking(true);
    speakQuestion(currentQ.question, () => setIsSpeaking(false));
  };

  // ── RESULT SCREEN ─────────────────────────────────────────────────────────
  if (assessmentResult) {
    const pred = assessmentResult.prediction || {};
    const readiness = pred.readinessScore ?? 60;
    const risk = (pred.riskLevel || 'MEDIUM').toUpperCase();
    const confidence = (pred.confidenceLevel || 'MEDIUM').toUpperCase();
    const studyHours = pred.estimatedStudyHoursPerDay ?? 2.0;
    const weakAreas = pred.weakAreas || [];
    const recommendations = assessmentResult.recommendations || pred.recommendations || [];

    const riskColor = risk === 'HIGH' ? '#EF4444' : risk === 'MEDIUM' ? '#F59E0B' : '#10B981';

    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0B132B" />
        <ScrollView style={styles.container} contentContainerStyle={styles.resultContent}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultBadge}>AI ASSESSMENT RESULT</Text>
            <Text style={styles.resultSubject}>{assessmentResult.subjectName || 'Subject'}</Text>
            <Text style={styles.resultDate}>
              Completed on {new Date(assessmentResult.createdAt || Date.now()).toLocaleDateString()}
            </Text>
          </View>

          {/* Readiness Score Card */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Estimated Readiness</Text>
            <Text style={styles.scoreNumber}>{readiness}%</Text>
            <View style={styles.scoreBarTrack}>
              <View style={[styles.scoreBarFill, { width: `${readiness}%` }]} />
            </View>
          </View>

          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>ACADEMIC RISK</Text>
              <Text style={[styles.metricValue, { color: riskColor }]}>{risk}</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>CONFIDENCE</Text>
              <Text style={styles.metricValue}>{confidence}</Text>
            </View>
          </View>

          {/* Study Time Recommendation */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>⏱ Recommended Study Time</Text>
            <Text style={styles.infoValue}>{studyHours} hours/day</Text>
          </View>

          {/* Weak Areas */}
          {weakAreas.length > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>⚠️ Weak Areas Identified</Text>
              {weakAreas.map((area: string, i: number) => (
                <Text key={i} style={styles.bulletItem}>
                  • {area}
                </Text>
              ))}
            </View>
          )}

          {/* Recommendations */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 AI Recommendations</Text>
            {recommendations.map((rec: string, i: number) => (
              <Text key={i} style={styles.bulletItem}>
                • {rec}
              </Text>
            ))}
          </View>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.push(`/subjects/${idStr}`)}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── LOADING / SUBMITTING STATE ────────────────────────────────────────────
  if (submitting) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00C9A7" />
          <Text style={styles.loadingTitle}>Analyzing Your Spoken Responses...</Text>
          <Text style={styles.loadingSub}>Gemini AI is computing your academic readiness and recommendations</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progressPct = Math.round(((currentIdx + 1) / ASSESSMENT_QUESTIONS.length) * 100);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B132B" />
      <ScrollView style={styles.container} contentContainerStyle={styles.assessmentContent}>
        {/* Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.push(`/subjects/${idStr}`)}>
            <Text style={styles.closeBtnText}>✕ Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voice Assessment</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={styles.subjectNameText}>{subject?.name || 'Subject'}</Text>
        <Text style={styles.questionStepText}>
          Question {currentIdx + 1} of {ASSESSMENT_QUESTIONS.length}
        </Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>

        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>"{currentQ.question}"</Text>
          <TouchableOpacity style={styles.ttsBtn} onPress={handleReplayQuestion} activeOpacity={0.8}>
            <Text style={styles.ttsBtnText}>{isSpeaking ? '🔊 Speaking...' : '🗣️ Listen Question'}</Text>
          </TouchableOpacity>
        </View>

        {/* Microphone Container */}
        <View style={styles.micSection}>
          <TouchableOpacity
            style={[styles.micBtn, isListening ? styles.micBtnActive : null]}
            onPress={toggleListening}
            activeOpacity={0.8}
          >
            <Text style={styles.micEmoji}>{isListening ? '🎙️' : '🎤'}</Text>
          </TouchableOpacity>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>

        {/* Transcribed / Manual Answer Input */}
        <View style={styles.answerBox}>
          <Text style={styles.answerLabel}>Your Answer:</Text>
          <TextInput
            style={styles.answerInput}
            value={transcribedText}
            onChangeText={setTranscribedText}
            placeholder="Speak or type your answer here..."
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.continueBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>
            {currentIdx === ASSESSMENT_QUESTIONS.length - 1 ? 'Finish & Analyze →' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B132B' },
  container: { flex: 1, backgroundColor: '#0B132B' },
  assessmentContent: { padding: 20, paddingBottom: 40, alignItems: 'center' },

  topHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#1E293B', borderRadius: 8 },
  closeBtnText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

  subjectNameText: { color: '#00C9A7', fontSize: 22, fontWeight: '800', marginTop: 4 },
  questionStepText: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginTop: 4, marginBottom: 12 },

  progressTrack: { width: '100%', height: 6, backgroundColor: '#1E293B', borderRadius: 99, marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#00C9A7', borderRadius: 99 },

  questionCard: {
    width: '100%',
    backgroundColor: '#1C2541',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 167, 0.2)',
  },
  questionText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', textAlign: 'center', lineHeight: 26, marginBottom: 14 },
  ttsBtn: { backgroundColor: '#0F172A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
  ttsBtnText: { color: '#38BDF8', fontSize: 13, fontWeight: '600' },

  micSection: { alignItems: 'center', marginBottom: 24 },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    marginBottom: 10,
  },
  micBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#F87171',
    shadowColor: '#EF4444',
  },
  micEmoji: { fontSize: 36 },
  statusText: { color: '#94A3B8', fontSize: 13, fontWeight: '500', textAlign: 'center' },

  answerBox: { width: '100%', backgroundColor: '#1C2541', borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
  answerLabel: { color: '#00C9A7', fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  answerInput: { color: '#FFFFFF', fontSize: 15, textAlignVertical: 'top', minHeight: 70 },

  continueBtn: { width: '100%', backgroundColor: '#00C9A7', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  continueBtnText: { color: '#0B132B', fontSize: 16, fontWeight: '800' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  loadingSub: { color: '#94A3B8', fontSize: 14, textAlign: 'center', maxWidth: 300 },

  // Result Styles
  resultContent: { padding: 20, paddingBottom: 40 },
  resultHeader: { alignItems: 'center', marginBottom: 20 },
  resultBadge: { color: '#00C9A7', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  resultSubject: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', marginTop: 4 },
  resultDate: { color: '#94A3B8', fontSize: 12, marginTop: 4 },

  scoreCard: { backgroundColor: '#1C2541', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0, 201, 167, 0.3)' },
  scoreLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  scoreNumber: { color: '#FFFFFF', fontSize: 44, fontWeight: '800', marginVertical: 8 },
  scoreBarTrack: { width: '100%', height: 8, backgroundColor: '#0F172A', borderRadius: 99, overflow: 'hidden' },
  scoreBarFill: { height: '100%', backgroundColor: '#00C9A7', borderRadius: 99 },

  metricsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  metricCard: { flex: 1, backgroundColor: '#1C2541', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  metricLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  metricValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 6 },

  infoCard: { backgroundColor: '#1C2541', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#334155' },
  infoTitle: { color: '#38BDF8', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  infoValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  bulletItem: { color: '#E2E8F0', fontSize: 14, lineHeight: 22, marginTop: 4 },

  doneBtn: { backgroundColor: '#00C9A7', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  doneBtnText: { color: '#0B132B', fontSize: 16, fontWeight: '800' },
});
