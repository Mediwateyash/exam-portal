const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('examdesk_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.details = data.details || [];
      throw err;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  register: (name, email, password, confirmPassword) => request('/auth/register', { method: 'POST', body: { name, email, password, confirmPassword } }),
  getCurrentUser: () => request('/auth/me'),
  getAdminStats: () => request('/auth/admin/stats'),

  // Exams (Admin)
  getExams: () => request('/exams'),
  getExamDetails: (id) => request(`/exams/${id}`),
  createExam: (examData) => request('/exams', { method: 'POST', body: examData }),
  updateExam: (id, examData) => request(`/exams/${id}`, { method: 'PUT', body: examData }),
  deleteExam: (id) => request(`/exams/${id}`, { method: 'DELETE' }),

  // Modules (Admin)
  addModule: (examId, moduleData) => request(`/exams/${examId}/modules`, { method: 'POST', body: moduleData }),
  updateModule: (moduleId, moduleData) => request(`/exams/modules/${moduleId}`, { method: 'PUT', body: moduleData }),
  deleteModule: (moduleId) => request(`/exams/modules/${moduleId}`, { method: 'DELETE' }),
  importQuestionsJson: (moduleId, jsonString, previewOnly = false) =>
    request(`/exams/modules/${moduleId}/import-json`, { method: 'POST', body: { jsonString, previewOnly } }),

  // Questions (Admin)
  addQuestion: (questionData) => request('/questions', { method: 'POST', body: questionData }),
  updateQuestion: (id, questionData) => request(`/questions/${id}`, { method: 'PUT', body: questionData }),
  deleteQuestion: (id) => request(`/questions/${id}`, { method: 'DELETE' }),

  // Student Flow
  getAvailableExams: () => request('/student/exams'),
  getMyExams: () => request('/student/my-exams'),
  registerExam: (examId) => request(`/student/exams/${examId}/register`, { method: 'POST' }),
  getExamModulesOverview: (examId) => request(`/student/exams/${examId}/modules-overview`),
  getExamInstructions: (examId, moduleId = null) =>
    request(`/student/exams/${examId}/instructions${moduleId ? `?moduleId=${moduleId}` : ''}`),
  startExam: (examId, reattempt = false, moduleId = null) =>
    request(`/student/exams/${examId}/start${moduleId ? `?moduleId=${moduleId}` : ''}`, { method: 'POST', body: { reattempt, moduleId } }),
  reattemptExam: (examId) => request(`/student/exams/${examId}/reattempt`, { method: 'POST' }),
  submitExam: (examId, answers, timeSpentSeconds, moduleId = null, isModuleOnly = false) =>
    request(`/student/exams/${examId}/submit${moduleId ? `?moduleId=${moduleId}` : ''}`, { method: 'POST', body: { answers, timeSpentSeconds, moduleId, isModuleOnly } }),
  recordSecurityViolation: (examId, violationType = 'tab_switch') =>
    request(`/student/exams/${examId}/security-violation`, { method: 'POST', body: { violationType } }),
  saveAnswers: (examId, answers) =>
    request(`/student/exams/${examId}/save-answers`, { method: 'POST', body: { answers } }),

  // Submissions & Evaluation (Admin)
  getSubmissions: (examId = null, status = null) => {
    const params = new URLSearchParams();
    if (examId) params.append('examId', examId);
    if (status) params.append('status', status);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/submissions${queryString}`);
  },
  getSubmissionDetails: (id) => request(`/submissions/${id}`),
  evaluateSubmission: (id, evaluations) => request(`/submissions/${id}/evaluate`, { method: 'POST', body: { evaluations } }),

  // Results (Student)
  getStudentResults: () => request('/results'),
  getStudentResultDetail: (submissionId) => request(`/results/${submissionId}`)
};

export default api;
