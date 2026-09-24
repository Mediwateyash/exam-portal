import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  FileText, 
  Users, 
  CheckCircle, 
  HelpCircle, 
  Layers, 
  PlusCircle, 
  ArrowRight, 
  Clock, 
  TrendingUp, 
  ClipboardCheck,
  AlertCircle 
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.getAdminStats();
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
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
        <p>Loading administrator dashboard...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentExams = data?.recentExams || [];

  return (
    <div className="main-content">
      {/* Top Banner / Welcome */}
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
            Administrator Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9375rem', marginTop: '0.2rem' }}>
            Manage examinations, question banks, modules, and evaluate student theory submissions.
          </p>
        </div>

        <Link
          to="/admin/generate-exam"
          className="btn btn-primary btn-lg"
          style={{
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
          }}
        >
          <PlusCircle size={20} />
          Generate Exam
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.totalExams || 0}</div>
            <div className="stat-label">Total Exams</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.totalStudents || 0}</div>
            <div className="stat-label">Total Students</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <HelpCircle size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.totalQuestions || 0}</div>
            <div className="stat-label">Total Questions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <ClipboardCheck size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.pendingEvaluations || 0}</div>
            <div className="stat-label">Pending Evaluations</div>
          </div>
        </div>
      </div>

      {/* Hero Action: Generate, Manage & Telemetry Quick Links */}
      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        <div className="card" style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          color: '#ffffff',
          border: 'none',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.25)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.4)', marginBottom: '0.75rem' }}>
              Exam Creator
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.5rem' }}>
              Create an Examination
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Configure duration, marks, modules, and import questions via JSON.
            </p>
          </div>
          <Link to="/admin/generate-exam" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            <PlusCircle size={16} />
            Generate Exam Now
          </Link>
        </div>

        <div className="card" style={{
          background: '#ffffff',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <span className="badge badge-purple" style={{ marginBottom: '0.75rem' }}>
              Submissions &amp; Grading
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
              Evaluate Submissions
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Review student theory answers with word limits and record manual evaluation grades.
            </p>
          </div>
          <Link to="/admin/submissions" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
            <ClipboardCheck size={16} />
            View Submissions ({stats.totalSubmissions || 0})
          </Link>
        </div>

        <div className="card" style={{
          background: '#f0f9ff',
          border: '1.5px solid #bae6fd',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '0.75rem', background: '#0284c7', color: '#ffffff' }}>
              Telegram Proctor Bot
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0c4a6e', marginBottom: '0.5rem' }}>
              Live Telemetry &amp; Alerts
            </h2>
            <p style={{ color: '#0369a1', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Receive instant Telegram alerts for student logins, option clicks, and time spent on questions.
            </p>
          </div>
          <Link to="/admin/telemetry" className="btn btn-primary" style={{ alignSelf: 'flex-start', background: '#0284c7' }}>
            Inspect Live Feed
          </Link>
        </div>
      </div>

      {/* Recent Exams Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
            Recent Examinations
          </h2>
          <Link to="/admin/manage-exams" style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#2563eb',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            View All Exams <ArrowRight size={14} />
          </Link>
        </div>

        {recentExams.length === 0 ? (
          <div className="empty-state">
            <FileText className="empty-icon" />
            <div className="empty-title">No examinations created yet</div>
            <div className="empty-description">Get started by creating your first exam using the button below.</div>
            <Link to="/admin/generate-exam" className="btn btn-primary btn-sm">
              <PlusCircle size={16} />
              Generate Exam
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Duration</th>
                  <th>Total Marks</th>
                  <th>Modules</th>
                  <th>Questions</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentExams.map((exam) => (
                  <tr key={exam.id}>
                    <td>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{exam.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Date: {exam.exam_date || 'N/A'}</div>
                    </td>
                    <td>{exam.duration} mins</td>
                    <td>{exam.total_marks} Marks</td>
                    <td>{exam.module_count} Modules</td>
                    <td>{exam.question_count} Qs</td>
                    <td>
                      <span className="badge badge-secondary">{exam.registration_count} Students</span>
                    </td>
                    <td>
                      <span className={`badge ${exam.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                        {exam.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/admin/exams/${exam.id}/manage`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.35rem 0.75rem' }}
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
