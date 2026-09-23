import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  FileText, 
  PlusCircle, 
  Clock, 
  Award, 
  Users, 
  Trash2, 
  Edit3, 
  Layers, 
  CheckSquare, 
  AlertCircle,
  Settings
} from 'lucide-react';

export default function ManageExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Modal State
  const [editModalExam, setEditModalExam] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const loadExams = async () => {
    try {
      const res = await api.getExams();
      setExams(res.exams || []);
    } catch (err) {
      setError(err.message || 'Failed to load examinations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteModalId) return;
    setIsDeleting(true);
    try {
      await api.deleteExam(deleteModalId);
      setDeleteModalId(null);
      await loadExams();
    } catch (err) {
      setError(err.message || 'Failed to delete examination.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (exam) => {
    setEditModalExam(exam);
    setEditFormData({
      title: exam.title,
      description: exam.description || '',
      duration: exam.duration,
      total_marks: exam.total_marks,
      passing_marks: exam.passing_marks,
      exam_date: exam.exam_date || '',
      status: exam.status
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editModalExam) return;
    try {
      await api.updateExam(editModalExam.id, editFormData);
      setEditModalExam(null);
      await loadExams();
    } catch (err) {
      alert(err.message || 'Failed to update examination.');
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
        <p>Loading examinations...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Header */}
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
            Manage Examinations
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9375rem', marginTop: '0.2rem' }}>
            View, edit, configure modules, import questions, and track candidate registrations.
          </p>
        </div>

        <Link to="/admin/generate-exam" className="btn btn-primary">
          <PlusCircle size={18} />
          Generate Exam
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Examinations Table */}
      {exams.length === 0 ? (
        <div className="empty-state">
          <FileText className="empty-icon" />
          <div className="empty-title">No examinations found</div>
          <div className="empty-description">Create your first examination to begin adding modules and questions.</div>
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
                <th>Passing Marks</th>
                <th>Modules</th>
                <th>Questions</th>
                <th>Registered</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id}>
                  <td>
                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>{exam.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Date: {exam.exam_date || 'Flexible'} • Time: {exam.start_time || 'N/A'} - {exam.end_time || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: '600' }}>
                      <Clock size={14} color="#64748b" />
                      {exam.duration}m
                    </span>
                  </td>
                  <td><strong>{exam.total_marks}</strong></td>
                  <td>{exam.passing_marks}</td>
                  <td>
                    <span className="badge badge-purple">{exam.module_count} Modules</span>
                  </td>
                  <td>
                    <span className="badge badge-primary">{exam.question_count} Questions</span>
                  </td>
                  <td>
                    <span className="badge badge-secondary">{exam.registered_students} Students</span>
                  </td>
                  <td>
                    <span className={`badge ${exam.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                      {exam.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                      <Link
                        to={`/admin/exams/${exam.id}/manage`}
                        className="btn btn-primary btn-sm"
                        title="Manage Modules and Questions"
                      >
                        <Settings size={14} />
                        Manage
                      </Link>

                      <button
                        type="button"
                        onClick={() => openEditModal(exam)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Exam"
                      >
                        <Edit3 size={14} />
                      </button>

                      <Link
                        to={`/admin/submissions?examId=${exam.id}`}
                        className="btn btn-secondary btn-sm"
                        title="View Submissions & Results"
                      >
                        <CheckSquare size={14} />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setDeleteModalId(exam.id)}
                        className="btn btn-outline-danger btn-sm"
                        title="Delete Exam"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#b91c1c' }}>Delete Examination</h3>
            </div>
            <div className="modal-body">
              <p style={{ color: '#334155', fontSize: '0.875rem' }}>
                Are you sure you want to delete this examination? This will permanently remove all associated modules, questions, student registrations, and submissions.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setDeleteModalId(null)}
                className="btn btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="btn btn-danger"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {editModalExam && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Edit Examination Details</h3>
            </div>
            <form onSubmit={handleEditSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Exam Title</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="form-textarea"
                    style={{ minHeight: '70px' }}
                  />
                </div>

                <div className="grid-3" style={{ marginBottom: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Duration (mins)</label>
                    <input
                      type="number"
                      value={editFormData.duration}
                      onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Total Marks</label>
                    <input
                      type="number"
                      value={editFormData.total_marks}
                      onChange={(e) => setEditFormData({ ...editFormData, total_marks: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Passing Marks</label>
                    <input
                      type="number"
                      value={editFormData.passing_marks}
                      onChange={(e) => setEditFormData({ ...editFormData, passing_marks: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Exam Date</label>
                    <input
                      type="date"
                      value={editFormData.exam_date}
                      onChange={(e) => setEditFormData({ ...editFormData, exam_date: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="form-select"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditModalExam(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
