import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  GraduationCap, 
  FileText, 
  Award, 
  PlusCircle, 
  Layers, 
  CheckSquare, 
  LogOut, 
  User, 
  ShieldCheck
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isStudent, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="navbar-container" style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand */}
        <Link to={isAdmin ? '/admin/dashboard' : '/student/dashboard'} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          textDecoration: 'none'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#ffffff',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
          }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: '800',
              letterSpacing: '-0.03em',
              color: '#0f172a',
              lineHeight: '1.1'
            }}>
              ExamDesk
            </div>
            <div style={{
              fontSize: '0.6875rem',
              fontWeight: '600',
              color: '#64748b',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              Your Digital Examination Desk
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        {isAuthenticated && (
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {isAdmin ? (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`btn btn-sm ${isActive('/admin/dashboard') ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <Layers size={16} />
                  Dashboard
                </Link>
                <Link
                  to="/admin/generate-exam"
                  className={`btn btn-sm ${isActive('/admin/generate-exam') ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <PlusCircle size={16} />
                  Generate Exam
                </Link>
                <Link
                  to="/admin/manage-exams"
                  className={`btn btn-sm ${isActive('/admin/manage-exams') ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <FileText size={16} />
                  Manage Exams
                </Link>
                <Link
                  to="/admin/submissions"
                  className={`btn btn-sm ${isActive('/admin/submissions') ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <CheckSquare size={16} />
                  Submissions
                </Link>
                <Link
                  to="/admin/telemetry"
                  className={`btn btn-sm ${isActive('/admin/telemetry') ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Telemetry
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/student/dashboard"
                  className={`btn btn-sm ${isActive('/student/dashboard') ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <BookOpen size={16} />
                  Home
                </Link>
                <Link
                  to="/student/my-exams"
                  className={`btn btn-sm ${isActive('/student/my-exams') ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <FileText size={16} />
                  My Exams
                </Link>
                <Link
                  to="/student/results"
                  className={`btn btn-sm ${isActive('/student/results') ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <Award size={16} />
                  Results
                </Link>
              </>
            )}
          </nav>
        )}

        {/* User Badge / Auth Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                background: '#f8fafc',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isAdmin ? '#eff6ff' : '#ecfdf5',
                  color: isAdmin ? '#2563eb' : '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.875rem'
                }}>
                  {isAdmin ? <ShieldCheck size={18} /> : <User size={18} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#0f172a', lineHeight: '1.2' }}>
                    {user?.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className={`badge ${isAdmin ? 'badge-primary' : 'badge-success'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                      {isAdmin ? 'Teacher / Admin' : 'Student'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Logout from ExamDesk"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
