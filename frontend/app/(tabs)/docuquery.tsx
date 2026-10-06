import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  ImageBackground,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Radius, Spacing, FontSize } from '../../constants/theme';
import { RAGService } from '../../services/rag';
import {
  PersonalizedStudyPlan,
  ChunkInfo,
  AskQuestionResponse,
  StudyModule,
  QuizQuestion,
} from '../../types/rag';

export default function DocuQueryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── States ─────────────────────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  
  // Customization Options
  const [dailyHours, setDailyHours] = useState<number>(2.0);
  const [targetWeeks, setTargetWeeks] = useState<number>(4);
  const [goal, setGoal] = useState<string>('Exam Prep & High Retention');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [apiKey, setApiKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Loaded Document & Plan
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeFilename, setActiveFilename] = useState<string>('');
  const [studyPlan, setStudyPlan] = useState<PersonalizedStudyPlan | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Q&A / DocuQuery AI Chat
  const [question, setQuestion] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [qaHistory, setQaHistory] = useState<
    Array<{
      question: string;
      answer: string;
      chunks: ChunkInfo[];
      timestamp: string;
    }>
  >([]);
  const [expandedChunkId, setExpandedChunkId] = useState<number | null>(null);

  // Quiz interactive state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [revealedQuiz, setRevealedQuiz] = useState<Record<number, boolean>>({});

  // Collapsible modules
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({ 1: true });

  // ── Check if document already loaded on mount ───────────────────────────────
  useEffect(() => {
    RAGService.getStatus()
      .then((status) => {
        if (status.has_document && status.document_id) {
          setActiveDocId(status.document_id);
          setActiveFilename(status.filename || 'Document');
        }
      })
      .catch(() => {});
  }, []);

  // ── File Handlers ──────────────────────────────────────────────────────────
  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: any) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        setSelectedFile(e.dataTransfer.files[0]);
      }
    }
  };

  const handleDragOver = (e: any) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: any) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      setIsDragging(false);
    }
  };

  // ── Ingest Document & Generate Study Plan ───────────────────────────────────
  const processDocument = async (fileToProcess?: File) => {
    const file = fileToProcess || selectedFile;
    if (!file) {
      alertMsg('Please select or drop a file first.');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessStep('1/3 Extracting Text & Parsing Document Structure...');
      
      await new Promise((r) => setTimeout(r, 600));
      setProcessStep('2/3 Chunking & Building RAG Vector Index...');

      const response = await RAGService.uploadDocument(file, {
        daily_hours: dailyHours,
        target_weeks: targetWeeks,
        goal,
        difficulty,
        api_key: apiKey.trim() || undefined,
      });

      setProcessStep('3/3 Synthesizing Personalized Study Schedule...');
      await new Promise((r) => setTimeout(r, 400));

      setActiveDocId(response.document_id);
      setActiveFilename(response.filename);
      setStudyPlan(response.study_plan);
      setSyncSuccessMsg(null);

      // Pre-expand first module
      setExpandedWeeks({ 1: true });
    } catch (err: any) {
      alertMsg(err.message || 'Error processing document.');
    } finally {
      setIsProcessing(false);
      setProcessStep('');
    }
  };

  // ── 1-Click Load Sample Document ───────────────────────────────────────────
  const handleLoadSample = async () => {
    try {
      setIsProcessing(true);
      setProcessStep('Loading Sample Syllabus (Student Code of Conduct)...');
      const response = await RAGService.loadSample(dailyHours, targetWeeks);
      setActiveDocId(response.document_id);
      setActiveFilename(response.filename);
      setStudyPlan(response.study_plan);
      setSyncSuccessMsg(null);
      setExpandedWeeks({ 1: true });
    } catch (err: any) {
      alertMsg(err.message || 'Could not load sample document.');
    } finally {
      setIsProcessing(false);
      setProcessStep('');
    }
  };

  // ── 1-Click Sync to Planner / Subjects ──────────────────────────────────────
  const handleSyncToPlanner = async () => {
    if (!studyPlan) return;
    try {
      setIsSyncing(true);
      const res = await RAGService.syncToPlanner(studyPlan);
      setSyncSuccessMsg(
        `✓ Created Subject "${res.subject_name}" with ${res.topics_count} structured topics in your planner!`
      );
    } catch (err: any) {
      alertMsg(err.message || 'Failed to sync study plan to database.');
    } finally {
      setIsSyncing(false);
    }
  };

  // ── DocuQuery AI Ask Question ───────────────────────────────────────────────
  const handleAskQuestion = async (presetQuestion?: string) => {
    const q = presetQuestion || question;
    if (!q || !q.trim()) return;

    try {
      setIsAsking(true);
      setQuestion('');
      const res = await RAGService.askQuestion(
        q,
        activeDocId || undefined,
        apiKey.trim() || undefined
      );

      setQaHistory((prev) => [
        {
          question: q,
          answer: res.answer,
          chunks: res.chunks,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);
    } catch (err: any) {
      alertMsg(err.message || 'Error querying document.');
    } finally {
      setIsAsking(false);
    }
  };

  const alertMsg = (msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('DocuQuery AI', msg);
    }
  };

  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekNum]: !prev[weekNum],
    }));
  };

  const handleSelectQuizAnswer = (qIdx: number, optionLetter: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: optionLetter,
    }));
    setRevealedQuiz((prev) => ({
      ...prev,
      [qIdx]: true,
    }));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ImageBackground
      source={require('../../assets/images/calendar-bg.jpg')}
      style={s.bgImage}
      resizeMode="cover"
    >
      <View style={s.bgOverlay} />
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#070D18" />

        <View style={s.pageWrapper}>
          {/* ── Left Sidebar (Desktop) ── */}
          {isDesktop && (
            <View style={s.sidebar}>
              <TouchableOpacity
                style={s.sidebarLogo}
                onPress={() => router.push('/(tabs)')}
                activeOpacity={0.8}
              >
                <View style={s.logoSquare}>
                  <Text style={s.logoIcon}>📖</Text>
                </View>
                <View>
                  <Text style={s.logoTitle}>StudyFlow</Text>
                  <Text style={s.logoSubtitle}>AI-Powered Learning</Text>
                </View>
              </TouchableOpacity>

              <View style={s.navMenu}>
                <TouchableOpacity
                  style={s.navItem}
                  onPress={() => router.push('/(tabs)')}
                  activeOpacity={0.7}
                >
                  <Text style={s.navIcon}>🏠</Text>
                  <Text style={s.navLabel}>Today</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.navItem}
                  onPress={() => router.push('/(tabs)/subjects')}
                  activeOpacity={0.7}
                >
                  <Text style={s.navIcon}>📚</Text>
                  <Text style={s.navLabel}>Subjects</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.navItem}
                  onPress={() => router.push('/(tabs)/planner')}
                  activeOpacity={0.7}
                >
                  <Text style={s.navIcon}>⚡</Text>
                  <Text style={s.navLabel}>Planner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.navItem, s.navItemActive]}
                  activeOpacity={0.9}
                >
                  <Text style={[s.navIcon, s.navIconActive]}>📑</Text>
                  <Text style={[s.navLabel, s.navLabelActive]}>DocuQuery AI</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.navItem}
                  onPress={() => router.push('/(tabs)/calendar')}
                  activeOpacity={0.7}
                >
                  <Text style={s.navIcon}>📅</Text>
                  <Text style={s.navLabel}>Calendar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.navItem}
                  onPress={() => router.push('/(tabs)/progress')}
                  activeOpacity={0.7}
                >
                  <Text style={s.navIcon}>📊</Text>
                  <Text style={s.navLabel}>Progress</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.navItem}
                  onPress={() => router.push('/(tabs)/profile')}
                  activeOpacity={0.7}
                >
                  <Text style={s.navIcon}>👤</Text>
                  <Text style={s.navLabel}>Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <ScrollView
            style={s.container}
            contentContainerStyle={[s.contentContainer, isDesktop && s.desktopContent]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[s.innerWrapper, !isDesktop && s.mobileInner]}>
              {/* ── HEADER ── */}
              <View style={s.header}>
                <View style={s.headerBadge}>
                  <Text style={s.headerBadgeText}>⚡ RAG KNOWLEDGE SYSTEM</Text>
                </View>
                <Text style={s.headerTitle}>DocuQuery AI</Text>
                <Text style={s.headerSubtitle}>
            Drop your syllabus, textbook, or notes to synthesize a personalized study plan and query the document in real time.
          </Text>

          {/* Quick API Key / Settings trigger */}
          <TouchableOpacity
            style={s.settingsToggle}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Text style={s.settingsToggleText}>
              ⚙️ {showSettings ? 'Hide AI Config' : 'AI Config & OpenRouter Key'}
            </Text>
          </TouchableOpacity>

          {showSettings && (
            <View style={s.settingsBox}>
              <Text style={s.settingsLabel}>OpenRouter API Key (Optional — Free fallback active):</Text>
              <TextInput
                style={s.settingsInput}
                placeholder="sk-or-v1-... (optional)"
                placeholderTextColor={Colors.textMuted}
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry
              />
              <Text style={s.settingsHint}>
                If empty, DocuQuery uses the smart in-memory TF-IDF RAG & pedagogical synthesis engine automatically.
              </Text>
            </View>
          )}
        </View>

        {/* ── DROP YOUR FILES CARD SECTION ── */}
        <View style={s.cardWrapper}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionIcon}>📥</Text>
            <Text style={s.sectionHeading}>Drop Your Files</Text>
          </View>

          {/* Web hidden file input */}
          {Platform.OS === 'web' && (
            <input
              type="file"
              ref={fileInputRef as any}
              style={{ display: 'none' }}
              accept=".pdf,.txt,.md,.json,.docx"
              onChange={handleFileChange}
            />
          )}

          {/* Drag & Drop Card */}
          <View
            style={[s.dropzone, isDragging && s.dropzoneActive]}
            {...(Platform.OS === 'web'
              ? {
                  onDragOver: handleDragOver,
                  onDragLeave: handleDragLeave,
                  onDrop: handleDrop,
                }
              : {})}
          >
            <View style={s.dropIconCircle}>
              <Text style={s.dropIcon}>{isDragging ? '📂' : '📄'}</Text>
            </View>

            {selectedFile ? (
              <View style={s.selectedFileCard}>
                <Text style={s.selectedFileIcon}>✓</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.selectedFileName} numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  <Text style={s.selectedFileSize}>
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready for RAG
                  </Text>
                </View>
                <TouchableOpacity
                  style={s.fileRemoveBtn}
                  onPress={() => setSelectedFile(null)}
                >
                  <Text style={s.fileRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={s.dropMainText}>
                  {isDragging ? 'Drop your file here!' : 'Drag & drop syllabus or lecture notes here'}
                </Text>
                <Text style={s.dropSubText}>
                  Supports PDF, TXT, Markdown, Word (.docx)
                </Text>

                <View style={s.dropActionsRow}>
                  <TouchableOpacity
                    style={s.browseBtn}
                    onPress={() => {
                      if (Platform.OS === 'web' && fileInputRef.current) {
                        fileInputRef.current.click();
                      } else {
                        alertMsg('File browsing is supported on web browser.');
                      }
                    }}
                  >
                    <Text style={s.browseBtnText}>Browse Files</Text>
                  </TouchableOpacity>

                  <Text style={s.orDivider}>or</Text>

                  <TouchableOpacity
                    style={s.sampleBtn}
                    onPress={handleLoadSample}
                    disabled={isProcessing}
                  >
                    <Text style={s.sampleBtnText}>⚡ Try Sample Syllabus</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Study Plan Customization Options */}
          <View style={s.preferencesContainer}>
            <Text style={s.prefTitle}>Personalize Your Study Strategy:</Text>

            {/* Daily Hours Selector */}
            <View style={s.prefRow}>
              <Text style={s.prefLabel}>Daily Study Time:</Text>
              <View style={s.pillGroup}>
                {[1, 1.5, 2, 3, 4].map((hrs) => (
                  <TouchableOpacity
                    key={hrs}
                    style={[s.pill, dailyHours === hrs && s.pillActive]}
                    onPress={() => setDailyHours(hrs)}
                  >
                    <Text
                      style={[s.pillText, dailyHours === hrs && s.pillTextActive]}
                    >
                      {hrs}h/day
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Target Duration Selector */}
            <View style={s.prefRow}>
              <Text style={s.prefLabel}>Target Duration:</Text>
              <View style={s.pillGroup}>
                {[2, 4, 6, 8].map((w) => (
                  <TouchableOpacity
                    key={w}
                    style={[s.pill, targetWeeks === w && s.pillActive]}
                    onPress={() => setTargetWeeks(w)}
                  >
                    <Text
                      style={[s.pillText, targetWeeks === w && s.pillTextActive]}
                    >
                      {w} Weeks
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Goal Selector */}
            <View style={s.prefRow}>
              <Text style={s.prefLabel}>Study Goal:</Text>
              <View style={s.pillGroup}>
                {[
                  'Exam Prep & High Retention',
                  'Deep Mastery',
                  'Rapid Revision',
                ].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[s.pill, goal === g && s.pillActive]}
                    onPress={() => setGoal(g)}
                  >
                    <Text
                      style={[s.pillText, goal === g && s.pillTextActive]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Action Button: Generate Personalized Study Plan */}
          <TouchableOpacity
            style={[
              s.generateBtn,
              (!selectedFile && !activeDocId) && s.generateBtnDisabled,
            ]}
            onPress={() => processDocument()}
            disabled={isProcessing || (!selectedFile && !activeDocId)}
          >
            {isProcessing ? (
              <View style={s.btnLoadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={s.generateBtnText}> {processStep || 'Processing...'}</Text>
              </View>
            ) : (
              <Text style={s.generateBtnText}>
                ✨ Generate Personalized Study Plan & Ingest
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── GENERATED PERSONALIZED STUDY PLAN SECTION ── */}
        {studyPlan && (
          <View style={s.planCardWrapper}>
            <View style={s.planHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={s.planBadgeRow}>
                  <View style={s.verifiedBadge}>
                    <Text style={s.verifiedBadgeText}>🎯 Personalized Plan</Text>
                  </View>
                  <View style={s.diffBadge}>
                    <Text style={s.diffBadgeText}>
                      {studyPlan.difficulty.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={s.planTitle}>{studyPlan.title}</Text>
                <Text style={s.planSummary}>{studyPlan.summary}</Text>
              </View>
            </View>

            {/* Quick Metrics Grid */}
            <View style={s.metricsGrid}>
              <View style={s.metricItem}>
                <Text style={s.metricVal}>{studyPlan.total_estimated_hours}h</Text>
                <Text style={s.metricLbl}>Total Effort</Text>
              </View>
              <View style={s.metricItem}>
                <Text style={s.metricVal}>
                  {studyPlan.daily_commitment_minutes}m
                </Text>
                <Text style={s.metricLbl}>Daily Target</Text>
              </View>
              <View style={s.metricItem}>
                <Text style={s.metricVal}>
                  {studyPlan.target_completion_weeks}w
                </Text>
                <Text style={s.metricLbl}>Timeline</Text>
              </View>
              <View style={s.metricItem}>
                <Text style={s.metricVal}>{studyPlan.modules.length}</Text>
                <Text style={s.metricLbl}>Modules</Text>
              </View>
            </View>

            {/* Sync to Planner 1-Click Action */}
            <View style={s.syncRow}>
              <TouchableOpacity
                style={s.syncBtn}
                onPress={handleSyncToPlanner}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#0A0E1A" />
                ) : (
                  <Text style={s.syncBtnText}>
                    🚀 Add to My Planner & Subjects
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={s.viewPlannerBtn}
                onPress={() => router.push('/(tabs)/planner')}
              >
                <Text style={s.viewPlannerBtnText}>Go to Planner →</Text>
              </TouchableOpacity>
            </View>

            {syncSuccessMsg && (
              <View style={s.successBox}>
                <Text style={s.successText}>{syncSuccessMsg}</Text>
              </View>
            )}

            {/* High Yield Exam Tips */}
            {studyPlan.high_yield_exam_tips && studyPlan.high_yield_exam_tips.length > 0 && (
              <View style={s.examTipsCard}>
                <View style={s.tipsHeaderRow}>
                  <Text style={s.tipsIcon}>💡</Text>
                  <Text style={s.tipsHeading}>High-Yield Document Insights</Text>
                </View>
                {studyPlan.high_yield_exam_tips.map((tip, idx) => (
                  <View key={idx} style={s.tipItemRow}>
                    <Text style={s.tipBullet}>•</Text>
                    <Text style={s.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Modules Roadmap */}
            <Text style={s.modulesHeading}>Weekly Roadmap & Focus Modules</Text>
            {studyPlan.modules.map((mod: StudyModule) => {
              const isExp = expandedWeeks[mod.week_number];
              return (
                <View key={mod.week_number} style={s.moduleCard}>
                  <TouchableOpacity
                    style={s.moduleHeader}
                    onPress={() => toggleWeek(mod.week_number)}
                  >
                    <View style={s.modNumberBadge}>
                      <Text style={s.modNumberText}>W{mod.week_number}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={s.modTitle}>{mod.title}</Text>
                      <Text style={s.modSub}>
                        {mod.estimated_hours}h estimated • {mod.topics.length} topics
                      </Text>
                    </View>
                    <Text style={s.chevron}>{isExp ? '▲' : '▼'}</Text>
                  </TouchableOpacity>

                  {isExp && (
                    <View style={s.moduleContent}>
                      <Text style={s.modDesc}>{mod.description}</Text>

                      {/* Topics */}
                      <Text style={s.modSubheading}>Topics to Master:</Text>
                      {mod.topics.map((t, tIdx) => (
                        <View key={tIdx} style={s.topicRow}>
                          <Text style={s.topicCheck}>☑</Text>
                          <Text style={s.topicName}>{t}</Text>
                        </View>
                      ))}

                      {/* Key Concepts */}
                      {mod.key_concepts && mod.key_concepts.length > 0 && (
                        <>
                          <Text style={s.modSubheading}>Key Concepts & Formulas:</Text>
                          <View style={s.conceptChipsRow}>
                            {mod.key_concepts.map((c, cIdx) => (
                              <View key={cIdx} style={s.conceptChip}>
                                <Text style={s.conceptChipText}>{c}</Text>
                              </View>
                            ))}
                          </View>
                        </>
                      )}

                      {/* Practice Drills */}
                      {mod.practice_tasks && mod.practice_tasks.length > 0 && (
                        <>
                          <Text style={s.modSubheading}>Actionable Study Drills:</Text>
                          {mod.practice_tasks.map((task, tkIdx) => (
                            <View key={tkIdx} style={s.taskRow}>
                              <Text style={s.taskIcon}>⚡</Text>
                              <Text style={s.taskText}>{task}</Text>
                            </View>
                          ))}
                        </>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Self-Assessment Practice Quiz */}
            {studyPlan.practice_quiz && studyPlan.practice_quiz.length > 0 && (
              <View style={s.quizSection}>
                <View style={s.quizHeaderRow}>
                  <Text style={s.quizIcon}>📝</Text>
                  <Text style={s.quizTitle}>Document Self-Assessment Quiz</Text>
                </View>

                {studyPlan.practice_quiz.map((q: QuizQuestion, qIdx: number) => {
                  const userChoice = selectedAnswers[qIdx];
                  const isRevealed = revealedQuiz[qIdx];
                  return (
                    <View key={qIdx} style={s.quizCard}>
                      <Text style={s.quizQuestionText}>
                        {qIdx + 1}. {q.question}
                      </Text>

                      <View style={s.quizOptionsContainer}>
                        {q.options.map((opt, optIdx) => {
                          const letter = opt.trim().charAt(0).toUpperCase();
                          const isSelected = userChoice === letter;
                          const isCorrect = q.correct_answer.toUpperCase() === letter;

                          let optionStyle = s.quizOption;
                          if (isRevealed) {
                            if (isCorrect) optionStyle = s.quizOptionCorrect;
                            else if (isSelected && !isCorrect) optionStyle = s.quizOptionIncorrect;
                          } else if (isSelected) {
                            optionStyle = s.quizOptionSelected;
                          }

                          return (
                            <TouchableOpacity
                              key={optIdx}
                              style={optionStyle}
                              onPress={() => handleSelectQuizAnswer(qIdx, letter)}
                            >
                              <Text style={s.quizOptionText}>{opt}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {isRevealed && (
                        <View style={s.quizExplanationBox}>
                          <Text style={s.quizExplanationTitle}>
                            {userChoice === q.correct_answer.toUpperCase()
                              ? '🎉 Correct!'
                              : `⚠️ Correct Answer: Option ${q.correct_answer}`}
                          </Text>
                          <Text style={s.quizExplanationText}>{q.explanation}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ── DOCUQUERY AI RAG Q&A ASSISTANT ── */}
        <View style={s.qaSectionWrapper}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionIcon}>💬</Text>
            <Text style={s.sectionHeading}>DocuQuery AI Assistant</Text>
          </View>
          <Text style={s.qaSub}>
            Ask questions directly against {activeFilename || 'your uploaded document'}. RAG will retrieve citations and answer with precision.
          </Text>

          {/* Suggested Prompts */}
          <View style={s.promptChipsRow}>
            {[
              'Summarize key obligations & rules',
              'What are the most challenging topics?',
              'List core definitions and policies',
              'What should I review before exams?',
            ].map((p, idx) => (
              <TouchableOpacity
                key={idx}
                style={s.promptChip}
                onPress={() => handleAskQuestion(p)}
                disabled={isAsking}
              >
                <Text style={s.promptChipText}>💡 {p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Ask Input Box */}
          <View style={s.searchBoxContainer}>
            <TextInput
              style={s.searchInput}
              placeholder={
                activeFilename
                  ? `Ask anything about ${activeFilename}...`
                  : 'Ask anything about your document...'
              }
              placeholderTextColor={Colors.textMuted}
              value={question}
              onChangeText={setQuestion}
              onSubmitEditing={() => handleAskQuestion()}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={[
                s.searchBtn,
                (!question.trim() || isAsking) && s.searchBtnDisabled,
              ]}
              onPress={() => handleAskQuestion()}
              disabled={!question.trim() || isAsking}
            >
              {isAsking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={s.searchBtnText}>Ask RAG</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* QA History / Answers */}
          {qaHistory.length > 0 ? (
            qaHistory.map((item, idx) => (
              <View key={idx} style={s.answerCard}>
                <View style={s.userQueryRow}>
                  <Text style={s.userQueryIcon}>🧑‍🎓</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.userQueryText}>{item.question}</Text>
                    <Text style={s.queryTime}>{item.timestamp}</Text>
                  </View>
                </View>

                <View style={s.aiResponseRow}>
                  <Text style={s.aiIcon}>🤖</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.aiAnswerText}>{item.answer}</Text>

                    {/* Retrieved Context Chunks (DocuQuery AI citations) */}
                    {item.chunks && item.chunks.length > 0 && (
                      <View style={s.citationsContainer}>
                        <Text style={s.citationsHeading}>
                          Retrieved Context Chunks ({item.chunks.length}):
                        </Text>
                        {item.chunks.map((chunk, cIdx) => {
                          const isChunkExpanded = expandedChunkId === chunk.index;
                          const simPct = chunk.similarity
                            ? Math.round(chunk.similarity * 100)
                            : Math.round(Math.max(0, 1.0 - chunk.distance) * 100);

                          return (
                            <View key={cIdx} style={s.chunkCard}>
                              <TouchableOpacity
                                style={s.chunkHeader}
                                onPress={() =>
                                  setExpandedChunkId(
                                    isChunkExpanded ? null : chunk.index
                                  )
                                }
                              >
                                <View style={s.chunkBadge}>
                                  <Text style={s.chunkBadgeText}>
                                    Chunk #{chunk.index + 1}
                                  </Text>
                                </View>
                                <Text style={s.simScore}>
                                  Relevance: {simPct}%
                                </Text>
                                <Text style={s.chevron}>
                                  {isChunkExpanded ? '▲' : '▼'}
                                </Text>
                              </TouchableOpacity>

                              <Text
                                style={s.chunkSnippet}
                                numberOfLines={isChunkExpanded ? undefined : 3}
                              >
                                "{chunk.text.trim()}"
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={s.emptyQA}>
              <Text style={s.emptyQAEmoji}>🔍</Text>
              <Text style={s.emptyQAText}>
                Ask a question above to retrieve semantic context from your document.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  </View>
</SafeAreaView>
</ImageBackground>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  bgImage: { flex: 1, width: '100%', height: '100%', backgroundColor: '#070D18' },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7, 13, 24, 0.65)' },
  safeArea: {
    flex: 1,
  },
  pageWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 230,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 223, 178, 0.15)',
    backgroundColor: 'rgba(7, 14, 26, 0.75)',
    paddingVertical: 24,
    paddingHorizontal: 16,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(20px)' } as any) : {}),
  },
  sidebarLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
    paddingHorizontal: 6,
  },
  logoSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#00DFB2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  logoIcon: { fontSize: 18 },
  logoTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 17, letterSpacing: -0.2 },
  logoSubtitle: { color: '#00DFB2', fontSize: 10.5, fontWeight: '600' },
  navMenu: { gap: 6 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  navItemActive: {
    backgroundColor: 'rgba(0, 223, 178, 0.12)',
    borderWidth: 1.5,
    borderColor: '#00DFB2',
  },
  navIcon: { fontSize: 16, opacity: 0.7 },
  navIconActive: { opacity: 1 },
  navLabel: { color: '#8E9BAE', fontSize: 13.5, fontWeight: '600' },
  navLabelActive: { color: '#00DFB2', fontWeight: '700' },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: 60,
  },
  desktopContent: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 32,
  },
  innerWrapper: {
    width: '100%',
    maxWidth: 780,
  },
  mobileInner: {
    maxWidth: '100%',
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
    textAlign: 'center',
  },
  headerBadge: {
    backgroundColor: '#0F2A22',
    borderColor: '#00C9A744',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    marginBottom: 8,
  },
  headerBadgeText: {
    color: Colors.teal,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 20,
  },
  settingsToggle: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.md,
    backgroundColor: '#1E293B55',
  },
  settingsToggleText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  settingsBox: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: Colors.bgCard,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: 10,
  },
  settingsLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginBottom: 4,
  },
  settingsInput: {
    backgroundColor: '#0F172A',
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.sm,
    color: Colors.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: FontSize.sm,
  },
  settingsHint: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 4,
  },

  // Dropzone card
  cardWrapper: {
    backgroundColor: Colors.bgCard,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionHeading: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dropzone: {
    borderWidth: 2,
    borderColor: '#2A3650',
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A66',
  },
  dropzoneActive: {
    borderColor: Colors.teal,
    backgroundColor: '#00C9A711',
  },
  dropIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dropIcon: {
    fontSize: 28,
  },
  dropMainText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  dropSubText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  dropActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  browseBtn: {
    backgroundColor: '#1E293B',
    borderColor: Colors.borderLight,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  browseBtnText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  orDivider: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  sampleBtn: {
    backgroundColor: '#0F2A22',
    borderColor: Colors.tealDark,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  sampleBtnText: {
    color: Colors.teal,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  selectedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: Radius.md,
    padding: 12,
    width: '100%',
  },
  selectedFileIcon: {
    color: Colors.teal,
    fontSize: 18,
    fontWeight: '800',
    marginRight: 10,
  },
  selectedFileName: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  selectedFileSize: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  fileRemoveBtn: {
    padding: 6,
    backgroundColor: '#334155',
    borderRadius: Radius.full,
  },
  fileRemoveText: {
    color: Colors.textPrimary,
    fontSize: 12,
  },

  // Preferences
  preferencesContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
  },
  prefTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  prefRow: {
    marginBottom: Spacing.md,
  },
  prefLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 6,
    fontWeight: '600',
  },
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    backgroundColor: '#1E293B',
    borderColor: Colors.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  pillActive: {
    backgroundColor: '#0F2A22',
    borderColor: Colors.teal,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  pillTextActive: {
    color: Colors.teal,
    fontWeight: '700',
  },

  generateBtn: {
    backgroundColor: Colors.teal,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  generateBtnDisabled: {
    opacity: 0.5,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateBtnText: {
    color: '#0A0E1A',
    fontWeight: '800',
    fontSize: FontSize.md,
  },

  // Plan Card
  planCardWrapper: {
    backgroundColor: Colors.bgCard,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  planHeaderRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  planBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  verifiedBadge: {
    backgroundColor: '#00291F',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedBadgeText: {
    color: Colors.teal,
    fontSize: 11,
    fontWeight: '700',
  },
  diffBadge: {
    backgroundColor: '#1E1B4B',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  diffBadgeText: {
    color: Colors.indigo,
    fontSize: 11,
    fontWeight: '700',
  },
  planTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  planSummary: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    color: Colors.teal,
    fontSize: 20,
    fontWeight: '800',
  },
  metricLbl: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  syncRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: Spacing.sm,
  },
  syncBtn: {
    flex: 1,
    backgroundColor: Colors.teal,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBtnText: {
    color: '#0A0E1A',
    fontWeight: '800',
    fontSize: FontSize.sm,
  },
  viewPlannerBtn: {
    backgroundColor: '#1E293B',
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    borderColor: Colors.border,
    borderWidth: 1,
  },
  viewPlannerBtnText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: '#00291F',
    borderColor: Colors.teal,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 10,
    marginTop: 8,
  },
  successText: {
    color: Colors.teal,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  // Exam tips
  examTipsCard: {
    backgroundColor: '#271B0B',
    borderColor: '#784606',
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  tipsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipsIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tipsHeading: {
    color: Colors.amber,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  tipItemRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  tipBullet: {
    color: Colors.amber,
    marginRight: 6,
  },
  tipText: {
    color: '#FDE68A',
    fontSize: FontSize.xs,
    flex: 1,
    lineHeight: 18,
  },

  // Modules
  modulesHeading: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  moduleCard: {
    backgroundColor: '#1E293B44',
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    marginBottom: 10,
    overflow: 'hidden',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  modNumberBadge: {
    backgroundColor: '#1E293B',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modNumberText: {
    color: Colors.teal,
    fontWeight: '800',
    fontSize: 12,
  },
  modTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  modSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  chevron: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  moduleContent: {
    padding: 12,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    backgroundColor: '#0F172A44',
  },
  modDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginBottom: 8,
  },
  modSubheading: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: FontSize.xs,
    marginTop: 8,
    marginBottom: 4,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  topicCheck: {
    color: Colors.teal,
    marginRight: 6,
    fontSize: 12,
  },
  topicName: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  conceptChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  conceptChip: {
    backgroundColor: '#1E293B',
    borderColor: Colors.borderLight,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  conceptChipText: {
    color: Colors.tealLight,
    fontSize: 10,
    fontWeight: '600',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  taskIcon: {
    fontSize: 10,
    marginRight: 6,
    marginTop: 2,
  },
  taskText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    flex: 1,
  },

  // Quiz
  quizSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
  },
  quizHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quizIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  quizTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  quizCard: {
    backgroundColor: '#0F172A',
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 10,
  },
  quizQuestionText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: FontSize.sm,
    marginBottom: 10,
  },
  quizOptionsContainer: {
    gap: 6,
  },
  quizOption: {
    backgroundColor: '#1E293B',
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: 10,
  },
  quizOptionSelected: {
    backgroundColor: '#1E293B',
    borderColor: Colors.teal,
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: 10,
  },
  quizOptionCorrect: {
    backgroundColor: '#00291F',
    borderColor: Colors.teal,
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: 10,
  },
  quizOptionIncorrect: {
    backgroundColor: '#3F1212',
    borderColor: Colors.red,
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: 10,
  },
  quizOptionText: {
    color: Colors.textPrimary,
    fontSize: FontSize.xs,
  },
  quizExplanationBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#1E293B55',
    borderRadius: Radius.sm,
  },
  quizExplanationTitle: {
    fontWeight: '700',
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  quizExplanationText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },

  // Q&A
  qaSectionWrapper: {
    backgroundColor: Colors.bgCard,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  qaSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginBottom: Spacing.md,
  },
  promptChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  promptChip: {
    backgroundColor: '#1E293B',
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  promptChipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  searchBoxContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
  },
  searchBtn: {
    backgroundColor: Colors.teal,
    borderRadius: Radius.full,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnDisabled: {
    opacity: 0.5,
  },
  searchBtnText: {
    color: '#0A0E1A',
    fontWeight: '800',
    fontSize: FontSize.sm,
  },
  answerCard: {
    backgroundColor: '#0F172A',
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  userQueryRow: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  userQueryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  userQueryText: {
    color: Colors.teal,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  queryTime: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  aiResponseRow: {
    flexDirection: 'row',
  },
  aiIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  aiAnswerText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  citationsContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
  },
  citationsHeading: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  chunkCard: {
    backgroundColor: '#1E293B55',
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: 8,
    marginBottom: 6,
  },
  chunkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chunkBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  chunkBadgeText: {
    color: Colors.indigo,
    fontSize: 10,
    fontWeight: '700',
  },
  simScore: {
    color: Colors.teal,
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },
  chunkSnippet: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  emptyQA: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyQAEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyQAText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
});
