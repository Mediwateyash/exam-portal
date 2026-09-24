import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  Layers, 
  Clock, 
  Award, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Play, 
  BookOpen, 
  Code, 
  FileText, 
  RotateCcw,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';

export default function ExamModules() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reattempting, setReattempting] = useState(false);

  const loadModulesOverview = async () => {
    try {
      const res = await api.getExamModulesOverview(id);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load examination modules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModulesOverview();
  }, [id]);

  const handleReattempt = async () => {
    if (!window.confirm('Are you sure you want to reattempt this examination? A fresh examination session will be initialized with full time duration.')) {
      return;
    }

    setReattempting(true);
    setError('');
    try {
      await api.reattemptExam(id);
      await loadModulesOverview();
    } catch (err) {
      setError(err.message || 'Failed to initialize reattempt.');
    } finally {
      setReattempting(false);
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
        <p>Loading examination modules and curriculum...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const exam = data?.exam || {};
  const modules = data?.modules || [];
  const submission = data?.submission || null;
  const overall = data?.overall_progress || {};
  const attemptNum = submission?.attempt_number || 1;
  const isCompleted = submission && (submission.submitted_at || submission.status === 'submitted' || submission.status === 'graded');

  return (
    <div className="main-content" style={{ maxWidth: '1000px' }}>
      {/* Back Link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/student/my-exams"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: '#64748b',
            fontSize: '0.875rem',
            fontWeight: '600',
            textDecoration: 'none'
          }}
        >
          <ArrowLeft size={16} /> Back to My Registered Exams
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Hero Exam Header Card */}
      <div className="card" style={{
        padding: '2.25rem 2.5rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        color: '#ffffff',
        boxShadow: 'var(--shadow-lg)',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.25)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                Module-Wise Examination Desk
              </span>
              <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                Attempt #{attemptNum}
              </span>
              {isCompleted && (
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                  ✓ Completed
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.6rem', lineHeight: '1.25' }}>
              {exam.title}
            </h1>

            <p style={{ color: '#94a3b8', fontSize: '0.9375rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {exam.description || 'Complete each evaluation module designed by your evaluator. You can take the exam module-by-module at your own pace.'}
            </p>

            {/* Exam Specs Pills */}
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: '#cbd5e1' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={16} color="#60a5fa" /> <strong>{exam.duration}</strong> Minutes Total
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Award size={16} color="#34d399" /> <strong>{exam.total_marks}</strong> Total Marks
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Layers size={16} color="#c084fc" /> <strong>{modules.length}</strong> Modules
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={16} color="#fbbf24" /> Passing: <strong>{exam.passing_marks}</strong> Marks
              </span>
            </div>
          </div>

          {/* Action on Header: Full Exam Button or Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '220px' }}>
            <Link
              to={`/exam/${exam.id}/instructions`}
              className="btn btn-primary btn-lg"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                textAlign: 'center',
                justifyContent: 'center',
                width: '100%'
              }}
            >
              <Play size={17} />
              Take All Modules (Full Exam)
            </Link>

            {submission?.id && (
              <Link
                to={`/student/results/${submission.id}`}
                className="btn btn-secondary"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  textAlign: 'center',
                  justifyContent: 'center'
                }}
              >
                View Latest Result
              </Link>
            )}

            {isCompleted && (
              <button
                type="button"
                onClick={handleReattempt}
                disabled={reattempting}
                className="btn btn-warning btn-sm"
                style={{
                  textAlign: 'center',
                  justifyContent: 'center',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: '700'
                }}
              >
                <RotateCcw size={15} />
                {reattempting ? 'Resetting...' : 'Reattempt Entire Exam'}
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar Strip */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem', color: '#94a3b8' }}>
            <span>Module Completion Progress: <strong>{overall.completed_modules || 0} of {overall.total_modules || modules.length} Modules</strong></span>
            <span style={{ color: '#60a5fa', fontWeight: '700' }}>{overall.percent_completed || 0}% Questions Answered</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${overall.percent_completed || 0}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #10b981)',
              borderRadius: '4px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Modules List Section */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>
              Select a Module to Start
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Each module is curated with specific questions by your instructor. Click "Start Module Exam" to sit for that specific module.
            </p>
          </div>
        </div>

        {modules.length === 0 ? (
          <div className="empty-state">
            <Layers className="empty-icon" />
            <div className="empty-title">No modules have been configured for this examination</div>
            <div className="empty-description">Your instructor will add assessment modules shortly.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {modules.map((m, idx) => {
              const isModCompleted = m.progress?.is_completed;
              const isModInProgress = m.progress?.is_in_progress;

              return (
                <div
                  key={m.id}
                  className="card card-hover"
                  style={{
                    padding: '1.75rem 2rem',
                    border: isModCompleted
                      ? '1.5px solid #a7f3d0'
                      : isModInProgress
                        ? '1.5px solid #fed7aa'
                        : '1.5px solid #e2e8f0',
                    borderLeft: isModCompleted
                      ? '6px solid #10b981'
                      : isModInProgress
                        ? '6px solid #f97316'
                        : '6px solid #3b82f6',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-primary" style={{ fontWeight: '800' }}>
                          MODULE {m.module_number || (idx + 1)}
                        </span>

                        <span className={`badge ${
                          isModCompleted
                            ? 'badge-success'
                            : isModInProgress
                              ? 'badge-warning'
                              : 'badge-secondary'
                        }`}>
                          {isModCompleted ? '✓ Completed' : isModInProgress ? 'In Progress' : 'Not Attempted'}
                        </span>

                        {m.stats?.total_marks > 0 && (
                          <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '700' }}>
                            • Total Marks: {m.stats.total_marks}
                          </span>
                        )}
                      </div>

                      {/* Module Title */}
                      <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.4rem', lineHeight: '1.3' }}>
                        {m.title}
                      </h3>

                      {/* Module Description */}
                      {m.description && (
                        <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.5', marginBottom: '1rem' }}>
                          {m.description}
                        </p>
                      )}

                      {/* Question Breakdown Chips */}
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        <div style={{
                          padding: '0.35rem 0.75rem',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: '#1d4ed8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <FileText size={14} />
                          <span>{m.stats?.theory_count || 0} Theory Qs</span>
                        </div>

                        <div style={{
                          padding: '0.35rem 0.75rem',
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: '#047857',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <HelpCircle size={14} />
                          <span>{m.stats?.mcq_count || 0} MCQ Qs</span>
                        </div>

                        <div style={{
                          padding: '0.35rem 0.75rem',
                          background: '#f5f3ff',
                          border: '1px solid #ddd6fe',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: '#6d28d9',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <Code size={14} />
                          <span>{m.stats?.coding_count || 0} Coding Qs</span>
                        </div>

                        <div style={{
                          padding: '0.35rem 0.75rem',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <Award size={14} color="#059669" />
                          <span>{m.stats?.total_questions || 0} Total Qs ({m.stats?.total_marks || 0} Marks)</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Column on Module Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: '180px', justifyContent: 'center' }}>
                      <Link
                        to={`/exam/${exam.id}/take?moduleId=${m.id}`}
                        className="btn btn-primary"
                        style={{
                          background: isModCompleted
                            ? 'linear-gradient(135deg, #059669, #047857)'
                            : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                          boxShadow: '0 3px 10px rgba(37, 99, 235, 0.25)',
                          justifyContent: 'center',
                          fontWeight: '700'
                        }}
                      >
                        <Play size={16} />
                        {isModCompleted ? 'Retake Module Exam' : isModInProgress ? 'Resume Module' : 'Start Module Exam'}
                      </Link>

                      <Link
                        to={`/exam/${exam.id}/instructions?moduleId=${m.id}`}
                        className="btn btn-outline-secondary btn-sm"
                        style={{ justifyContent: 'center' }}
                      >
                        Module Rules &amp; Info
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
