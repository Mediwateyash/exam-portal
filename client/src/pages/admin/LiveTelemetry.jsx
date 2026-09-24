import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  Radio, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  User, 
  FileText, 
  Layers, 
  HelpCircle,
  ShieldAlert,
  Bot,
  MessageSquare
} from 'lucide-react';

export default function LiveTelemetry() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testingBot, setTestingBot] = useState(false);
  const [botTestResult, setBotTestResult] = useState(null);

  const fetchLogs = async () => {
    try {
      const res = await api.getTelemetryLogs({ limit: 40 });
      setLogs(res.logs || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch telemetry logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const handleTestTelegram = async () => {
    setTestingBot(true);
    setBotTestResult(null);
    try {
      const res = await api.testTelegramBot();
      setBotTestResult({ success: true, message: res.message || 'Telegram test alert sent successfully!' });
    } catch (err) {
      setBotTestResult({ success: false, message: err.message || 'Telegram test failed. Please verify TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env' });
    } finally {
      setTestingBot(false);
    }
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#eff6ff', color: '#1d4ed8' }}>
              <Radio size={14} className="animate-pulse" /> Live Telemetry Feed
            </span>
            <span className="badge badge-success">Auto-Refresh (5s)</span>
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#0f172a' }}>
            Live Student Clicks &amp; Proctoring Telemetry
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>
            Real-time audit log tracking who logged in, question clicks, option selections, and time spent.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={fetchLogs}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={16} /> Refresh Feed
          </button>

          <button
            type="button"
            onClick={handleTestTelegram}
            disabled={testingBot}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Bot size={18} />
            {testingBot ? 'Pinging Telegram...' : 'Test Telegram Alert'}
          </button>
        </div>
      </div>

      {/* Bot Test Alert Banner */}
      {botTestResult && (
        <div className={`alert ${botTestResult.success ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1.5rem' }}>
          {botTestResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{botTestResult.message}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Telegram Instructions Card */}
      <div className="card" style={{
        background: '#f8fafc',
        border: '1.5px solid #e2e8f0',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: '#0284c7',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <MessageSquare size={22} />
          </div>

          <div style={{ flex: 1, minWidth: '280px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.35rem' }}>
              Telegram Bot Real-Time Alerts Configuration
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.5', margin: 0 }}>
              To receive instant phone alerts whenever a student logs in, clicks an answer, or switches tabs, set up your bot:
            </p>
            <ol style={{ fontSize: '0.8125rem', color: '#334155', margin: '0.6rem 0 0 1.25rem', padding: 0, lineHeight: '1.6' }}>
              <li>Create a bot on Telegram with <strong>@BotFather</strong> and copy the <strong>HTTP API Token</strong>.</li>
              <li>Message your bot or add it to your Telegram channel, then type <code>/id</code> to get your Chat ID.</li>
              <li>Add to your project root <code>.env</code> file:
                <br />
                <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                  TELEGRAM_BOT_TOKEN=123456789:ABCdefGHI...
                </code>
                <br />
                <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                  TELEGRAM_CHAT_ID=987654321
                </code>
              </li>
              <li>Click <strong>"Test Telegram Alert"</strong> above to verify live connection!</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
          Recent Telemetry Events ({logs.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <p>Loading real-time telemetry stream...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <Radio className="empty-icon" />
            <div className="empty-title">No student telemetry logged yet</div>
            <div className="empty-description">Student clicks, answer selections, and time spent will stream live here as exams are taken.</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Student</th>
                  <th>Exam &amp; Module</th>
                  <th>Event Type</th>
                  <th>Action / Answer Recorded</th>
                  <th>Time Spent</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const studentName = log.student_id?.name || 'Student';
                  const studentEmail = log.student_id?.email || '';
                  const examTitle = log.exam_id?.title || 'Exam';
                  const timeSpent = log.time_spent_seconds ? `${log.time_spent_seconds}s` : '—';
                  const dateStr = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  let badgeClass = 'badge-primary';
                  if (log.event_type === 'tab_switch' || log.event_type === 'fullscreen_exit') badgeClass = 'badge-danger';
                  if (log.event_type === 'exam_submit') badgeClass = 'badge-success';
                  if (log.event_type === 'login') badgeClass = 'badge-purple';
                  if (log.event_type === 'theory_input' || log.event_type === 'code_edit') badgeClass = 'badge-warning';

                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {dateStr}
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{studentName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{studentEmail}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#334155' }}>{examTitle}</div>
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`} style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          {log.event_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ maxWidth: '300px' }}>
                        {log.details?.selectedAnswer ? (
                          <div style={{
                            fontSize: '0.8125rem',
                            color: '#0f172a',
                            fontFamily: log.event_type === 'code_edit' ? 'monospace' : 'inherit',
                            background: '#f8fafc',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {String(log.details.selectedAnswer)}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontWeight: '700', color: '#2563eb' }}>
                        {timeSpent}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
