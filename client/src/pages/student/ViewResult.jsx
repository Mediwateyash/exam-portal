import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import CodeEditor from '../../components/CodeEditor';
import { 
  ArrowLeft, 
  Award, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  FileText, 
  AlertCircle,
  MessageSquare,
  XCircle
} from 'lucide-react';

export default function ViewResult() {
  const { submissionId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadResult() {
      try {
        const res = await api.getStudentResultDetail(submissionId);
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load detailed scorecard.');
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [submissionId]);

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
        <p>Loading detailed score breakdown...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const sub = data?.submission || {};
  const answers = data?.answers || [];

  const isGraded = sub.status === 'graded';
  const isPassed = sub.isPassed;

  return (
    <div className="main-content" style={{ maxWidth: '960px' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/student/results"
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
          <ArrowLeft size={16} /> Back to Results History
        </Link>

        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className={`badge ${
                isGraded ? (isPassed ? 'badge-success' : 'badge-danger') : 'badge-warning'
              }`}>
                {isGraded ? (isPassed ? 'Passed' : 'Below Passing Marks') : 'Pending Theory Review'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#0f172a' }}>
              {sub.exam_title}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9375rem', marginTop: '0.2rem' }}>
              Submitted on {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Scorecard Hero Banner */}
      <div className="card" style={{
        padding: '2rem',
        marginBottom: '2rem',
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.5rem',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Your Score</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.1' }}>
              {sub.score} <span style={{ fontSize: '1.125rem', color: '#64748b' }}>/ {sub.total_marks}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Percentage</div>
            <div style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: isGraded ? (isPassed ? '#059669' : '#dc2626') : '#d97706',
              lineHeight: '1.1'
            }}>
              {sub.percentage}%
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Passing Requirement</div>
            <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#334155' }}>
              {sub.passing_marks} Marks ({((sub.passing_marks / sub.total_marks) * 100).toFixed(0)}%)
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Evaluation Status</div>
            <div style={{ fontSize: '0.9375rem', fontWeight: '700', color: isGraded ? '#059669' : '#d97706' }}>
              {isGraded ? '✓ Complete & Verified' : '⏳ Theory Review Pending'}
            </div>
          </div>
        </div>
      </div>

      {/* Answer Sheet Review List */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
        Submitted Question Breakdown & Feedback
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {answers.map((item, idx) => (
          <div
            key={item.questionId}
            className="card"
            style={{
              padding: '1.5rem',
              border: '1.5px solid #e2e8f0',
              borderLeft: item.type === 'theory' ? '5px solid #2563eb' : item.type === 'coding' ? '5px solid #8b5cf6' : '5px solid #10b981'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: '800', fontSize: '1rem', color: '#0f172a' }}>Question {idx + 1}</span>
                  <span className={`badge ${
                    item.type === 'theory' ? 'badge-primary' :
                    item.type === 'mcq' ? 'badge-success' : 'badge-purple'
                  }`}>
                    {item.type.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>• Module: {item.moduleTitle}</span>
                </div>
                <div style={{
                  fontFamily: 'Merriweather, Georgia, serif',
                  fontSize: '1.05rem',
                  color: '#0f172a',
                  lineHeight: '1.5'
                }}>
                  {item.question}
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: '800',
                color: item.marksObtained > 0 ? '#059669' : '#334155',
                whiteSpace: 'nowrap'
              }}>
                Score: {item.marksObtained} / {item.maxMarks}
              </div>
            </div>

            {/* Answer Display */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              margin: '1rem 0'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Your Answer:
              </div>

              {/* Theory Answer */}
              {item.type === 'theory' && (
                <div>
                  <div style={{
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.9375rem',
                    lineHeight: '1.6',
                    color: item.answer ? '#0f172a' : '#94a3b8',
                    fontStyle: item.answer ? 'normal' : 'italic'
                  }}>
                    {item.answer || '(No answer provided)'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                    Word Count: {item.wordCount || (item.answer ? item.answer.trim().split(/\s+/).filter(Boolean).length : 0)} / {item.wordLimit} words
                  </div>
                </div>
              )}

              {/* MCQ Answer */}
              {item.type === 'mcq' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
                    {item.options.map((opt, oIdx) => {
                      const isStudentChoice = String(item.answer).trim().toLowerCase() === String(opt).trim().toLowerCase();
                      const isCorrectOption = item.correctAnswer && String(item.correctAnswer).trim().toLowerCase() === String(opt).trim().toLowerCase();

                      let optBg = '#ffffff';
                      let optBorder = '#e2e8f0';
                      let optColor = '#334155';

                      if (isCorrectOption) {
                        optBg = '#ecfdf5';
                        optBorder = '#10b981';
                        optColor = '#047857';
                      } else if (isStudentChoice && !isCorrectOption) {
                        optBg = '#fef2f2';
                        optBorder = '#ef4444';
                        optColor = '#b91c1c';
                      }

                      return (
                        <div
                          key={oIdx}
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            background: optBg,
                            border: `1.5px solid ${optBorder}`,
                            color: optColor,
                            fontSize: '0.875rem',
                            fontWeight: isStudentChoice || isCorrectOption ? '700' : '500',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                          {isStudentChoice && <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>Your Pick</span>}
                          {isCorrectOption && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Correct Answer</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Coding Answer */}
              {item.type === 'coding' && (
                <div>
                  {item.answer ? (
                    <CodeEditor
                      value={item.answer}
                      language={item.language || 'javascript'}
                      readOnly={true}
                      minHeight="200px"
                    />
                  ) : (
                    <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.875rem' }}>
                      (No code submitted)
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Teacher Remarks Feedback Box */}
            {item.teacherRemarks && (
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem'
              }}>
                <MessageSquare size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1e40af', textTransform: 'uppercase' }}>
                    Evaluator Feedback & Remarks:
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#1e3a8a', marginTop: '0.15rem' }}>
                    {item.teacherRemarks}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
