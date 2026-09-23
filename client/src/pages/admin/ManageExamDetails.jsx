import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import JsonImporter from '../../components/JsonImporter';
import { 
  ArrowLeft, 
  Layers, 
  PlusCircle, 
  FileJson, 
  Plus, 
  Trash2, 
  Edit3, 
  Clock, 
  Award, 
  Users, 
  CheckCircle2, 
  HelpCircle, 
  Code, 
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';

export default function ManageExamDetails() {
  const { id } = useParams();
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('modules'); // 'modules' | 'students'

  // Modals state
  const [importTargetModule, setImportTargetModule] = useState(null);
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(null); // moduleId
  const [collapsedModules, setCollapsedModules] = useState({});

  // Add Module Form
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');
  const [newModuleOrder, setNewModuleOrder] = useState(1);

  // Manual Question Form
  const [manualQType, setManualQType] = useState('theory');
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualMarks, setManualMarks] = useState(10);
  const [manualWordLimit, setManualWordLimit] = useState(150);
  const [manualOptions, setManualOptions] = useState(['', '', '', '']);
  const [manualCorrectAnswer, setManualCorrectAnswer] = useState('');
  const [manualCoding, setManualCoding] = useState({
    inputDescription: '',
    outputDescription: '',
    constraints: '',
    sampleInput: '',
    sampleOutput: ''
  });

  const loadExam = async () => {
    try {
      const res = await api.getExamDetails(id);
      setExamData(res.exam);
      if (res.exam?.modules) {
        setNewModuleOrder((res.exam.modules.length || 0) + 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to load exam details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExam();
  }, [id]);

  const toggleModuleCollapse = (modId) => {
    setCollapsedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    try {
      await api.addModule(id, {
        title: newModuleTitle.trim(),
        description: newModuleDesc.trim(),
        order_num: newModuleOrder
      });
      setShowAddModuleModal(false);
      setNewModuleTitle('');
      setNewModuleDesc('');
      await loadExam();
    } catch (err) {
      alert(err.message || 'Failed to add module.');
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Delete this module and all of its questions?')) return;
    try {
      await api.deleteModule(moduleId);
      await loadExam();
    } catch (err) {
      alert(err.message || 'Failed to delete module.');
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.deleteQuestion(qId);
      await loadExam();
    } catch (err) {
      alert(err.message || 'Failed to delete question.');
    }
  };

  const handleSaveManualQuestion = async (e) => {
    e.preventDefault();
    if (!showAddQuestionModal || !manualQuestion.trim()) return;

    try {
      await api.addQuestion({
        moduleId: showAddQuestionModal,
        type: manualQType,
        question: manualQuestion.trim(),
        marks: manualMarks,
        wordLimit: manualWordLimit,
        options: manualQType === 'mcq' ? manualOptions.filter(o => o.trim()) : null,
        correctAnswer: manualQType === 'mcq' ? manualCorrectAnswer : null,
        codingDetails: manualQType === 'coding' ? manualCoding : null
      });

      setShowAddQuestionModal(null);
      setManualQuestion('');
      setManualMarks(10);
      setManualOptions(['', '', '', '']);
      setManualCorrectAnswer('');
      setManualCoding({ inputDescription: '', outputDescription: '', constraints: '', sampleInput: '', sampleOutput: '' });
      await loadExam();
    } catch (err) {
      alert(err.message || 'Failed to add question.');
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
        <p>Loading examination manager...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const exam = examData || {};
  const modules = exam.modules || [];
  const registeredStudents = exam.registeredStudents || [];

  const totalQuestions = modules.reduce((acc, m) => acc + (m.questions?.length || 0), 0);
  const totalModuleMarks = modules.reduce((acc, m) => {
    return acc + (m.questions || []).reduce((qAcc, q) => qAcc + (q.marks || 0), 0);
  }, 0);

  return (
    <div className="main-content">
      {/* Top Breadcrumb & Actions */}
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
          <ArrowLeft size={16} /> Back to All Exams
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
              <span className={`badge ${exam.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                {exam.status}
              </span>
              <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Exam ID: #{exam.id}</span>
            </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#0f172a' }}>
              {exam.title}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9375rem', maxWidth: '800px', marginTop: '0.25rem' }}>
              {exam.description || 'No description provided.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setShowAddModuleModal(true)}
              className="btn btn-primary"
            >
              <PlusCircle size={18} />
              Add Module
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Exam Specs Strip */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', background: '#ffffff' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1.25rem',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Duration</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={18} color="#2563eb" /> {exam.duration} mins
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Target Total Marks</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Award size={18} color="#059669" /> {exam.total_marks} Marks
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Questions Added</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
              {totalQuestions} Questions ({totalModuleMarks} pts)
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Total Modules</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
              {modules.length} Modules
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Registrations</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Users size={18} color="#7c3aed" /> {registeredStudents.length} Students
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '1.75rem',
        gap: '1.5rem'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('modules')}
          style={{
            padding: '0.75rem 0.25rem',
            border: 'none',
            background: 'transparent',
            fontWeight: '700',
            fontSize: '1rem',
            color: activeTab === 'modules' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'modules' ? '2.5px solid #2563eb' : '2.5px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Layers size={18} />
          Modules & Question Bank ({modules.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('students')}
          style={{
            padding: '0.75rem 0.25rem',
            border: 'none',
            background: 'transparent',
            fontWeight: '700',
            fontSize: '1rem',
            color: activeTab === 'students' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'students' ? '2.5px solid #2563eb' : '2.5px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Users size={18} />
          Registered Students ({registeredStudents.length})
        </button>
      </div>

      {/* TAB 1: MODULES & QUESTIONS */}
      {activeTab === 'modules' && (
        <div>
          {modules.length === 0 ? (
            <div className="empty-state">
              <Layers className="empty-icon" />
              <div className="empty-title">No modules created yet</div>
              <div className="empty-description">
                Organize your exam by adding modules (e.g., JavaScript, React, System Design) and import questions using JSON.
              </div>
              <button
                type="button"
                onClick={() => setShowAddModuleModal(true)}
                className="btn btn-primary btn-sm"
              >
                <PlusCircle size={16} />
                Add First Module
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {modules.map((mod, index) => {
                const isCollapsed = !!collapsedModules[mod.id];
                const questions = mod.questions || [];

                return (
                  <div key={mod.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Module Card Header */}
                    <div style={{
                      padding: '1.25rem 1.5rem',
                      background: '#f8fafc',
                      borderBottom: isCollapsed ? 'none' : '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => toggleModuleCollapse(mod.id)}>
                        <button
                          type="button"
                          style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', padding: 0 }}
                        >
                          {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                        </button>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                              Module {index + 1}
                            </span>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0f172a' }}>
                              {mod.title}
                            </h3>
                          </div>
                          {mod.description && (
                            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.15rem' }}>
                              {mod.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Module Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setImportTargetModule(mod)}
                          className="btn btn-outline-primary btn-sm"
                          title="Import Questions via JSON"
                        >
                          <FileJson size={15} />
                          Import Questions JSON
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowAddQuestionModal(mod.id)}
                          className="btn btn-secondary btn-sm"
                          title="Add single question manually"
                        >
                          <Plus size={15} />
                          Add Question
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteModule(mod.id)}
                          className="btn btn-outline-danger btn-sm"
                          style={{ padding: '0.35rem 0.5rem' }}
                          title="Delete Module"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Questions List Inside Module */}
                    {!isCollapsed && (
                      <div style={{ padding: '1.25rem 1.5rem' }}>
                        {questions.length === 0 ? (
                          <div style={{
                            textAlign: 'center',
                            padding: '2rem 1rem',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px dashed #cbd5e1'
                          }}>
                            <FileText size={32} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
                            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>
                              No questions in this module yet.
                            </p>
                            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1rem' }}>
                              Import questions via JSON or add them manually.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                              <button
                                type="button"
                                onClick={() => setImportTargetModule(mod)}
                                className="btn btn-primary btn-sm"
                              >
                                <FileJson size={14} />
                                Import JSON
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowAddQuestionModal(mod.id)}
                                className="btn btn-secondary btn-sm"
                              >
                                <Plus size={14} />
                                Add Question
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {questions.map((q, qIdx) => (
                              <div
                                key={q.id}
                                style={{
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  padding: '1rem 1.25rem',
                                  background: '#ffffff',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  gap: '1rem'
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                    <span style={{ fontWeight: '700', fontSize: '0.875rem', color: '#0f172a' }}>
                                      Q{qIdx + 1}.
                                    </span>
                                    <span className={`badge ${
                                      q.type === 'theory' ? 'badge-primary' :
                                      q.type === 'mcq' ? 'badge-success' : 'badge-purple'
                                    }`}>
                                      {q.type.toUpperCase()}
                                    </span>
                                    <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#2563eb' }}>
                                      {q.marks} Marks
                                    </span>
                                    {q.type === 'theory' && q.word_limit && (
                                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        • Word Limit: {q.word_limit} words
                                      </span>
                                    )}
                                  </div>

                                  <div style={{
                                    fontFamily: 'Merriweather, Georgia, serif',
                                    fontSize: '0.95rem',
                                    color: '#1e293b',
                                    lineHeight: '1.5',
                                    marginBottom: '0.5rem'
                                  }}>
                                    {q.question}
                                  </div>

                                  {/* MCQ Options Display */}
                                  {q.type === 'mcq' && q.options && q.options.length > 0 && (
                                    <div style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                      gap: '0.4rem',
                                      marginTop: '0.5rem'
                                    }}>
                                      {q.options.map((opt, oIdx) => (
                                        <div
                                          key={oIdx}
                                          style={{
                                            padding: '0.35rem 0.6rem',
                                            borderRadius: '4px',
                                            fontSize: '0.8125rem',
                                            background: opt === q.correct_answer ? '#ecfdf5' : '#f8fafc',
                                            border: opt === q.correct_answer ? '1px solid #10b981' : '1px solid #e2e8f0',
                                            color: opt === q.correct_answer ? '#047857' : '#334155',
                                            fontWeight: opt === q.correct_answer ? '700' : '500'
                                          }}
                                        >
                                          {String.fromCharCode(65 + oIdx)}. {opt} {opt === q.correct_answer && '✓ (Correct)'}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Coding Details Display */}
                                  {q.type === 'coding' && q.coding_details && (
                                    <div style={{
                                      background: '#f8fafc',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '6px',
                                      padding: '0.6rem 0.85rem',
                                      fontSize: '0.8125rem',
                                      marginTop: '0.5rem'
                                    }}>
                                      {q.coding_details.inputDescription && (
                                        <div><strong>Input:</strong> {q.coding_details.inputDescription}</div>
                                      )}
                                      {q.coding_details.outputDescription && (
                                        <div><strong>Output:</strong> {q.coding_details.outputDescription}</div>
                                      )}
                                      {q.coding_details.sampleInput && (
                                        <div style={{ marginTop: '0.35rem' }}>
                                          <strong>Sample I/O:</strong> <code>{q.coding_details.sampleInput}</code> → <code>{q.coding_details.sampleOutput}</code>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.35rem', color: '#ef4444' }}
                                  title="Delete Question"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REGISTERED STUDENTS */}
      {activeTab === 'students' && (
        <div className="card" style={{ padding: 0 }}>
          {registeredStudents.length === 0 ? (
            <div className="empty-state">
              <Users className="empty-icon" />
              <div className="empty-title">No students registered yet</div>
              <div className="empty-description">When students register for this exam from their dashboard, their names and enrollment records will appear here.</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email Address</th>
                    <th>Registered At</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredStudents.map((st) => (
                    <tr key={st.registration_id}>
                      <td style={{ fontWeight: '700', color: '#0f172a' }}>{st.name}</td>
                      <td>{st.email}</td>
                      <td>{new Date(st.registered_at).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${
                          st.status === 'completed' ? 'badge-success' :
                          st.status === 'in_progress' ? 'badge-purple' : 'badge-primary'
                        }`}>
                          {st.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Module Modal */}
      {showAddModuleModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Add Module to Examination</h3>
            </div>
            <form onSubmit={handleCreateModule}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Module Title <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder="e.g. JavaScript Fundamentals & Closures"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Module Description</label>
                  <textarea
                    value={newModuleDesc}
                    onChange={(e) => setNewModuleDesc(e.target.value)}
                    placeholder="Topics covered in this module..."
                    className="form-textarea"
                    style={{ minHeight: '80px' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Order / Position</label>
                  <input
                    type="number"
                    value={newModuleOrder}
                    onChange={(e) => setNewModuleOrder(parseInt(e.target.value, 10))}
                    className="form-input"
                    min="1"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddModuleModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JSON Question Importer Modal */}
      {importTargetModule && (
        <JsonImporter
          moduleId={importTargetModule.id}
          moduleTitle={importTargetModule.title}
          onClose={() => setImportTargetModule(null)}
          onImportSuccess={() => loadExam()}
        />
      )}

      {/* Manual Add Question Modal */}
      {showAddQuestionModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Add Question Manually</h3>
            </div>
            <form onSubmit={handleSaveManualQuestion}>
              <div className="modal-body">
                <div className="grid-2" style={{ marginBottom: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Question Type</label>
                    <select
                      value={manualQType}
                      onChange={(e) => setManualQType(e.target.value)}
                      className="form-select"
                    >
                      <option value="theory">Theory (Text answer with word limit)</option>
                      <option value="mcq">MCQ (Multiple Choice Questions)</option>
                      <option value="coding">Coding (Code Editor Problem)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Marks Allocated</label>
                    <input
                      type="number"
                      value={manualMarks}
                      onChange={(e) => setManualMarks(parseInt(e.target.value, 10))}
                      className="form-input"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Question Text / Statement</label>
                  <textarea
                    value={manualQuestion}
                    onChange={(e) => setManualQuestion(e.target.value)}
                    placeholder="Enter the complete question prompt..."
                    className="form-textarea"
                    style={{ minHeight: '90px' }}
                    required
                  />
                </div>

                {manualQType === 'theory' && (
                  <div className="form-group">
                    <label className="form-label">Required Word Limit</label>
                    <input
                      type="number"
                      value={manualWordLimit}
                      onChange={(e) => setManualWordLimit(parseInt(e.target.value, 10))}
                      className="form-input"
                      min="20"
                    />
                  </div>
                )}

                {manualQType === 'mcq' && (
                  <div>
                    <label className="form-label">Options (A, B, C, D)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                      {manualOptions.map((opt, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const copy = [...manualOptions];
                            copy[idx] = e.target.value;
                            setManualOptions(copy);
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          className="form-input"
                          required
                        />
                      ))}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Exact Correct Answer</label>
                      <select
                        value={manualCorrectAnswer}
                        onChange={(e) => setManualCorrectAnswer(e.target.value)}
                        className="form-select"
                        required
                      >
                        <option value="">-- Select Correct Option --</option>
                        {manualOptions.filter(o => o.trim()).map((opt, idx) => (
                          <option key={idx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {manualQType === 'coding' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Input Description</label>
                      <input
                        type="text"
                        value={manualCoding.inputDescription}
                        onChange={(e) => setManualCoding({ ...manualCoding, inputDescription: e.target.value })}
                        placeholder="e.g. Single string of lowercase letters"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Output Description</label>
                      <input
                        type="text"
                        value={manualCoding.outputDescription}
                        onChange={(e) => setManualCoding({ ...manualCoding, outputDescription: e.target.value })}
                        placeholder="e.g. Reversed string"
                        className="form-input"
                      />
                    </div>

                    <div className="grid-2">
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Sample Input</label>
                        <input
                          type="text"
                          value={manualCoding.sampleInput}
                          onChange={(e) => setManualCoding({ ...manualCoding, sampleInput: e.target.value })}
                          placeholder="e.g. hello"
                          className="form-input"
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Sample Output</label>
                        <input
                          type="text"
                          value={manualCoding.sampleOutput}
                          onChange={(e) => setManualCoding({ ...manualCoding, sampleOutput: e.target.value })}
                          placeholder="e.g. olleh"
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
