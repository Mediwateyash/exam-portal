import React from 'react';
import { AlertCircle, CheckCircle2, Bookmark, HelpCircle } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  stats = { total: 0, answered: 0, unanswered: 0, review: 0 }
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              background: '#fffbeb',
              color: '#f59e0b',
              padding: '0.4rem',
              borderRadius: '8px'
            }}>
              <AlertCircle size={22} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Confirm Exam Submission</h3>
          </div>
        </div>

        <div className="modal-body">
          <p style={{ color: '#334155', fontSize: '0.9375rem', marginBottom: '1.25rem' }}>
            Are you sure you want to submit your examination? Once submitted, you will not be able to modify your answers.
          </p>

          {/* Metrics summary card */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: '#eff6ff', color: '#2563eb', padding: '0.35rem', borderRadius: '6px' }}>
                <HelpCircle size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Questions</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0f172a' }}>{stats.total}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: '#ecfdf5', color: '#10b981', padding: '0.35rem', borderRadius: '6px' }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Answered</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#059669' }}>{stats.answered}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.35rem', borderRadius: '6px' }}>
                <AlertCircle size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Unanswered</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#dc2626' }}>{stats.unanswered}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: '#f5f3ff', color: '#8b5cf6', padding: '0.35rem', borderRadius: '6px' }}>
                <Bookmark size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Marked for Review</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#6d28d9' }}>{stats.review}</div>
              </div>
            </div>
          </div>

          {stats.unanswered > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '0.6rem 0.85rem',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              color: '#92400e'
            }}>
              Notice: You still have <strong>{stats.unanswered} unanswered</strong> questions.
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Continue Exam
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-primary"
            style={{ backgroundColor: '#0f172a', borderColor: '#0f172a' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Yes, Submit Examination'}
          </button>
        </div>
      </div>
    </div>
  );
}
