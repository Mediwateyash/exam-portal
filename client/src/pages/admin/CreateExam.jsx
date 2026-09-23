import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { PlusCircle, ArrowLeft, Clock, Award, Calendar, FileText, AlertCircle } from 'lucide-react';

export default function CreateExam() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 90,
    total_marks: 100,
    passing_marks: 40,
    exam_date: new Date().toISOString().split('T')[0],
    start_time: '10:00 AM',
    end_time: '11:30 AM',
    instructions: `1. This examination paper contains Theory, MCQ, and Coding sections.
2. Adhere strictly to the word limits for Theory questions.
3. Your answers are auto-saved in real time.
4. Auto-submission will trigger when the timer reaches 00:00:00.
5. Do not switch tabs or reload the browser during the session.`,
    status: 'published'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Exam title is required.');
      return;
    }
    if (!formData.duration || formData.duration <= 0) {
      setError('Duration must be a positive number of minutes.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.createExam(formData);
      // Navigate to the newly created exam's management page
      navigate(`/admin/exams/${res.exam.id}/manage`);
    } catch (err) {
      setError(err.message || 'Failed to create examination.');
      setLoading(false);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '840px' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/admin/manage-exams"
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
          <ArrowLeft size={16} /> Back to Exams
        </Link>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#0f172a' }}>
          Generate New Examination
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9375rem', marginTop: '0.2rem' }}>
          Set up the examination specifications, marks distribution, and guidelines.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Creation Form Card */}
      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="title">
              Exam Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Data Structures & Algorithms Final Examination"
              className="form-input"
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Description / Overview
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a brief summary of the examination scope, syllabus, and target audience..."
              className="form-textarea"
              style={{ minHeight: '80px' }}
            />
          </div>

          {/* Duration & Marks */}
          <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="duration">
                Duration (Minutes) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="duration"
                name="duration"
                type="number"
                min="1"
                max="480"
                value={formData.duration}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="total_marks">
                Total Marks <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="total_marks"
                name="total_marks"
                type="number"
                min="1"
                value={formData.total_marks}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="passing_marks">
                Passing Marks <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="passing_marks"
                name="passing_marks"
                type="number"
                min="1"
                value={formData.passing_marks}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Dates & Times */}
          <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="exam_date">
                Exam Date
              </label>
              <input
                id="exam_date"
                name="exam_date"
                type="date"
                value={formData.exam_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="start_time">
                Start Time
              </label>
              <input
                id="start_time"
                name="start_time"
                type="text"
                value={formData.start_time}
                onChange={handleChange}
                placeholder="e.g. 10:00 AM"
                className="form-input"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="end_time">
                End Time
              </label>
              <input
                id="end_time"
                name="end_time"
                type="text"
                value={formData.end_time}
                onChange={handleChange}
                placeholder="e.g. 11:30 AM"
                className="form-input"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="form-group">
            <label className="form-label" htmlFor="instructions">
              Exam Instructions & Guidelines
            </label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              placeholder="List out student instructions line by line..."
              className="form-textarea"
              style={{ minHeight: '120px' }}
            />
            <div className="form-hint">
              These instructions will be presented to the student on the official instruction sheet before starting the exam.
            </div>
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label" htmlFor="status">
              Exam Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-select"
            >
              <option value="published">Published (Available for students)</option>
              <option value="draft">Draft (Hidden from students)</option>
            </select>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <Link to="/admin/manage-exams" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
            >
              <PlusCircle size={18} />
              {loading ? 'Creating Examination...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
