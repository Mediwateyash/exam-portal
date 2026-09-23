import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ArrowRight, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export default function ResultsList() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadResults() {
      try {
        const res = await api.getStudentResults();
        setResults(res.results || []);
      } catch (err) {
        setError(err.message || 'Failed to load examination results.');
      } finally {
        setLoading(false);
      }
    }
    loadResults();
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
        <p>Loading your exam results and scorecards...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#0f172a' }}>
          Examination Results & Scorecards
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9375rem', marginTop: '0.2rem' }}>
          Review your scored examinations, marks breakdown, and evaluator remarks.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {results.length === 0 ? (
        <div className="empty-state">
          <Award className="empty-icon" />
          <div className="empty-title">No examination results available yet</div>
          <div className="empty-description">Once you complete and submit an examination, your scores and evaluated answers will be displayed here.</div>
          <Link to="/student/dashboard" className="btn btn-primary btn-sm">
            View Available Exams
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map((res) => {
            const isGraded = res.status === 'graded';
            const isPassed = res.isPassed;

            return (
              <div
                key={res.submission_id}
                className="card card-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.5rem 1.75rem',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  borderLeft: isGraded
                    ? (isPassed ? '5px solid #10b981' : '5px solid #ef4444')
                    : '5px solid #f59e0b'
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className={`badge ${
                      isGraded
                        ? (isPassed ? 'badge-success' : 'badge-danger')
                        : 'badge-warning'
                    }`}>
                      {isGraded ? (isPassed ? 'Passed' : 'Needs Improvement') : 'Under Theory Review'}
                    </span>

                    <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                      Submitted: {new Date(res.submitted_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.35rem' }}>
                    {res.exam_title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8125rem', color: '#475569' }}>
                    <span>
                      Passing Mark: <strong>{res.passing_marks}</strong> / {res.total_marks}
                    </span>
                    <span>
                      Attempted: <strong>{res.answered_questions}</strong> of {res.total_questions} Qs
                    </span>
                  </div>
                </div>

                {/* Score Summary Badge & Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.1' }}>
                      {res.score} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ {res.total_marks}</span>
                    </div>
                    <div style={{
                      fontSize: '0.8125rem',
                      fontWeight: '700',
                      color: isGraded ? (isPassed ? '#059669' : '#dc2626') : '#d97706'
                    }}>
                      {res.percentage}% Score
                    </div>
                  </div>

                  <Link
                    to={`/student/results/${res.submission_id}`}
                    className="btn btn-primary"
                  >
                    View Result
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
