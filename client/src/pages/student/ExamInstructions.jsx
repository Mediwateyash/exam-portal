import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  ArrowLeft, 
  Clock, 
  Award, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ShieldAlert,
  Play
} from 'lucide-react';

export default function ExamInstructions() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [examData, setExamData] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadInstructions() {
      try {
        const res = await api.getExamInstructions(id);
        setExamData(res.exam);
        setStats(res.stats || {});
        if (res.submission && (res.submission.status === 'submitted' || res.submission.status === 'graded')) {
          navigate(`/student/results/${res.submission.id}`);
        }
      } catch (err) {
        setError(err.message || 'Failed to load examination instructions.');
      } finally {
        setLoading(false);
      }
    }
    loadInstructions();
  }, [id, navigate]);

  const handleStartExam = () => {
    if (!agreed) {
      alert('Please check the confirmation box to acknowledge exam regulations.');
      return;
    }
    navigate(`/exam/${id}/take`);
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
          to="/student/my-exams"
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
          <ArrowLeft size={16} /> Back to My Exams
        </Link>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#0f172a' }}>
          Examination Instructions & Regulations
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9375rem', marginTop: '0.2rem' }}>
          Please carefully review the guidelines before commencing the timed examination.
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
          <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Official Examination Document
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>
            {exam.title}
          </h2>
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
          marginBottom: '1.75rem'
        }}>
          <AlertTriangle size={20} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
            <strong>Important Timer Notice:</strong> The countdown timer will start immediately once you click <strong>Start Examination</strong>.
            Do not reload or navigate away from the test paper. When the timer hits <strong>00:00:00</strong>, your exam will be automatically submitted.
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

        {/* Launch Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Link to="/student/my-exams" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleStartExam}
            disabled={!agreed}
            className="btn btn-primary btn-lg"
            style={{
              background: agreed ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#cbd5e1',
              boxShadow: agreed ? '0 4px 14px rgba(37, 99, 235, 0.3)' : 'none'
            }}
          >
            <Play size={18} />
            Start Examination Now
          </button>
        </div>
      </div>
    </div>
  );
}
