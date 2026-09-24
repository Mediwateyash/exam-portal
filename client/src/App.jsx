import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import CreateExam from './pages/admin/CreateExam';
import ManageExams from './pages/admin/ManageExams';
import ManageExamDetails from './pages/admin/ManageExamDetails';
import SubmissionsList from './pages/admin/SubmissionsList';
import EvaluateSubmission from './pages/admin/EvaluateSubmission';
import LiveTelemetry from './pages/admin/LiveTelemetry';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import MyExams from './pages/student/MyExams';
import ExamModules from './pages/student/ExamModules';
import ExamInstructions from './pages/student/ExamInstructions';
import ExamPaper from './pages/student/ExamPaper';
import ExamSubmitted from './pages/student/ExamSubmitted';
import ResultsList from './pages/student/ResultsList';
import ViewResult from './pages/student/ViewResult';

function AppLayout({ children }) {
  const location = useLocation();
  // Hide default navbar during actual exam paper session for distraction-free exam environment
  const isTakingExam = location.pathname.includes('/take');

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isTakingExam && <Navbar />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
      {!isTakingExam && <Footer />}
    </div>
  );
}

function HomeRedirect() {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/student/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <Routes>
            {/* Default Route */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/generate-exam"
              element={
                <ProtectedRoute requiredRole="admin">
                  <CreateExam />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/manage-exams"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ManageExams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/exams/:id/manage"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ManageExamDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/submissions"
              element={
                <ProtectedRoute requiredRole="admin">
                  <SubmissionsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/submissions/:id/evaluate"
              element={
                <ProtectedRoute requiredRole="admin">
                  <EvaluateSubmission />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/telemetry"
              element={
                <ProtectedRoute requiredRole="admin">
                  <LiveTelemetry />
                </ProtectedRoute>
              }
            />

            {/* Student Protected Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/my-exams"
              element={
                <ProtectedRoute requiredRole="student">
                  <MyExams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exam/:id/modules"
              element={
                <ProtectedRoute requiredRole="student">
                  <ExamModules />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exam/:id/instructions"
              element={
                <ProtectedRoute requiredRole="student">
                  <ExamInstructions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exam/:id/take"
              element={
                <ProtectedRoute requiredRole="student">
                  <ExamPaper />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exam/:id/submitted"
              element={
                <ProtectedRoute requiredRole="student">
                  <ExamSubmitted />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/results"
              element={
                <ProtectedRoute requiredRole="student">
                  <ResultsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/results/:submissionId"
              element={
                <ProtectedRoute requiredRole="student">
                  <ViewResult />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}
