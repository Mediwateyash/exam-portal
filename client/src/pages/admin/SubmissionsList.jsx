import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Award, 
  Eye, 
  ArrowRight,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function SubmissionsList() {
  const [searchParams] = useSearchParams();
  const examIdParam = searchParams.get('examId');

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadSubmissions() {
      try {
        const res = await api.getSubmissions(examIdParam || null);
        setSubmissions(res.submissions || []);
      } catch (err) {
        setError(err.message || 'Failed to load submissions.');
      } finally {
        setLoading(false);
      }
    }
    loadSubmissions();
  }, [examIdParam]);

  const filtered = submissions.filter((sub) => {
    if (filterStatus !== 'all' && sub.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        sub.student_name?.toLowerCase().includes(q) ||
        sub.student_email?.toLowerCase().includes(q) ||
        sub.exam_title?.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
        <p>Loading candidate submissions...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#0f172a' }}>
            Exam Submissions & Evaluation
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9375rem', marginTop: '0.2rem' }}>
            Review candidate answer sheets, evaluate theory questions manually, and publish results.
          </p>
        </div>

        {examIdParam && (
          <Link to="/admin/submissions" className="btn btn-secondary btn-sm">
            Clear Exam Filter
          </Link>
        )}
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: '#ffffff' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, email, or exam..."
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="#64748b" />
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '0.45rem 1rem' }}
            >
              <option value="all">All Submissions ({submissions.length})</option>
              <option value="submitted">Needs Theory Evaluation</option>
              <option value="graded">Graded / Published</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <ClipboardCheck className="empty-icon" />
          <div className="empty-title">No submissions found</div>
          <div className="empty-description">
            {searchQuery || filterStatus !== 'all'
              ? 'No candidate submissions match your current search filters.'
              : 'As students complete and submit their exams, their submissions will appear here for grading.'}
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Examination</th>
                <th>Submitted At</th>
                <th>Score / Total</th>
                <th>Percentage</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => {
                const isNeedsEval = sub.status === 'submitted' || sub.pending_manual_eval > 0;

                return (
                  <tr key={sub.submission_id}>
                    <td>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{sub.student_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sub.student_email}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{sub.exam_title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {sub.answered_count} of {sub.total_questions} questions answered
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.875rem', color: '#334155' }}>
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>
                        {sub.score} / {sub.total_marks}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '700', color: sub.score >= sub.passing_marks ? '#059669' : '#b91c1c' }}>
                        {sub.percentage}%
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${
                        sub.status === 'graded' ? 'badge-success' : 'badge-warning'
                      }`}>
                        {sub.status === 'graded' ? 'Graded' : 'Pending Evaluation'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/admin/submissions/${sub.submission_id}/evaluate`}
                        className={`btn btn-sm ${isNeedsEval ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        <ClipboardCheck size={14} />
                        {isNeedsEval ? 'Evaluate' : 'View Grade'}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
