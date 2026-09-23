import React, { useEffect } from 'react';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle, Award, Clock, HelpCircle, FileText, ArrowRight, User } from 'lucide-react';

export default function ExamSubmitted() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const submission = location.state?.submission || null;
  const isAuto = location.state?.isAuto || false;

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

        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
          Exam Submitted Successfully!
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '480px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
          {isAuto
            ? 'The examination timer reached 00:00:00 and your answers were automatically securely saved and submitted.'
            : 'Your answers have been securely recorded. All MCQ sections are automatically scored, and theoretical questions will be reviewed by the evaluator.'}
        </p>

        {/* Submission Details Receipt Card */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'left',
          marginBottom: '2rem'
        }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            Official Submission Receipt
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
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Total Questions</div>
              <div style={{ fontWeight: '700', color: '#0f172a' }}>{submission?.totalQuestions || 'All'}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Attempted Questions</div>
              <div style={{ fontWeight: '700', color: '#2563eb' }}>{submission?.attemptedQuestions || 0}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/student/results" className="btn btn-secondary btn-lg">
            My Results History
          </Link>

          {submission?.id ? (
            <Link
              to={`/student/results/${submission.id}`}
              className="btn btn-primary btn-lg"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              View Submitted Answers
              <ArrowRight size={18} />
            </Link>
          ) : (
            <Link to="/student/dashboard" className="btn btn-primary btn-lg">
              Return to Home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
