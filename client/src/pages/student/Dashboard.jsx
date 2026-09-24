import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getClientLocation } from '../../utils/geo';
import { 
  BookOpen, 
  Clock, 
  Award, 
  Layers, 
  HelpCircle, 
  CheckCircle, 
  ArrowRight, 
  Sparkles,
  AlertCircle,
  FileCheck,
  RotateCcw
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState(null);
  const [reattemptingId, setReattemptingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadExams = async () => {
    try {
      const res = await api.getAvailableExams();
      setExams(res.exams || []);
    } catch (err) {
      setError(err.message || 'Failed to load available examinations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleRegister = async (examId) => {
    setRegisteringId(examId);
    setError('');
    setSuccessMsg('');

    try {
      const location = await getClientLocation();
      await api.registerExam(examId, location);
      setSuccessMsg('You have successfully registered for the examination!');
      await loadExams();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to register for exam.');
    } finally {
      setRegisteringId(null);
    }
  };

  const handleReattempt = async (examId) => {
    if (!window.confirm('Are you sure you want to reattempt this examination? A fresh examination session will be initialized with full time duration.')) {
      return;
    }

    setReattemptingId(examId);
    setError('');
    try {
      await api.reattemptExam(examId);
      navigate(`/exam/${examId}/instructions`);
    } catch (err) {
      setError(err.message || 'Failed to initialize reattempt.');
      setReattemptingId(null);
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
        <p>Loading available examinations...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '2rem 2.5rem',
        marginBottom: '2.5rem',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.25)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
              Student Portal
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.5rem' }}>
            Welcome back, {user?.name || 'Student'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9375rem', lineHeight: '1.6' }}>
            Browse active examinations, register for your enrolled modules, sit for tests with our digital examination paper, or reattempt assessments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/student/my-exams" className="btn btn-primary btn-lg" style={{ background: '#2563eb' }}>
            <FileCheck size={18} />
            My Registered Exams
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Available Exams Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a' }}>
              Available Examinations
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Register for an exam to unlock the official digital examination paper, or reattempt completed tests.
            </p>
          </div>
        </div>

        {exams.length === 0 ? (
          <div className="empty-state">
            <BookOpen className="empty-icon" />
            <div className="empty-title">No examinations currently available</div>
            <div className="empty-description">Check back later or contact your instructor for scheduled test announcements.</div>
          </div>
        ) : (
          <div className="grid-2">
            {exams.map((exam) => {
              const isRegistered = !!exam.registration_status;
              const isSubmitted = !!exam.submission_status;

              return (
                <div key={exam.id} className="card card-hover" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.75rem',
                  border: isRegistered ? '1.5px solid #bfdbfe' : '1px solid #e2e8f0'
                }}>
                  <div>
                    {/* Top Row: Status Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className={`badge ${
                          isSubmitted ? 'badge-success' :
                          isRegistered ? 'badge-primary' : 'badge-secondary'
                        }`}>
                          {isSubmitted ? 'Completed' : isRegistered ? 'Registered' : 'Available'}
                        </span>
                        {isSubmitted && exam.attempt_number && (
                          <span className="badge badge-purple">
                            Attempt #{exam.attempt_number}
                          </span>
                        )}
                      </div>

                      <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '600' }}>
                        Date: {exam.exam_date || 'Flexible'}
                      </span>
                    </div>

                    {/* Exam Name */}
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem', lineHeight: '1.3' }}>
                      {exam.title}
                    </h3>

                    {/* Description */}
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      lineHeight: '1.5',
                      marginBottom: '1.25rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {exam.description || 'Comprehensive evaluation covering theoretical principles, MCQs, and coding questions.'}
                    </p>

                    {/* Key Specs Pills */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.6rem',
                      padding: '0.85rem 1rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      marginBottom: '1.5rem',
                      fontSize: '0.8125rem',
                      color: '#334155'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={15} color="#2563eb" />
                        <span><strong>{exam.duration}</strong> Minutes</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Award size={15} color="#059669" />
                        <span><strong>{exam.total_marks}</strong> Total Marks</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Layers size={15} color="#7c3aed" />
                        <span><strong>{exam.module_count}</strong> Modules</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <HelpCircle size={15} color="#d97706" />
                        <span><strong>{exam.question_count}</strong> Questions</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {isSubmitted ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <Link
                          to={`/exam/${exam.id}/modules`}
                          className="btn btn-outline-primary btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontWeight: '700'
                          }}
                        >
                          <Layers size={14} />
                          Modules Desk
                        </Link>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleReattempt(exam.id)}
                            disabled={reattemptingId === exam.id}
                            className="btn btn-outline-warning btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontWeight: '700'
                            }}
                          >
                            <RotateCcw size={14} />
                            {reattemptingId === exam.id ? 'Starting...' : 'Reattempt'}
                          </button>
                          <Link to={`/student/results/${exam.submission_id}`} className="btn btn-primary btn-sm">
                            View Results
                          </Link>
                        </div>
                      </div>
                    ) : isRegistered ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span className="badge badge-primary" style={{ padding: '0.4rem 0.75rem' }}>
                          ✓ Registered
                        </span>
                        <Link
                          to={`/exam/${exam.id}/modules`}
                          className="btn btn-primary"
                          style={{
                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontWeight: '700'
                          }}
                        >
                          <Layers size={16} />
                          View Modules &amp; Take Exam
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Registration required</span>
                        <button
                          type="button"
                          onClick={() => handleRegister(exam.id)}
                          disabled={registeringId === exam.id}
                          className="btn btn-primary"
                        >
                          {registeringId === exam.id ? 'Registering...' : 'Register for Exam'}
                        </button>
                      </div>
                    )}
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

