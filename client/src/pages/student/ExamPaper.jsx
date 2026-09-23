import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  GraduationCap,
  ShieldAlert,
  AlertTriangle,
  XCircle,
  Maximize
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

  // Security State
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [securityNotice, setSecurityNotice] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement || document.webkitFullscreenElement));

  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.warn('Could not enter fullscreen:', err);
    }
  };

  // Timer State
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timerRef = useRef(null);
  const hasAutoSubmittedRef = useRef(false);

  // UI / Submission state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronization refs for callbacks and event listeners
  const answersRef = useRef(answers);
  const isSubmittingRef = useRef(false);
  const isCancelledRef = useRef(false);
  const isProcessingViolationRef = useRef(false);
  const noticeTimerRef = useRef(null);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const showSecurityNotice = (msg) => {
    setSecurityNotice(msg);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => {
      setSecurityNotice(null);
    }, 2500);
  };

  // 1. Initialize Examination Session
  useEffect(() => {
    async function initExam() {
      try {
        const res = await api.startExam(id);
        setExam(res.exam);
        setSubmissionId(res.submissionId);
        setQuestions(res.questions || []);
        setRemainingSeconds(res.remainingSeconds || res.exam.duration * 60);

        if (res.tabSwitchCount) {
          setTabSwitchCount(res.tabSwitchCount);
        }

        if (res.isCancelled) {
          setIsCancelled(true);
          isCancelledRef.current = true;
        }

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

  // 2. Security: Record Tab Switch Violation
  const handleTabViolation = async () => {
    if (isSubmittingRef.current || isCancelledRef.current || isProcessingViolationRef.current) {
      return;
    }
    isProcessingViolationRef.current = true;

    try {
      const res = await api.recordSecurityViolation(id, 'tab_switch');
      const count = res.tabSwitchCount || 0;
      setTabSwitchCount(count);

      if (res.action === 'cancelled' || res.isCancelled || count >= 2) {
        isCancelledRef.current = true;
        setIsCancelled(true);
        if (timerRef.current) clearInterval(timerRef.current);

        // Immediately save current answers to server to prevent data loss
        const currentAns = answersRef.current || {};
        const formattedAnswers = Object.keys(currentAns).map((qId) => ({
          questionId: qId,
          answer: currentAns[qId]?.answer || '',
          language: currentAns[qId]?.language || 'javascript'
        }));

        try {
          await api.saveAnswers(id, formattedAnswers);
        } catch (saveErr) {
          console.error('Failed to save answers upon cancellation:', saveErr);
        }

        setShowSubmitModal(false);
        setShowWarningModal(false);
      } else {
        setShowWarningModal(true);
      }
    } catch (err) {
      console.error('Failed to record security violation:', err);
      isProcessingViolationRef.current = false;
    }
  };

  // 3. Security Event Listeners (Tab visibility, fullscreen changes, print deterrence, keyboard shortcuts)
  useEffect(() => {
    if (loading || isCancelled || !submissionId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleTabViolation();
      }
    };

    const handleFullscreenChange = () => {
      const inFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(inFs);

      if (!inFs && !isSubmittingRef.current && !isCancelledRef.current && !loading) {
        showSecurityNotice('Fullscreen mode exited! Please return to fullscreen.');
        handleTabViolation();
      }
    };

    const handleKeyDown = (e) => {
      // Prevent Print
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        showSecurityNotice('Printing is disabled during the examination.');
      }
      // Prevent Save Page
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        showSecurityNotice('Saving the webpage is disabled.');
      }
      // Deterrent for PrintScreen
      if (e.key === 'PrintScreen') {
        showSecurityNotice('Screen captures are monitored and prohibited.');
      }
    };

    const handleBeforeUnload = (e) => {
      if (!isSubmittingRef.current && !isCancelledRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [loading, isCancelled, submissionId, id]);

  // 4. Countdown Timer
  useEffect(() => {
    if (loading || isCancelled || remainingSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!hasAutoSubmittedRef.current && !isCancelledRef.current) {
            hasAutoSubmittedRef.current = true;
            handleFinalSubmit(true); // Auto-submit
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, isCancelled, remainingSeconds]);

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
    if (!currentQ || isCancelled) return;
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
    if (!currentQ || isCancelled) return;
    const qId = currentQ.id;
    setMarkedForReview((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleClearResponse = () => {
    if (!currentQ || isCancelled) return;
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

  // Submit Examination (FIX: pass raw qId string, NO parseInt)
  const handleFinalSubmit = async (isAuto = false) => {
    if (isSubmitting || isCancelledRef.current) return;
    setIsSubmitting(true);
    isSubmittingRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const formattedAnswers = Object.keys(answers).map((qId) => ({
        questionId: qId, // Preserved as exact MongoDB ObjectId string
        answer: answers[qId]?.answer || '',
        language: answers[qId]?.language || 'javascript'
      }));

      const res = await api.submitExam(id, formattedAnswers, 0);
      setShowSubmitModal(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        try { await document.exitFullscreen(); } catch (e) {}
      }
      navigate(`/exam/${id}/submitted`, { state: { submission: res.submission, isAuto } });
    } catch (err) {
      alert(err.message || 'Error occurred while submitting examination.');
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  // Submission statistics
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

  // CANCELLED VIEW: Rendered if exam was terminated due to security violations
  if (isCancelled) {
    return (
      <div className="exam-viewport" style={{ alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{
          maxWidth: '640px',
          width: '100%',
          textAlign: 'center',
          padding: '3rem 2rem',
          border: '2px solid #fecaca',
          background: '#ffffff',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <ShieldAlert size={36} color="#dc2626" />
          </div>

          <span className="badge badge-danger" style={{ fontSize: '0.8125rem', padding: '0.35rem 0.75rem', marginBottom: '1rem' }}>
            Session Terminated
          </span>

          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>
            Examination Cancelled
          </h1>

          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '1.25rem',
            color: '#991b1b',
            fontSize: '0.9375rem',
            lineHeight: '1.6',
            marginBottom: '1.75rem',
            textAlign: 'left'
          }}>
            <p style={{ fontWeight: '700', marginBottom: '0.5rem' }}>
              Reason: Exceeded maximum permitted tab switches (2)
            </p>
            <p style={{ margin: 0 }}>
              Under strict institutional examination integrity rules, navigating away from the test window twice has resulted in immediate cancellation. Your session has been locked.
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#b91c1c' }}>
              ✓ All answers recorded prior to this cancellation have been securely saved to the server for administrative review.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '2rem',
            background: '#f8fafc',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>TOTAL QUESTIONS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>{questions.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>PRESERVED ANSWERS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#059669' }}>{answeredCount}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>TAB VIOLATIONS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#dc2626' }}>{tabSwitchCount}</div>
            </div>
          </div>

          <Link to="/student/my-exams" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', marginBottom: '1.5rem' }}>
            Return to My Exams Dashboard
          </Link>

          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            ExamDesk • Designed &amp; Developed by <strong style={{ color: '#64748b' }}>Yash Diwate</strong>
          </div>
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
    <div
      className="exam-viewport"
      onCopy={(e) => {
        e.preventDefault();
        showSecurityNotice('Copying content is disabled during the examination.');
      }}
      onCut={(e) => {
        e.preventDefault();
        showSecurityNotice('Cutting content is disabled during the examination.');
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        showSecurityNotice('Right-click context menu is disabled.');
      }}
      onDragStart={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      {/* Scoped CSS for print deterrence & notifications */}
      <style>{`
        @media print {
          body { display: none !important; }
          html { display: none !important; }
        }
        .security-toast-pill {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #0f172a;
          color: #ffffff;
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35);
          z-index: 99999;
          display: flex;
          align-items: center;
          gap: 10px;
          border-left: 4px solid #ef4444;
          animation: slideInToast 0.2s ease-out;
        }
        @keyframes slideInToast {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Floating security notice toast */}
      {securityNotice && (
        <div className="security-toast-pill">
          <ShieldAlert size={16} color="#ef4444" />
          <span>{securityNotice}</span>
        </div>
      )}

      {/* Top Sticky Bar with Timer & Brand */}
      <header className="exam-topbar">
        <div className="exam-brand-title">
          <GraduationCap size={22} color="#3b82f6" />
          <span className="exam-logo-text">ExamDesk</span>
          <span className="exam-badge-official">Official Examination</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isFullscreen ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0',
              borderRadius: '6px',
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: '700'
            }}>
              <Maximize size={13} />
              <span>Fullscreen Active</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={enterFullscreen}
              className="btn btn-warning btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem'
              }}
            >
              <Maximize size={13} />
              <span>Enter Fullscreen</span>
            </button>
          )}

          {tabSwitchCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.8125rem',
              fontWeight: '700'
            }}>
              <AlertTriangle size={15} />
              <span>Tab Warning: {tabSwitchCount}/1</span>
            </div>
          )}

          {/* Live Visible Countdown Timer */}
          <div className={timerClass}>
            <Clock size={18} />
            <span style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Time Left:</span>
            <span className="timer-digits">{formatTime(remainingSeconds)}</span>
          </div>
        </div>
      </header>

      {/* Main Grid: Digital Exam Paper Sheet + Sidebar Palette */}
      <main className="exam-main-grid">
        {/* THE PAPER SHEET */}
        <div className="paper-sheet" style={{ userSelect: 'none' }}>
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
                  <div className="question-text" style={{ userSelect: 'none' }}>{currentQ.question}</div>
                </div>

                <div className="question-marks-badge">
                  [{currentQ.marks} Marks]
                </div>
              </div>

              {/* SECTION A: THEORY QUESTION */}
              {currentQ.type === 'theory' && (
                <div style={{ marginTop: '1.5rem', userSelect: 'text' }}>
                  <div className="theory-instruction-bar">
                    <span>Write your detailed answer in the box below:</span>
                    <span className={`theory-word-counter ${(currentAnswerObj?.wordCount || 0) > (currentQ.wordLimit || 150) ? 'exceeded-limit' : 'within-limit'}`}>
                      Word Count: {currentAnswerObj?.wordCount || 0} / {currentQ.wordLimit || 150} words
                    </span>
                  </div>

                  <textarea
                    value={currentAnswerObj?.answer || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    onPaste={(e) => {
                      e.preventDefault();
                      showSecurityNotice('Pasting is disabled. Please type your explanation.');
                    }}
                    onCopy={(e) => {
                      e.preventDefault();
                      showSecurityNotice('Copying content is disabled.');
                    }}
                    onCut={(e) => {
                      e.preventDefault();
                      showSecurityNotice('Cutting content is disabled.');
                    }}
                    onDrop={(e) => e.preventDefault()}
                    placeholder="Type your structured explanation here..."
                    className="theory-textarea"
                    rows={8}
                    spellCheck={false}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', userSelect: 'none' }}>
                    <span>Adhere strictly to the word limit of {currentQ.wordLimit || 150} words.</span>
                    <span>✓ Answers are auto-saved</span>
                  </div>
                </div>
              )}

              {/* SECTION B: MCQ QUESTION */}
              {currentQ.type === 'mcq' && (
                <div className="mcq-options-container" style={{ userSelect: 'none' }}>
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
                <div style={{ marginTop: '1.25rem', userSelect: 'text' }}>
                  {/* Specification Card */}
                  {currentQ.codingDetails && (
                    <div className="coding-spec-card" style={{ userSelect: 'none' }}>
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

                  {/* Integrated Code Editor with isExamMode enabled */}
                  <CodeEditor
                    value={currentAnswerObj?.answer || ''}
                    onChange={(newCode) => handleAnswerChange(newCode, currentAnswerObj?.language || 'javascript')}
                    language={currentAnswerObj?.language || 'javascript'}
                    onLanguageChange={(newLang) => handleAnswerChange(currentAnswerObj?.answer || '', newLang)}
                    minHeight="300px"
                    isExamMode={true}
                  />
                </div>
              )}
            </div>
          )}

          {/* Bottom Question Controls Bar */}
          <div className="paper-controls-bar" style={{ userSelect: 'none' }}>
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

          {/* Institutional Paper Sheet Footer */}
          <div style={{
            padding: '0.85rem 1.5rem',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: '#64748b',
            userSelect: 'none'
          }}>
            <span>ExamDesk Secure Examination Environment</span>
            <span>Designed &amp; Developed by <strong style={{ color: '#1d4ed8' }}>Yash Diwate</strong></span>
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

      {/* TAB SWITCH WARNING MODAL (1st Offense) */}
      {showWarningModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            maxWidth: '520px',
            width: '100%',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '2px solid #fde68a'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <AlertTriangle size={32} color="#b45309" />
            </div>

            <span className="badge badge-warning" style={{ fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
              Security Policy Warning (1 of 1)
            </span>

            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>
              Tab Switch Detected!
            </h2>

            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '1rem',
              color: '#92400e',
              fontSize: '0.875rem',
              lineHeight: '1.6',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: '700' }}>
                Navigating away from the examination window is strictly prohibited.
              </p>
              <p style={{ margin: 0 }}>
                This is your <strong>first and final warning</strong>. If you switch tabs, minimize your browser, or click outside the examination window again, your exam will be <strong>immediately cancelled and terminated</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowWarningModal(false);
                isProcessingViolationRef.current = false;
              }}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              I Understand — Return to Examination
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN REQUIRED MODAL */}
      {!isFullscreen && !loading && !isCancelled && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            maxWidth: '480px',
            width: '100%',
            padding: '2.25rem 2rem',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            border: '2px solid #3b82f6'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <Maximize size={32} color="#2563eb" />
            </div>

            <span className="badge badge-primary" style={{ fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
              Proctoring Requirement
            </span>

            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>
              Fullscreen Mode Required
            </h2>

            <p style={{ color: '#475569', fontSize: '0.9375rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
              ExamDesk enforces fullscreen mode during active examinations to protect institutional integrity. Navigating away or exiting fullscreen is monitored.
            </p>

            <button
              type="button"
              onClick={enterFullscreen}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
              }}
            >
              <Maximize size={18} />
              Enter Fullscreen Examination
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
