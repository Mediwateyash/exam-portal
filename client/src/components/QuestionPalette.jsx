import React from 'react';
import { Bookmark, CheckCircle2, Circle, AlertCircle, HelpCircle } from 'lucide-react';

export default function QuestionPalette({
  questions = [],
  currentIndex = 0,
  onSelectQuestion,
  answers = {},
  markedForReview = {},
  onSubmitClick
}) {
  const answeredCount = Object.keys(answers).filter(k => {
    const val = answers[k];
    if (typeof val === 'string') return val.trim().length > 0;
    if (val && typeof val === 'object' && val.answer !== undefined) {
      return String(val.answer).trim().length > 0;
    }
    return false;
  }).length;

  const reviewCount = Object.keys(markedForReview).filter(k => markedForReview[k]).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  return (
    <div className="palette-sidebar">
      {/* Header */}
      <div className="palette-header">
        <div className="palette-title">QUESTION PALETTE</div>
        <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
          {answeredCount} / {questions.length} Attempted
        </span>
      </div>

      {/* Status Legend */}
      <div className="palette-legend">
        <div className="legend-item">
          <span className="legend-dot dot-answered" />
          <span>Answered ({answeredCount})</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-unanswered" />
          <span>Unanswered ({unansweredCount})</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-review" />
          <span>Review ({reviewCount})</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-current" />
          <span>Current</span>
        </div>
      </div>

      {/* Grid of question buttons */}
      <div className="palette-grid">
        {questions.map((q, idx) => {
          const qId = q.id;
          const isCurrent = idx === currentIndex;
          const isReview = !!markedForReview[qId];
          const rawAns = answers[qId];
          const isAnswered = rawAns && (
            (typeof rawAns === 'string' && rawAns.trim().length > 0) ||
            (rawAns.answer && String(rawAns.answer).trim().length > 0)
          );

          let btnClass = 'palette-btn';
          if (isCurrent) btnClass += ' btn-current';
          if (isAnswered) btnClass += ' btn-answered';
          if (isReview) btnClass += ' btn-review';

          return (
            <button
              key={qId}
              type="button"
              onClick={() => onSelectQuestion(idx)}
              className={btnClass}
              title={`Question ${idx + 1} (${q.type.toUpperCase()}) - ${isAnswered ? 'Answered' : 'Unanswered'}${isReview ? ' [Marked for Review]' : ''}`}
            >
              {idx + 1}
              {isReview && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#8b5cf6'
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Submit Button Trigger */}
      {onSubmitClick && (
        <div className="palette-footer">
          <button
            type="button"
            onClick={onSubmitClick}
            className="btn btn-primary"
            style={{
              width: '100%',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              borderColor: '#0f172a',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)'
            }}
          >
            <CheckCircle2 size={16} />
            Submit Examination
          </button>
        </div>
      )}
    </div>
  );
}
