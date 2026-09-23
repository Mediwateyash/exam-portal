import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  FileText, 
  Clock, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  Play, 
  HelpCircle, 
  AlertCircle,
  BookOpen
} from 'lucide-react';

export default function MyExams() {
  const [myExams, setMyExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMyExams() {
      try {
        const res = await api.getMyExams();
        setMyExams(res.myExams || []);
      } catch (err) {
        setError(err.message || 'Failed to load your enrolled exams.');
      } finally {
        setLoading(false);
      }
    }
    loadMyExams();
  }, []);

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
        <p>Loading your examination enrollments...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#0f172a' }}>
          My Registered Examinations
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9375rem', marginTop: '0.2rem' }}>
          Access your registered tests, continue ongoing exam sessions, or review submitted attempts.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {myExams.length === 0 ? (
        <div className="empty-state">
          <BookOpen className="empty-icon" />
          <div className="empty-title">You haven't registered for any examinations yet</div>
          <div className="empty-description">Explore our catalog of available tests on the home dashboard and register to take exams.</div>
          <Link to="/student/dashboard" className="btn btn-primary btn-sm">
            Browse Available Exams
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {myExams.map((item) => {
            const isSubmitted = !!item.submission_status;

            return (
              <div
                key={item.id}
                className="card card-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.5rem 1.75rem',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  border: isSubmitted ? '1px solid #e2e8f0' : '1.5px solid #bfdbfe'
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className={`badge ${
                      isSubmitted ? 'badge-success' : 'badge-primary'
                    }`}>
                      {isSubmitted ? 'Submitted' : 'Ready to Start'}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                      Registered on: {new Date(item.registered_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.35rem' }}>
                    {item.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8125rem', color: '#475569' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={14} color="#2563eb" /> {item.duration} Mins
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Award size={14} color="#059669" /> {item.total_marks} Marks
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <HelpCircle size={14} color="#7c3aed" /> {item.question_count} Questions
                    </span>
                  </div>
                </div>

                <div>
                  {isSubmitted ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="badge badge-success" style={{ padding: '0.4rem 0.75rem' }}>
                        <CheckCircle2 size={14} /> Completed
                      </span>
                      <Link to={`/student/results/${item.submission_id}`} className="btn btn-outline-primary">
                        View Result
                      </Link>
                    </div>
                  ) : (
                    <Link
                      to={`/exam/${item.id}/instructions`}
                      className="btn btn-primary btn-lg"
                      style={{
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                      }}
                    >
                      <Play size={16} />
                      Start Examination
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
