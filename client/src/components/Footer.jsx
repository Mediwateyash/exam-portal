import React from 'react';
import { GraduationCap, ShieldCheck, Heart, Code2, Sparkles } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e2e8f0',
      marginTop: 'auto',
      padding: '2.5rem 1.5rem 2rem',
      color: '#64748b'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem'
      }}>
        {/* Main Footer Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          {/* Brand & Tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 8px rgba(37, 99, 235, 0.2)'
            }}>
              <GraduationCap size={20} />
            </div>
            <div>
              <div style={{
                fontSize: '1.125rem',
                fontWeight: '800',
                color: '#0f172a',
                letterSpacing: '-0.02em',
                lineHeight: '1.2'
              }}>
                ExamDesk
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                Secure Online Examination & Evaluation Platform
              </div>
            </div>
          </div>

          {/* Institutional Status & Proctoring Badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '0.75rem',
              color: '#334155',
              fontWeight: '600'
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
              }} />
              System Operational
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              fontSize: '0.75rem',
              color: '#1d4ed8',
              fontWeight: '600'
            }}>
              <ShieldCheck size={14} color="#2563eb" />
              Proctoring Active
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: '#f1f5f9' }} />

        {/* Bottom Credits & Copyright Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8125rem'
        }}>
          <div>
            © {currentYear} ExamDesk. All rights reserved.
          </div>

          {/* Yash Diwate Credit Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.4rem 0.9rem',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid #cbd5e1',
            borderRadius: '24px',
            fontSize: '0.8125rem',
            color: '#334155',
            fontWeight: '600',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}>
            <Code2 size={15} color="#2563eb" />
            <span>Designed &amp; Developed by</span>
            <span style={{
              fontWeight: '800',
              color: '#1d4ed8',
              letterSpacing: '-0.01em'
            }}>
              Yash Diwate
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
