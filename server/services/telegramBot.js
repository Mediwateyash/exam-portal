/**
 * Telegram Bot & Live Proctoring Telemetry Service
 * Sends real-time examination alerts & telemetry logs to Telegram.
 * Also supports interactive Telegram Bot commands (/status, /active, /recent, /help).
 */

const User = require('../models/User');
const Exam = require('../models/Exam');
const ExamSubmission = require('../models/ExamSubmission');
const Module = require('../models/Module');
const Question = require('../models/Question');
const TelemetryLog = require('../models/TelemetryLog');

class TelegramBotService {
  constructor() {
    this.pollingActive = false;
    this.lastUpdateId = 0;
    this.pollInterval = null;
  }

  get token() {
    return process.env.TELEGRAM_BOT_TOKEN || '';
  }

  get chatId() {
    return process.env.TELEGRAM_CHAT_ID || '';
  }

  get isConfigured() {
    return Boolean(this.token && this.chatId);
  }

  formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0) parts.push(`${mins}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    return parts.join(' ');
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Send an HTML formatted message to Telegram
   */
  async sendMessage(htmlText, customChatId = null) {
    const targetChatId = customChatId || this.chatId;
    if (!this.token || !targetChatId) {
      return { success: false, reason: 'Telegram Bot Token or Chat ID not configured.' };
    }

    try {
      const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: htmlText,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });

      const data = await response.json();
      if (!data.ok) {
        console.warn(`[Telegram Bot] API Error: ${data.description}`);
        return { success: false, error: data.description };
      }
      return { success: true, data: data.result };
    } catch (err) {
      console.warn(`[Telegram Bot] Network Error: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * 1. Notify on Student / User Login
   */
  async notifyLogin({ user, ip, userAgent }) {
    if (!this.isConfigured) return;

    const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' });
    const roleEmoji = user.role === 'admin' ? '🛡️ [ADMIN]' : '🎓 [STUDENT]';

    const msg = [
      `🔔 <b>USER AUTHENTICATION LOG</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Name:</b> ${this.escapeHtml(user.name)}`,
      `📧 <b>Email:</b> <code>${this.escapeHtml(user.email)}</code>`,
      `🏷️ <b>Role:</b> ${roleEmoji}`,
      `🌐 <b>IP Address:</b> <code>${this.escapeHtml(ip || 'Unknown IP')}</code>`,
      `💻 <b>User-Agent:</b> <i>${this.escapeHtml((userAgent || 'Unknown Device').substring(0, 100))}</i>`,
      `⏰ <b>Timestamp:</b> ${now} (IST)`
    ].join('\n');

    await this.sendMessage(msg);
  }

  /**
   * 2. Notify on Exam or Module Start
   */
  async notifyExamStart({ student, exam, targetModule, attemptNumber, duration }) {
    if (!this.isConfigured) return;

    const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' });
    const moduleInfo = targetModule ? `📚 <b>Module:</b> ${this.escapeHtml(targetModule.title)} (Module #${targetModule.order_num || 1})` : `📚 <b>Scope:</b> Comprehensive Assessment (All Modules)`;

    const msg = [
      `🚀 <b>EXAMINATION SESSION STARTED</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Student:</b> ${this.escapeHtml(student.name)} (<code>${this.escapeHtml(student.email)}</code>)`,
      `📝 <b>Exam:</b> ${this.escapeHtml(exam.title)}`,
      moduleInfo,
      `🔢 <b>Attempt:</b> Attempt #${attemptNumber || 1}`,
      `⏳ <b>Total Allowed Duration:</b> ${duration || exam.duration} Minutes`,
      `🎯 <b>Total Exam Marks:</b> ${exam.total_marks} Marks`,
      `⏰ <b>Start Time:</b> ${now} (IST)`
    ].join('\n');

    await this.sendMessage(msg);
  }

  /**
   * 3. Notify on Question Answer Click / Selection / Input with Time Taken
   */
  async notifyQuestionInteraction({
    student,
    exam,
    moduleTitle,
    questionNumber,
    questionType,
    questionText,
    marks,
    selectedAnswer,
    previousAnswer,
    timeSpentSeconds,
    totalElapsedSeconds,
    wordCount
  }) {
    if (!this.isConfigured) return;

    const now = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' });
    const timeSpentFormatted = this.formatDuration(timeSpentSeconds);
    const totalElapsedFormatted = this.formatDuration(totalElapsedSeconds);

    let answerPreview = '';
    if (questionType === 'mcq') {
      answerPreview = `👉 <b>Selected Option:</b> <code>${this.escapeHtml(selectedAnswer || '(Cleared)')}</code>`;
      if (previousAnswer && previousAnswer !== selectedAnswer) {
        answerPreview += `\n🔄 <i>(Changed from: <code>${this.escapeHtml(previousAnswer)}</code>)</i>`;
      }
    } else if (questionType === 'theory') {
      const truncated = selectedAnswer ? selectedAnswer.substring(0, 200) + (selectedAnswer.length > 200 ? '...' : '') : '(Empty)';
      answerPreview = `✍️ <b>Written Answer:</b> <i>"${this.escapeHtml(truncated)}"</i>\n📊 <b>Word Count:</b> ${wordCount || 0} words`;
    } else if (questionType === 'coding') {
      const codePreview = selectedAnswer ? selectedAnswer.substring(0, 250) + (selectedAnswer.length > 250 ? '\n...' : '') : '(No code)';
      answerPreview = `💻 <b>Code Solution:</b>\n<pre>${this.escapeHtml(codePreview)}</pre>`;
    }

    const shortQ = questionText ? (questionText.substring(0, 140) + (questionText.length > 140 ? '...' : '')) : 'Question';

    const msg = [
      `🎯 <b>QUESTION TELEMETRY EVENT</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Student:</b> ${this.escapeHtml(student.name)}`,
      `📝 <b>Exam:</b> ${this.escapeHtml(exam?.title || 'Exam')}${moduleTitle ? ` | <i>${this.escapeHtml(moduleTitle)}</i>` : ''}`,
      `📌 <b>Q${questionNumber || '?'} (${String(questionType || 'Question').toUpperCase()}) [${marks || 0} Marks]:</b>`,
      `<i>"${this.escapeHtml(shortQ)}"</i>`,
      answerPreview,
      `⏱️ <b>Time Spent on Q${questionNumber || ''}:</b> <b>${timeSpentFormatted}</b>`,
      `⌛ <b>Total Exam Elapsed:</b> ${totalElapsedFormatted}`,
      `⏰ <b>Timestamp:</b> ${now} (IST)`
    ].join('\n');

    await this.sendMessage(msg);
  }

  /**
   * 4. Notify on Proctoring / Security Violations (Tab Switches, Fullscreen Exits)
   */
  async notifySecurityViolation({ student, exam, violationType, count, action }) {
    if (!this.isConfigured) return;

    const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' });
    const isCancelled = action === 'cancelled' || count >= 2;

    const msg = [
      isCancelled ? `🚨 <b>EXAM TERMINATED: PROCTORING VIOLATION</b>` : `⚠️ <b>PROCTORING WARNING ISSUED</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Student:</b> ${this.escapeHtml(student.name)} (<code>${this.escapeHtml(student.email)}</code>)`,
      `📝 <b>Exam:</b> ${this.escapeHtml(exam?.title || 'Exam')}`,
      `⚠️ <b>Violation Type:</b> ${violationType === 'tab_switch' ? 'Browser Tab Switch / Window Blur' : this.escapeHtml(violationType)}`,
      `🔢 <b>Violation Count:</b> <b>${count} of 2 permitted</b>`,
      `⚖️ <b>System Action:</b> ${isCancelled ? '🔴 <b>SESSION CANCELLED & LOCKED</b>' : '🟡 <b>First & Final Warning Displayed</b>'}`,
      `⏰ <b>Time:</b> ${now} (IST)`
    ].join('\n');

    await this.sendMessage(msg);
  }

  /**
   * 5. Notify on Exam / Module Submission & Final Results
   */
  async notifyExamSubmission({
    student,
    exam,
    targetModule,
    attemptNumber,
    score,
    totalMarks,
    percentage,
    attemptedCount,
    totalQuestions,
    totalTimeSpentSeconds,
    status
  }) {
    if (!this.isConfigured) return;

    const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' });
    const totalTimeFormatted = this.formatDuration(totalTimeSpentSeconds);
    const passed = percentage >= ((exam.passing_marks / (exam.total_marks || 100)) * 100);

    const msg = [
      `✅ <b>EXAMINATION SUBMISSION RECORDED</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Student:</b> ${this.escapeHtml(student.name)} (<code>${this.escapeHtml(student.email)}</code>)`,
      `📝 <b>Exam:</b> ${this.escapeHtml(exam.title)}`,
      targetModule ? `📚 <b>Module:</b> ${this.escapeHtml(targetModule.title)}` : `📚 <b>Scope:</b> All Modules`,
      `🔢 <b>Attempt:</b> Attempt #${attemptNumber || 1}`,
      `📊 <b>Questions Attempted:</b> <b>${attemptedCount || 0} / ${totalQuestions || 0}</b>`,
      `🎯 <b>Initial Score:</b> <b>${score} / ${totalMarks}</b> (<b>${percentage}%</b>)`,
      `🏆 <b>Result Status:</b> ${status === 'graded' ? (passed ? '🟢 <b>PASSED</b>' : '🔴 <b>FAILED</b>') : '🟡 <b>Under Evaluator Review (Theory/Coding)</b>'}`,
      `⏳ <b>Total Time Taken:</b> <b>${totalTimeFormatted}</b>`,
      `⏰ <b>Submitted At:</b> ${now} (IST)`
    ].join('\n');

    await this.sendMessage(msg);
  }

  /**
   * 6. Interactive Two-Way Telegram Bot (Long Polling for /status, /active, /recent)
   */
  startPolling() {
    if (!this.token) {
      console.log('[Telegram Bot] Token not set in .env. Bot polling disabled.');
      return;
    }
    if (this.pollingActive) return;

    this.pollingActive = true;
    console.log('[Telegram Bot] Starting background polling for incoming commands...');

    this.pollUpdates();
  }

  async pollUpdates() {
    if (!this.pollingActive || !this.token) return;

    try {
      const url = `https://api.telegram.org/bot${this.token}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=30`;
      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
          if (update.message && update.message.text) {
            await this.handleIncomingMessage(update.message);
          }
        }
      }
    } catch (err) {
      // Ignore network timeout in long poll
    }

    if (this.pollingActive) {
      setTimeout(() => this.pollUpdates(), 1000);
    }
  }

  stopPolling() {
    this.pollingActive = false;
  }

  async handleIncomingMessage(msg) {
    const text = (msg.text || '').trim();
    const chatId = msg.chat.id;
    const senderName = msg.from?.first_name || 'Admin';

    if (text.startsWith('/start') || text.startsWith('/help')) {
      const helpMsg = [
        `🤖 <b>Welcome to ExamDesk Proctoring Bot, ${this.escapeHtml(senderName)}!</b>`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `This bot delivers real-time proctoring alerts, student login events, question click telemetry, and live submission reports.`,
        ``,
        `📌 <b>Available Commands:</b>`,
        `• <code>/status</code> — System health & summary statistics`,
        `• <code>/active</code> — View live students currently in exam sessions`,
        `• <code>/recent</code> — View latest 5 completed submissions`,
        `• <code>/exams</code> — List of all created examinations`,
        `• <code>/id</code> — Get your Telegram Chat ID for <code>.env</code>`,
        `• <code>/test</code> — Send a test notification check`
      ].join('\n');
      return this.sendMessage(helpMsg, chatId);
    }

    if (text.startsWith('/id')) {
      return this.sendMessage(`🆔 <b>Your Telegram Chat ID is:</b> <code>${chatId}</code>\n\nPaste this in your <code>.env</code> file:\n<code>TELEGRAM_CHAT_ID=${chatId}</code>`, chatId);
    }

    if (text.startsWith('/test')) {
      const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      return this.sendMessage(`✅ <b>ExamDesk Telegram Bot is Online & Fully Functional!</b>\n⏰ <i>Server Time: ${now}</i>`, chatId);
    }

    if (text.startsWith('/status')) {
      try {
        const totalExams = await Exam.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'student' });
        const activeSessions = await ExamSubmission.countDocuments({ submitted_at: null, is_cancelled: { $ne: true } });
        const totalSubmissions = await ExamSubmission.countDocuments({ submitted_at: { $ne: null } });

        const statusMsg = [
          `📊 <b>EXAMDESK SYSTEM STATUS</b>`,
          `━━━━━━━━━━━━━━━━━━━━`,
          `📚 <b>Total Exams:</b> ${totalExams}`,
          `🎓 <b>Total Students:</b> ${totalStudents}`,
          `🔴 <b>Active In-Progress Sessions:</b> <b>${activeSessions}</b>`,
          `✅ <b>Completed Submissions:</b> ${totalSubmissions}`,
          `💾 <b>Database:</b> MongoDB Atlas (Connected)`,
          `⚡ <b>Server Status:</b> Operational 🟢`
        ].join('\n');
        return this.sendMessage(statusMsg, chatId);
      } catch (err) {
        return this.sendMessage(`❌ Failed to fetch stats: ${this.escapeHtml(err.message)}`, chatId);
      }
    }

    if (text.startsWith('/active')) {
      try {
        const activeSubmissions = await ExamSubmission.find({ submitted_at: null, is_cancelled: { $ne: true } })
          .populate('student_id', 'name email')
          .populate('exam_id', 'title duration')
          .limit(10)
          .lean();

        if (activeSubmissions.length === 0) {
          return this.sendMessage(`ℹ️ <b>No active examination sessions in progress right now.</b>`, chatId);
        }

        const lines = [`🔴 <b>CURRENTLY ACTIVE SESSIONS (${activeSubmissions.length})</b>`, `━━━━━━━━━━━━━━━━━━━━`];
        activeSubmissions.forEach((sub, i) => {
          const studentName = sub.student_id?.name || 'Student';
          const examTitle = sub.exam_id?.title || 'Exam';
          const elapsedSecs = Math.floor((Date.now() - new Date(sub.started_at).getTime()) / 1000);
          lines.push(`${i + 1}. 👤 <b>${this.escapeHtml(studentName)}</b> — <i>${this.escapeHtml(examTitle)}</i> (Time: ${this.formatDuration(elapsedSecs)}, Tab Violations: ${sub.tab_switch_count || 0})`);
        });

        return this.sendMessage(lines.join('\n'), chatId);
      } catch (err) {
        return this.sendMessage(`❌ Failed to fetch active sessions: ${this.escapeHtml(err.message)}`, chatId);
      }
    }

    if (text.startsWith('/recent')) {
      try {
        const recent = await ExamSubmission.find({ submitted_at: { $ne: null } })
          .populate('student_id', 'name email')
          .populate('exam_id', 'title')
          .sort({ submitted_at: -1 })
          .limit(5)
          .lean();

        if (recent.length === 0) {
          return this.sendMessage(`ℹ️ <b>No submissions found yet.</b>`, chatId);
        }

        const lines = [`📋 <b>RECENT SUBMISSIONS</b>`, `━━━━━━━━━━━━━━━━━━━━`];
        recent.forEach((sub, i) => {
          const studentName = sub.student_id?.name || 'Student';
          const examTitle = sub.exam_id?.title || 'Exam';
          const scoreText = `${sub.score} / ${sub.total_marks} (${sub.percentage}%)`;
          lines.push(`${i + 1}. 👤 <b>${this.escapeHtml(studentName)}</b> — ${this.escapeHtml(examTitle)}\n   🎯 Score: <b>${scoreText}</b> | Status: <i>${sub.status}</i>`);
        });

        return this.sendMessage(lines.join('\n'), chatId);
      } catch (err) {
        return this.sendMessage(`❌ Failed to fetch recent submissions: ${this.escapeHtml(err.message)}`, chatId);
      }
    }

    if (text.startsWith('/exams')) {
      try {
        const exams = await Exam.find().sort({ createdAt: -1 }).limit(10).lean();
        if (exams.length === 0) {
          return this.sendMessage(`ℹ️ <b>No exams created yet.</b>`, chatId);
        }
        const lines = [`📚 <b>EXAMINATION CATALOG</b>`, `━━━━━━━━━━━━━━━━━━━━`];
        exams.forEach((ex, i) => {
          lines.push(`${i + 1}. <b>${this.escapeHtml(ex.title)}</b> (${ex.duration} Mins, ${ex.total_marks} Marks, Status: <i>${ex.status}</i>)`);
        });
        return this.sendMessage(lines.join('\n'), chatId);
      } catch (err) {
        return this.sendMessage(`❌ Failed to fetch exams: ${this.escapeHtml(err.message)}`, chatId);
      }
    }
  }
}

const telegramBot = new TelegramBotService();
module.exports = telegramBot;
