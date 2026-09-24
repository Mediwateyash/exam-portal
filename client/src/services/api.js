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
  login: (email, password, location = null) => request('/auth/login', { method: 'POST', body: { email, password, location } }),
  register: (name, email, password, confirmPassword, location = null) => request('/auth/register', { method: 'POST', body: { name, email, password, confirmPassword, location } }),
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
  registerExam: (examId, location = null) => request(`/student/exams/${examId}/register`, { method: 'POST', body: { location } }),
  getExamModulesOverview: (examId) => request(`/student/exams/${examId}/modules-overview`),
  getExamInstructions: (examId, moduleId = null) =>
    request(`/student/exams/${examId}/instructions${moduleId ? `?moduleId=${moduleId}` : ''}`),
  startExam: (examId, reattempt = false, moduleId = null, location = null) =>
    request(`/student/exams/${examId}/start${moduleId ? `?moduleId=${moduleId}` : ''}`, { method: 'POST', body: { reattempt, moduleId, location } }),
  reattemptExam: (examId) => request(`/student/exams/${examId}/reattempt`, { method: 'POST' }),
  submitExam: (examId, answers, timeSpentSeconds, moduleId = null, isModuleOnly = false, location = null) =>
    request(`/student/exams/${examId}/submit${moduleId ? `?moduleId=${moduleId}` : ''}`, { method: 'POST', body: { answers, timeSpentSeconds, moduleId, isModuleOnly, location } }),
  recordSecurityViolation: (examId, violationType = 'tab_switch', location = null) =>
    request(`/student/exams/${examId}/security-violation`, { method: 'POST', body: { violationType, location } }),
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
  getStudentResultDetail: (submissionId) => request(`/results/${submissionId}`),

  // Telemetry & Telegram Proctoring
  trackTelemetry: (telemetryData) => request('/telemetry/event', { method: 'POST', body: telemetryData }),
  testTelegramBot: (customConfig = {}) => request('/telemetry/test-telegram', { method: 'POST', body: customConfig }),
  getTelemetryLogs: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/telemetry/logs${qs}`);
  }
};

export default api;
