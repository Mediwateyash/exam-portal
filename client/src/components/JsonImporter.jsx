import React, { useState } from 'react';
import { api } from '../services/api';
import { 
  FileJson, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Eye, 
  Download, 
  Upload, 
  Code, 
  HelpCircle, 
  FileText 
} from 'lucide-react';

const SAMPLE_JSON_TEMPLATE = `{
  "module": {
    "title": "JavaScript Fundamentals",
    "questions": [
      {
        "type": "theory",
        "question": "Explain the difference between let, var and const in JavaScript.",
        "wordLimit": 150,
        "marks": 10
      },
      {
        "type": "mcq",
        "question": "Which keyword is used to declare a constant in JavaScript?",
        "options": [
          "var",
          "let",
          "const",
          "static"
        ],
        "correctAnswer": "const",
        "marks": 2
      },
      {
        "type": "coding",
        "question": "Write a JavaScript program to reverse a string.",
        "inputDescription": "A single string.",
        "outputDescription": "Print the reversed string.",
        "constraints": "String length should be between 1 and 1000.",
        "sampleInput": "hello",
        "sampleOutput": "olleh",
        "marks": 10
      }
    ]
  }
}`;

export default function JsonImporter({ moduleId, moduleTitle, onClose, onImportSuccess }) {
  const [jsonString, setJsonString] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'

  const handleLoadSample = () => {
    setJsonString(SAMPLE_JSON_TEMPLATE);
    setError(null);
    setErrorDetails([]);
    setPreviewData(null);
  };

  const handleValidateAndPreview = async () => {
    if (!jsonString.trim()) {
      setError('Please enter or paste JSON questions data.');
      return;
    }

    setLoading(true);
    setError(null);
    setErrorDetails([]);

    try {
      const res = await api.importQuestionsJson(moduleId, jsonString, true);
      setPreviewData(res);
      setActiveTab('preview');
    } catch (err) {
      setError(err.message || 'JSON Validation Error');
      setErrorDetails(err.details || []);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalImport = async () => {
    setLoading(true);
    setError(null);
    setErrorDetails([]);

    try {
      const res = await api.importQuestionsJson(moduleId, jsonString, false);
      if (onImportSuccess) {
        onImportSuccess(res);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to import questions');
      setErrorDetails(err.details || []);
      setActiveTab('editor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '850px', width: '95%' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              background: '#eff6ff',
              color: '#2563eb',
              padding: '0.4rem',
              borderRadius: '8px'
            }}>
              <FileJson size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Import Questions from JSON</h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                Module: <strong>{moduleTitle}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem', border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 1.5rem',
          background: '#f8fafc',
          gap: '1rem'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            style={{
              padding: '0.75rem 0.5rem',
              border: 'none',
              background: 'transparent',
              fontWeight: '600',
              fontSize: '0.875rem',
              color: activeTab === 'editor' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'editor' ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Code size={16} />
            JSON Editor
          </button>
          <button
            type="button"
            onClick={() => {
              if (!previewData) {
                handleValidateAndPreview();
              } else {
                setActiveTab('preview');
              }
            }}
            style={{
              padding: '0.75rem 0.5rem',
              border: 'none',
              background: 'transparent',
              fontWeight: '600',
              fontSize: '0.875rem',
              color: activeTab === 'preview' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'preview' ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Eye size={16} />
            Preview Questions {previewData?.summary?.total ? `(${previewData.summary.total})` : ''}
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ maxHeight: '60vh' }}>
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>{error}</strong>
                {errorDetails.length > 0 && (
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.8125rem' }}>
                    {errorDetails.map((det, i) => (
                      <li key={i}>{det}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {activeTab === 'editor' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="form-label" style={{ margin: 0 }}>Paste Questions JSON</span>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="btn btn-outline-primary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                >
                  <Download size={13} />
                  Load Sample JSON Template
                </button>
              </div>

              <textarea
                value={jsonString}
                onChange={(e) => {
                  setJsonString(e.target.value);
                  setError(null);
                  setErrorDetails([]);
                }}
                placeholder={`Paste your questions JSON here...\n\n{\n  "module": {\n    "title": "Module Name",\n    "questions": [ ... ]\n  }\n}`}
                className="form-textarea"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.875rem',
                  minHeight: '280px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  border: '1px solid #334155'
                }}
                spellCheck={false}
              />

              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                Supports <code>theory</code>, <code>mcq</code>, and <code>coding</code> question types with full automatic validation.
              </div>
            </div>
          ) : (
            <div>
              {previewData ? (
                <div>
                  {/* Summary Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '8px',
                    marginBottom: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857', fontWeight: '700', fontSize: '0.875rem' }}>
                      <CheckCircle2 size={18} />
                      <span>JSON Validated Successfully</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8125rem' }}>
                      <span className="badge badge-primary">Theory: {previewData.summary.theory}</span>
                      <span className="badge badge-success">MCQ: {previewData.summary.mcq}</span>
                      <span className="badge badge-purple">Coding: {previewData.summary.coding}</span>
                      <span className="badge badge-secondary">Total Marks: {previewData.summary.totalMarks}</span>
                    </div>
                  </div>

                  {/* Question Cards List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {previewData.preview.map((q, idx) => (
                      <div key={idx} className="card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: '700', color: '#0f172a' }}>#{idx + 1}</span>
                            <span className={`badge ${
                              q.type === 'theory' ? 'badge-primary' :
                              q.type === 'mcq' ? 'badge-success' : 'badge-purple'
                            }`}>
                              {q.type.toUpperCase()}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#2563eb' }}>
                            {q.marks} Marks
                          </span>
                        </div>

                        <p style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                          {q.question}
                        </p>

                        {q.type === 'theory' && (
                          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                            Word Limit: <strong>{q.wordLimit} words</strong>
                          </div>
                        )}

                        {q.type === 'mcq' && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.25rem' }}>Options:</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                              {q.options.map((opt, oIdx) => (
                                <div
                                  key={oIdx}
                                  style={{
                                    padding: '0.35rem 0.6rem',
                                    borderRadius: '4px',
                                    fontSize: '0.8125rem',
                                    background: opt === q.correctAnswer ? '#ecfdf5' : '#f8fafc',
                                    border: opt === q.correctAnswer ? '1px solid #10b981' : '1px solid #e2e8f0',
                                    color: opt === q.correctAnswer ? '#047857' : '#334155',
                                    fontWeight: opt === q.correctAnswer ? '700' : '500'
                                  }}
                                >
                                  {String.fromCharCode(65 + oIdx)}. {opt} {opt === q.correctAnswer && '✓ (Correct)'}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {q.type === 'coding' && q.codingDetails && (
                          <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '4px', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                            {q.codingDetails.inputDescription && <div><strong>Input:</strong> {q.codingDetails.inputDescription}</div>}
                            {q.codingDetails.outputDescription && <div><strong>Output:</strong> {q.codingDetails.outputDescription}</div>}
                            {q.codingDetails.sampleInput && <div><strong>Sample:</strong> <code>{q.codingDetails.sampleInput}</code> → <code>{q.codingDetails.sampleOutput}</code></div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <Eye className="empty-icon" />
                  <div className="empty-title">No preview available yet</div>
                  <div className="empty-description">Enter your JSON questions above and click "Validate & Preview" to inspect the structured questions.</div>
                  <button onClick={() => setActiveTab('editor')} className="btn btn-secondary btn-sm">
                    Go back to editor
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>

          {activeTab === 'editor' ? (
            <button
              type="button"
              onClick={handleValidateAndPreview}
              className="btn btn-outline-primary"
              disabled={loading || !jsonString.trim()}
            >
              <Eye size={16} />
              {loading ? 'Validating...' : 'Validate & Preview'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Back to JSON
            </button>
          )}

          <button
            type="button"
            onClick={handleFinalImport}
            className="btn btn-primary"
            disabled={loading || !jsonString.trim()}
          >
            <Upload size={16} />
            {loading ? 'Importing...' : 'Import to Module'}
          </button>
        </div>
      </div>
    </div>
  );
}
