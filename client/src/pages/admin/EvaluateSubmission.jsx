import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import CodeEditor from '../../components/CodeEditor';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Award, 
  Clock, 
  User, 
  HelpCircle, 
  Code, 
  Save, 
  AlertCircle,
  FileText
} from 'lucide-react';

export default function EvaluateSubmission() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [submissionData, setSubmissionData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [evaluations, setEvaluations] = useState({}); // { [qId]: { marksObtained, teacherRemarks } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [error, setError] = useState('');

  const loadSubmission = async () => {
    try {
      const res = await api.getSubmissionDetails(id);
      setSubmissionData(res.submission);
      setAnswers(res.answers || []);

      // Pre-fill existing evaluations
      const initialEvals = {};
      (res.answers || []).forEach(item => {
        initialEvals[item.questionId] = {
          marksObtained: item.marksObtained !== null && item.marksObtained !== undefined ? item.marksObtained : (item.type === 'mcq' ? item.marksObtained : 0),
          teacherRemarks: item.teacherRemarks || ''
        };
      });
      setEvaluations(initialEvals);
    } catch (err) {
      setError(err.message || 'Failed to load candidate submission.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmission();
  }, [id]);

  const handleMarkChange = (qId, maxMarks, val) => {
    const num = Math.min(maxMarks, Math.max(0, parseFloat(val) || 0));
    setEvaluations(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        marksObtained: num
      }
    }));
  };

  const handleRemarksChange = (qId, val) => {
    setEvaluations(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        teacherRemarks: val
      }
    }));
  };

  // Calculate live total marks from evaluations
  const currentTotalScore = answers.reduce((sum, item) => {
    const qId = item.questionId;
    const ev = evaluations[qId];
    if (ev && ev.marksObtained !== undefined) {
      return sum + Number(ev.marksObtained);
    }
    return sum + (item.marksObtained || 0);
  }, 0);

  const totalPossible = submissionData?.total_marks || answers.reduce((sum, item) => sum + item.maxMarks, 0) || 100;
  const currentPercentage = totalPossible > 0 ? ((currentTotalScore / totalPossible) * 100).toFixed(2) : 0;

  const handleSaveEvaluation = async () => {
    setSaving(true);
    setSaveSuccess('');
    setError('');

    try {
      const evalList = Object.keys(evaluations).map(qId => ({
        questionId: parseInt(qId, 10),
        marksObtained: evaluations[qId].marksObtained,
        teacherRemarks: evaluations[qId].teacherRemarks
      }));

      const res = await api.evaluateSubmission(id, evalList);
      setSaveSuccess('Evaluation and grading published successfully!');
      setSubmissionData(res.submission);
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save evaluation.');
    } finally {
      setSaving(false);
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
        <p>Loading candidate answers for evaluation...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const sub = submissionData || {};

  return (
    <div className="main-content" style={{ maxWidth: '1000px' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/admin/submissions"
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
          <ArrowLeft size={16} /> Back to Submissions
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
              <span className={`badge ${sub.status === 'graded' ? 'badge-success' : 'badge-warning'}`}>
                {sub.status === 'graded' ? 'Graded' : 'Pending Theory Review'}
              </span>
              <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Submission ID: #{sub.id}</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>
              Evaluate Answer Sheet: {sub.student_name}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9375rem', marginTop: '0.2rem' }}>
              Exam: <strong>{sub.exam_title}</strong> • Student: <strong>{sub.student_email}</strong>
            </p>
          </div>

          {/* Action Save Button */}
          <button
            type="button"
            onClick={handleSaveEvaluation}
            disabled={saving}
            className="btn btn-primary btn-lg"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save & Publish Evaluation'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{saveSuccess}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Score Summary Floating Card */}
      <div className="card" style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Candidate Score</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>
              {currentTotalScore} / {totalPossible}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Percentage</div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              color: currentTotalScore >= (sub.passing_marks || 40) ? '#059669' : '#b91c1c'
            }}>
              {currentPercentage}%
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Passing Requirement</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#334155' }}>
              {sub.passing_marks || 40} Marks ({((sub.passing_marks || 40) / totalPossible * 100).toFixed(0)}%)
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Submitted At</div>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>
              {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'In Progress'}
            </div>
          </div>
        </div>
      </div>

      {/* Questions Answers List for Grading */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {answers.map((item, idx) => {
          const qId = item.questionId;
          const userEval = evaluations[qId] || { marksObtained: 0, teacherRemarks: '' };

          return (
            <div
              key={qId}
              className="card"
              style={{
                border: '1.5px solid #e2e8f0',
                padding: '1.5rem',
                borderLeft: item.type === 'theory' ? '5px solid #2563eb' : item.type === 'coding' ? '5px solid #8b5cf6' : '5px solid #10b981'
              }}
            >
              {/* Question Header */}
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
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  color: '#334155',
                  whiteSpace: 'nowrap'
                }}>
                  Max: {item.maxMarks} Marks
                </div>
              </div>

              {/* STUDENT ANSWER DISPLAY */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem 1.25rem',
                margin: '1rem 0'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Student Submitted Answer:
                </div>

                {/* Theory Answer Display */}
                {item.type === 'theory' && (
                  <div>
                    <div style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.9375rem',
                      lineHeight: '1.6',
                      color: item.answer ? '#0f172a' : '#94a3b8',
                      fontStyle: item.answer ? 'normal' : 'italic'
                    }}>
                      {item.answer || '(No answer provided by candidate)'}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginTop: '0.75rem',
                      fontSize: '0.8125rem',
                      color: '#475569'
                    }}>
                      <span className="badge badge-secondary">
                        Word Count: {item.wordCount || (item.answer ? item.answer.trim().split(/\s+/).filter(Boolean).length : 0)} / {item.wordLimit || 150} words
                      </span>
                    </div>
                  </div>
                )}

                {/* MCQ Answer Display */}
                {item.type === 'mcq' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {item.options.map((opt, oIdx) => {
                        const isStudentChoice = String(item.answer).trim().toLowerCase() === String(opt).trim().toLowerCase();
                        const isCorrectOption = String(item.correctAnswer).trim().toLowerCase() === String(opt).trim().toLowerCase();

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
                            {isStudentChoice && (
                              <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>Selected</span>
                            )}
                            {isCorrectOption && (
                              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Correct</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: item.marksObtained > 0 ? '#059669' : '#dc2626', fontWeight: '700' }}>
                      {item.marksObtained > 0 ? '✓ Evaluated Correct (+ ' + item.marksObtained + ' marks)' : '✗ Incorrect (0 marks)'}
                    </div>
                  </div>
                )}

                {/* Coding Answer Display */}
                {item.type === 'coding' && (
                  <div>
                    {item.answer ? (
                      <CodeEditor
                        value={item.answer}
                        language={item.language || 'javascript'}
                        readOnly={true}
                        minHeight="220px"
                      />
                    ) : (
                      <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.875rem' }}>
                        (No code submitted by candidate)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* TEACHER EVALUATION BOX */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '1rem',
                display: 'grid',
                gridTemplateColumns: '140px 1fr',
                gap: '1rem',
                alignItems: 'start'
              }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem' }}>
                    Marks Awarded
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={item.maxMarks}
                      value={userEval.marksObtained !== undefined ? userEval.marksObtained : 0}
                      onChange={(e) => handleMarkChange(qId, item.maxMarks, e.target.value)}
                      className="form-input"
                      style={{ fontWeight: '700', fontSize: '1rem' }}
                    />
                    <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>/ {item.maxMarks}</span>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem' }}>
                    Teacher Remarks / Feedback
                  </label>
                  <input
                    type="text"
                    value={userEval.teacherRemarks || ''}
                    onChange={(e) => handleRemarksChange(qId, e.target.value)}
                    placeholder="e.g. Good explanation with clear code examples..."
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Save Bar */}
      <div style={{
        marginTop: '2rem',
        padding: '1.25rem 1.5rem',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0f172a' }}>
            Final Grade: {currentTotalScore} / {totalPossible} ({currentPercentage}%)
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Status: {currentTotalScore >= (sub.passing_marks || 40) ? 'Passing Grade' : 'Below Passing Marks'}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveEvaluation}
          disabled={saving}
          className="btn btn-primary btn-lg"
        >
          <Save size={18} />
          {saving ? 'Publishing Evaluation...' : 'Save & Publish Evaluation'}
        </button>
      </div>
    </div>
  );
}
