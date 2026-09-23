import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import QuestionPalette from '../../components/QuestionPalette';
import ConfirmationModal from '../../components/ConfirmationModal';
import CodeEditor from '../../components/CodeEditor';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  FileText, 
  HelpCircle, 
  Code, 
  Layers,
  GraduationCap
} from 'lucide-react';
import '../../styles/exampaper.css';

export default function ExamPaper() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Core Exam State
  const [exam, setExam] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Student Answers State: { [qId]: { answer: string, language: string, wordCount: number } }
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});

  // Timer State
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timerRef = useRef(null);
  const hasAutoSubmittedRef = useRef(false);

  // UI / Submission state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Initialize Examination Session
  useEffect(() => {
    async function initExam() {
      try {
        const res = await api.startExam(id);
        setExam(res.exam);
        setSubmissionId(res.submissionId);
        setQuestions(res.questions || []);
        setRemainingSeconds(res.remainingSeconds || res.exam.duration * 60);

        // Preload saved answers if any
        if (res.savedAnswers) {
          setAnswers(res.savedAnswers);
        }
      } catch (err) {
        if (err.submissionId) {
          navigate(`/student/results/${err.submissionId}`);
        } else {
          setError(err.message || 'Failed to start examination.');
        }
      } finally {
        setLoading(false);
      }
    }
    initExam();
  }, [id, navigate]);

  // 2. Countdown Timer
  useEffect(() => {
    if (loading || remainingSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!hasAutoSubmittedRef.current) {
            hasAutoSubmittedRef.current = true;
            handleFinalSubmit(true); // Auto-submit
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, remainingSeconds]);

  // Format seconds to HH:MM:SS
  const formatTime = (secs) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex] || null;
  const currentAnswerObj = currentQ ? (answers[currentQ.id] || { answer: '', language: 'javascript', wordCount: 0 }) : null;

  // Handle Answer Changes
  const handleAnswerChange = (val, lang = null) => {
    if (!currentQ) return;
    const qId = currentQ.id;

    let wordCount = 0;
    if (currentQ.type === 'theory' && typeof val === 'string') {
      wordCount = val.trim() ? val.trim().split(/\s+/).filter(Boolean).length : 0;
    }

    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        questionId: qId,
        answer: val,
        language: lang || prev[qId]?.language || 'javascript',
        wordCount
      }
    }));
  };

  const handleToggleReview = () => {
    if (!currentQ) return;
    const qId = currentQ.id;
    setMarkedForReview((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleClearResponse = () => {
    if (!currentQ) return;
    const qId = currentQ.id;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Submit Examination
  const handleFinalSubmit = async (isAuto = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const formattedAnswers = Object.keys(answers).map((qId) => ({
        questionId: parseInt(qId, 10),
        answer: answers[qId]?.answer || '',
        language: answers[qId]?.language || 'javascript'
      }));

      const res = await api.submitExam(id, formattedAnswers, 0);
      setShowSubmitModal(false);
      // Navigate to post-submission success receipt page
      navigate(`/exam/${id}/submitted`, { state: { submission: res.submission, isAuto } });
    } catch (err) {
      alert(err.message || 'Error occurred while submitting examination.');
      setIsSubmitting(false);
    }
  };

  // Submission statistics for modal
  const answeredCount = Object.keys(answers).filter((k) => {
    const val = answers[k];
    if (!val) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    return val.answer !== undefined && String(val.answer).trim().length > 0;
  }).length;

  const reviewCount = Object.keys(markedForReview).filter((k) => markedForReview[k]).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  if (loading) {
    return (
      <div className="exam-viewport" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '44px',
          height: '44px',
          border: '3px solid #cbd5e1',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <h2 style={{ fontFamily: 'Merriweather, serif', fontSize: '1.25rem', color: '#0f172a' }}>
          Preparing Examination Paper...
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading questions and setting up your secure session.</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content" style={{ maxWidth: '600px', marginTop: '3rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
            Cannot Access Examination
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={() => navigate('/student/my-exams')} className="btn btn-primary">
            Return to My Exams
          </button>
        </div>
      </div>
    );
  }

  // Timer warning classes
  let timerClass = 'exam-timer-box';
  if (remainingSeconds <= 300 && remainingSeconds > 60) {
    timerClass += ' timer-warning';
  } else if (remainingSeconds <= 60) {
    timerClass += ' timer-critical';
  }

  return (
    <div className="exam-viewport">
      {/* Top Sticky Bar with Timer & Brand */}
      <header className="exam-topbar">
        <div className="exam-brand-title">
          <GraduationCap size={22} color="#3b82f6" />
          <span className="exam-logo-text">ExamDesk</span>
          <span className="exam-badge-official">Official Examination</span>
        </div>

        {/* Live Visible Countdown Timer */}
        <div className={timerClass}>
          <Clock size={18} />
          <span style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Time Left:</span>
          <span className="timer-digits">{formatTime(remainingSeconds)}</span>
        </div>
      </header>

      {/* Main Grid: Digital Exam Paper Sheet + Sidebar Palette */}
      <main className="exam-main-grid">
        {/* THE PAPER SHEET */}
        <div className="paper-sheet">
          {/* Formal Examination Paper Header */}
          <div className="paper-header">
            <div className="paper-super-title">EXAMINATION PAPER</div>
            <h1 className="paper-exam-title">{exam?.title}</h1>
            <div className="paper-meta-strip">
              <span><strong>Duration:</strong> {exam?.duration} Minutes</span>
              <span><strong>Maximum Marks:</strong> {exam?.totalMarks || 100}</span>
              <span><strong>Total Questions:</strong> {questions.length}</span>
            </div>
          </div>

          {/* Current Section Banner */}
          {currentQ && (
            <div className="paper-section-banner">
              <div>
                <div className="paper-section-title">
                  {currentQ.type === 'theory' && 'SECTION A — THEORY'}
                  {currentQ.type === 'mcq' && 'SECTION B — MULTIPLE CHOICE QUESTIONS (MCQ)'}
                  {currentQ.type === 'coding' && 'SECTION C — CODING & PROGRAMMING'}
                </div>
                <div className="paper-section-desc">
                  Module: <strong>{currentQ.moduleTitle}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-primary">
                  Question {currentIndex + 1} of {questions.length}
                </span>
              </div>
            </div>
          )}

          {/* Question Prompt Area */}
          {currentQ && (
            <div className="paper-question-container">
              <div className="question-prompt-header">
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flex: 1 }}>
                  <span className="question-number-badge">Q{currentIndex + 1}.</span>
                  <div className="question-text">{currentQ.question}</div>
                </div>

                <div className="question-marks-badge">
                  [{currentQ.marks} Marks]
                </div>
              </div>

              {/* SECTION A: THEORY QUESTION */}
              {currentQ.type === 'theory' && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div className="theory-instruction-bar">
                    <span>Write your detailed answer in the box below:</span>
                    <span className={`theory-word-counter ${(currentAnswerObj?.wordCount || 0) > (currentQ.wordLimit || 150) ? 'exceeded-limit' : 'within-limit'}`}>
                      Word Count: {currentAnswerObj?.wordCount || 0} / {currentQ.wordLimit || 150} words
                    </span>
                  </div>

                  <textarea
                    value={currentAnswerObj?.answer || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Type your structured explanation here..."
                    className="theory-textarea"
                    rows={8}
                    spellCheck={false}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                    <span>Adhere strictly to the word limit of {currentQ.wordLimit || 150} words.</span>
                    <span>✓ Answers are auto-saved</span>
                  </div>
                </div>
              )}

              {/* SECTION B: MCQ QUESTION */}
              {currentQ.type === 'mcq' && (
                <div className="mcq-options-container">
                  {(currentQ.options || []).map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const isSelected = String(currentAnswerObj?.answer || '').trim() === String(opt).trim();

                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleAnswerChange(opt)}
                        className={`mcq-option-card ${isSelected ? 'selected' : ''}`}
                      >
                        <div className="mcq-option-radio">
                          {isSelected && <span className="mcq-option-radio-dot" />}
                        </div>
                        <span className="mcq-option-letter">{letter}.</span>
                        <span className="mcq-option-text">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SECTION C: CODING QUESTION */}
              {currentQ.type === 'coding' && (
                <div style={{ marginTop: '1.25rem' }}>
                  {/* Specification Card */}
                  {currentQ.codingDetails && (
                    <div className="coding-spec-card">
                      {currentQ.codingDetails.inputDescription && (
                        <div className="coding-spec-item">
                          <div className="coding-spec-label">Input Description:</div>
                          <div>{currentQ.codingDetails.inputDescription}</div>
                        </div>
                      )}

                      {currentQ.codingDetails.outputDescription && (
                        <div className="coding-spec-item">
                          <div className="coding-spec-label">Output Description:</div>
                          <div>{currentQ.codingDetails.outputDescription}</div>
                        </div>
                      )}

                      {currentQ.codingDetails.constraints && (
                        <div className="coding-spec-item">
                          <div className="coding-spec-label">Constraints:</div>
                          <code>{currentQ.codingDetails.constraints}</code>
                        </div>
                      )}

                      {(currentQ.codingDetails.sampleInput || currentQ.codingDetails.sampleOutput) && (
                        <div className="sample-io-grid">
                          <div>
                            <div className="coding-spec-label">Sample Input:</div>
                            <div className="sample-io-box">{currentQ.codingDetails.sampleInput || '(None)'}</div>
                          </div>
                          <div>
                            <div className="coding-spec-label">Sample Output:</div>
                            <div className="sample-io-box">{currentQ.codingDetails.sampleOutput || '(None)'}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Integrated Code Editor */}
                  <CodeEditor
                    value={currentAnswerObj?.answer || ''}
                    onChange={(newCode) => handleAnswerChange(newCode, currentAnswerObj?.language || 'javascript')}
                    language={currentAnswerObj?.language || 'javascript'}
                    onLanguageChange={(newLang) => handleAnswerChange(currentAnswerObj?.answer || '', newLang)}
                    minHeight="300px"
                  />
                </div>
              )}
            </div>
          )}

          {/* Bottom Question Controls Bar */}
          <div className="paper-controls-bar">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="btn btn-secondary"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className="btn btn-secondary"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleToggleReview}
                className={`btn ${markedForReview[currentQ?.id] ? 'btn-primary' : 'btn-secondary'}`}
                style={markedForReview[currentQ?.id] ? { background: '#8b5cf6', borderColor: '#8b5cf6' } : {}}
              >
                <Bookmark size={16} />
                {markedForReview[currentQ?.id] ? 'Marked for Review' : 'Mark for Review'}
              </button>

              <button
                type="button"
                onClick={handleClearResponse}
                className="btn btn-secondary"
                title="Clear current answer"
              >
                <RotateCcw size={14} />
                Clear Response
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: QUESTION PALETTE */}
        <QuestionPalette
          questions={questions}
          currentIndex={currentIndex}
          onSelectQuestion={(idx) => setCurrentIndex(idx)}
          answers={answers}
          markedForReview={markedForReview}
          onSubmitClick={() => setShowSubmitModal(true)}
        />
      </main>

      {/* Submission Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={() => handleFinalSubmit(false)}
        isSubmitting={isSubmitting}
        stats={{
          total: questions.length,
          answered: answeredCount,
          unanswered: unansweredCount,
          review: reviewCount
        }}
      />
    </div>
  );
}
