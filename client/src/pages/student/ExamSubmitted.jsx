import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  CheckCircle, 
  Award, 
  Clock, 
  HelpCircle, 
  FileText, 
  ArrowRight, 
  RotateCcw, 
  AlertCircle,
  Layers
} from 'lucide-react';
import { api } from '../../services/api';

export default function ExamSubmitted() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const submission = location.state?.submission || null;
  const isAuto = location.state?.isAuto || false;
  const activeModule = location.state?.activeModule || null;
  const moduleId = location.state?.moduleId || null;

  const [isReattempting, setIsReattempting] = useState(false);
  const [reattemptError, setReattemptError] = useState('');

  const examId = submission?.examId || location.state?.examId || id;

  useEffect(() => {
    // Trigger celebratory confetti effect on successful submission
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Ignore if confetti unavailable
    }
  }, []);

  const handleReattempt = async () => {
    if (!window.confirm('Are you sure you want to reattempt this examination? A fresh examination session will be initialized with full time duration.')) {
      return;
    }

    setIsReattempting(true);
    setReattemptError('');
    try {
      await api.reattemptExam(examId);
      navigate(`/exam/${examId}/modules`);
    } catch (err) {
      setReattemptError(err.message || 'Failed to initialize reattempt.');
      setIsReattempting(false);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '680px', marginTop: '2rem' }}>
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2.5rem', boxShadow: 'var(--shadow-lg)' }}>
        {/* Success Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: '#ecfdf5',
          color: '#059669',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)'
        }}>
          <CheckCircle size={42} />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span className="badge badge-purple" style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem' }}>
            Attempt #{submission?.attemptNumber || 1}
          </span>
          {activeModule && (
            <span className="badge badge-primary" style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Layers size={13} /> Module: {activeModule.title}
            </span>
          )}
        </div>

        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
          {activeModule ? 'Module Exam Submitted Successfully!' : 'Exam Submitted Successfully!'}
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '480px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
          {isAuto
            ? 'The examination timer reached 00:00:00 and your answers were automatically securely saved and submitted.'
            : activeModule
              ? `Your answers for ${activeModule.title} have been securely recorded. You can return to the Exam Modules Hub to continue with other modules or review your progress.`
              : 'Your answers have been securely recorded. All MCQ sections are automatically scored, and theoretical questions will be reviewed by the evaluator.'}
        </p>

        {reattemptError && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <AlertCircle size={18} />
            <span>{reattemptError}</span>
          </div>
        )}

        {/* Submission Details Receipt Card */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'left',
          marginBottom: '2rem'
        }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Official Submission Receipt</span>
            <span style={{ color: '#7c3aed', fontWeight: '800' }}>Attempt #{submission?.attemptNumber || 1}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Student Name</div>
              <div style={{ fontWeight: '700', color: '#0f172a' }}>{submission?.studentName || 'Student'}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Examination</div>
              <div style={{ fontWeight: '700', color: '#0f172a' }}>{submission?.examTitle || 'Exam'}</div>
            </div>

            {activeModule && (
              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Module Taken</div>
                <div style={{ fontWeight: '700', color: '#2563eb' }}>{activeModule.title}</div>
              </div>
            )}

            <div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Submission Time</div>
              <div style={{ fontWeight: '600', color: '#334155' }}>
                {submission?.submittedAt ? new Date(submission.submittedAt).toLocaleString() : new Date().toLocaleString()}
              </div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Status</div>
              <div style={{ fontWeight: '700', color: '#059669' }}>
                {submission?.hasManualEvaluationPending ? 'Submitted (Theory Review Pending)' : 'Evaluated & Graded'}
              </div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Attempted Questions</div>
              <div style={{ fontWeight: '700', color: '#2563eb' }}>{submission?.attemptedQuestions || 0}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            to={`/exam/${examId}/modules`}
            className="btn btn-primary btn-lg"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: '700'
            }}
          >
            <Layers size={18} />
            Return to Exam Modules Hub
          </Link>

          {submission?.id && (
            <Link
              to={`/student/results/${submission.id}`}
              className="btn btn-secondary btn-lg"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              View Submitted Result
              <ArrowRight size={17} />
            </Link>
          )}

          <button
            type="button"
            onClick={handleReattempt}
            disabled={isReattempting}
            className="btn btn-outline-warning btn-lg"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '700'
            }}
          >
            <RotateCcw size={17} />
            {isReattempting ? 'Preparing...' : 'Reattempt Entire Exam'}
          </button>

          <Link to="/student/results" className="btn btn-outline-secondary btn-lg">
            My Results History
          </Link>
        </div>
      </div>
    </div>
  );
}

