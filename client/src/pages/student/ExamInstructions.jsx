import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { getClientLocation } from '../../utils/geo';
import { 
  ArrowLeft, 
  Clock, 
  Award, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ShieldAlert,
  Play,
  Layers
} from 'lucide-react';

export default function ExamInstructions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get('moduleId');

  const [examData, setExamData] = useState(null);
  const [targetModule, setTargetModule] = useState(null);
  const [stats, setStats] = useState({});
  const [latestSubmission, setLatestSubmission] = useState(null);
  const [allAttempts, setAllAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function loadInstructions() {
      try {
        const res = await api.getExamInstructions(id, moduleId);
        setExamData(res.exam);
        setTargetModule(res.targetModule || null);
        setStats(res.stats || {});
        setLatestSubmission(res.submission);
        setAllAttempts(res.all_attempts || []);
      } catch (err) {
        setError(err.message || 'Failed to load examination instructions.');
      } finally {
        setLoading(false);
      }
    }
    loadInstructions();
  }, [id, moduleId]);

  const isPreviousCompleted = latestSubmission && (
    latestSubmission.status === 'submitted' ||
    latestSubmission.status === 'graded' ||
    latestSubmission.status === 'cancelled' ||
    latestSubmission.is_cancelled
  );

  const nextAttemptNum = isPreviousCompleted
    ? (latestSubmission.attempt_number ? latestSubmission.attempt_number + 1 : 2)
    : (latestSubmission?.attempt_number || 1);

  const handleStartExam = async () => {
    if (!agreed) {
      alert('Please check the confirmation box to acknowledge exam regulations.');
      return;
    }

    setStarting(true);
    setError('');

    try {
      // Warm-up GPS location permissions
      await getClientLocation().catch(() => {});

      if (isPreviousCompleted) {
        await api.reattemptExam(id);
      }

      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen().catch(() => {});
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen().catch(() => {});
      }

      navigate(`/exam/${id}/take${moduleId ? `?moduleId=${moduleId}` : ''}`);
    } catch (err) {
      setError(err.message || 'Failed to initialize examination.');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <p>Loading examination instructions...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const exam = examData || {};

  return (
    <div className="main-content" style={{ maxWidth: '850px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to={moduleId ? `/exam/${id}/modules` : '/student/my-exams'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: '#64748b',
            fontSize: '0.875rem',
            fontWeight: '600',
            textDecoration: 'none',
            marginBottom: '0.75rem'
          }}
        >
          <ArrowLeft size={16} /> {moduleId ? 'Back to Exam Modules' : 'Back to My Exams'}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#0f172a' }}>
            Examination Instructions & Regulations
          </h1>
          {targetModule && (
            <span className="badge badge-primary" style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem' }}>
              Module: {targetModule.title}
            </span>
          )}
        </div>
        <p style={{ color: '#64748b', fontSize: '0.9375rem', marginTop: '0.2rem' }}>
          {targetModule 
            ? `Review the guidelines below before commencing the exam for Module: ${targetModule.title}.` 
            : 'Please carefully review the guidelines before commencing the timed examination.'}
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Official Header Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Official Examination Document
            </div>
            {targetModule && (
              <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                Single Module Evaluation
              </span>
            )}
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>
            {exam.title}
          </h2>
          {targetModule && (
            <div style={{ marginTop: '0.5rem', fontSize: '1.05rem', fontWeight: '700', color: '#2563eb' }}>
              Focus: {targetModule.title}
            </div>
          )}
        </div>

        {/* Specs Strip */}
        <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Duration</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={18} color="#2563eb" /> {exam.duration} Minutes
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Maximum Marks</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Award size={18} color="#059669" /> {exam.total_marks} Marks
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Passing Requirement</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
              {exam.passing_marks} Marks ({((exam.passing_marks / exam.total_marks) * 100).toFixed(0)}%)
            </div>
          </div>
        </div>

        {/* Question Sections Breakdown */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.75rem' }}>
            Examination Structure & Sections:
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem 1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1d4ed8' }}>SECTION A — THEORY</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e40af' }}>{stats.theory_count || 0} Questions</div>
              <div style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Adhere to word limits</div>
            </div>

            <div style={{ padding: '0.75rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#047857' }}>SECTION B — MCQ</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#065f46' }}>{stats.mcq_count || 0} Questions</div>
              <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Automated evaluation</div>
            </div>

            <div style={{ padding: '0.75rem 1rem', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6d28d9' }}>SECTION C — CODING</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#5b21b6' }}>{stats.coding_count || 0} Questions</div>
              <div style={{ fontSize: '0.75rem', color: '#8b5cf6' }}>Code workspace</div>
            </div>
          </div>
        </div>

        {/* Custom Instructions Text */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.75rem' }}>
            Official Examination Instructions:
          </h3>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1.25rem 1.5rem',
            lineHeight: '1.7',
            fontSize: '0.9375rem',
            color: '#334155',
            whiteSpace: 'pre-wrap'
          }}>
            {exam.instructions || 'Follow all standard academic testing integrity policies. Auto-submission will trigger when timer reaches 00:00:00.'}
          </div>
        </div>

        {/* Rules & Warnings Callout */}
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <AlertTriangle size={20} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
            <strong>Important Timer Notice:</strong> The countdown timer will start immediately once you click <strong>Start Examination</strong>.
            Do not reload or navigate away from the test paper. When the timer hits <strong>00:00:00</strong>, your exam will be automatically submitted.
          </div>
        </div>

        {/* Security & Integrity Policy Notice */}
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.75rem'
        }}>
          <ShieldAlert size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.875rem', color: '#991b1b' }}>
            <strong>Strict Exam Security Policy:</strong>
            <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0 }}>
              <li><strong>Mandatory Fullscreen:</strong> The examination must be taken in Fullscreen Mode. Entering the exam will automatically request fullscreen. Exiting fullscreen or minimizing during the exam will be recorded as a security policy violation.</li>
              <li><strong>Tab Switching:</strong> Navigating away from this exam or switching browser tabs is strictly tracked. The 1st tab switch issues an official warning. The 2nd tab switch will <strong>immediately cancel and terminate</strong> your examination session.</li>
              <li><strong>Clipboard & Copy Protection:</strong> Copying, cutting, dragging, and pasting text or code into the examination paper is completely prohibited and blocked. All code and explanations must be typed directly.</li>
            </ul>
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div style={{
          padding: '1rem 1.25rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#0f172a' }}>
              I have read, understood, and agree to abide by all the examination instructions and honor code rules.
            </span>
          </label>
        </div>

        {/* Previous Attempt Summary Banner if applicable */}
        {latestSubmission && isPreviousCompleted && (
          <div style={{
            background: '#f5f3ff',
            border: '1.5px solid #ddd6fe',
            borderRadius: '8px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6d28d9', textTransform: 'uppercase' }}>
                Previous Attempt #{latestSubmission.attempt_number || 1} Recorded
              </div>
              <div style={{ fontSize: '0.875rem', color: '#5b21b6', marginTop: '0.2rem' }}>
                Status: <strong>{latestSubmission.status.toUpperCase()}</strong> • Score: <strong>{latestSubmission.score} / {latestSubmission.total_marks}</strong> ({latestSubmission.percentage}%)
              </div>
            </div>
            <Link
              to={`/student/results/${latestSubmission.id}`}
              className="btn btn-secondary btn-sm"
            >
              View Previous Result
            </Link>
          </div>
        )}

        {/* Launch Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Link to={moduleId ? `/exam/${id}/modules` : '/student/my-exams'} className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleStartExam}
            disabled={!agreed || starting}
            className="btn btn-primary btn-lg"
            style={{
              background: agreed ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#cbd5e1',
              boxShadow: agreed ? '0 4px 14px rgba(37, 99, 235, 0.3)' : 'none'
            }}
          >
            <Play size={18} />
            {starting
              ? 'Initializing Session...'
              : targetModule
                ? `Start Module Exam (${targetModule.title})`
                : isPreviousCompleted
                  ? `Start Reattempt (Attempt #${nextAttemptNum})`
                  : 'Start Examination Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
