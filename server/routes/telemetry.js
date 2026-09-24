const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Exam = require('../models/Exam');
const Module = require('../models/Module');
const Question = require('../models/Question');
const ExamSubmission = require('../models/ExamSubmission');
const TelemetryLog = require('../models/TelemetryLog');
const { requireAuth, requireStudent, requireAdmin } = require('../middleware/auth');
const telegramBot = require('../services/telegramBot');

// 1. Record Live Student Telemetry Event (Answer Click, Time Spent, Question View)
router.post('/event', requireStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      examId,
      moduleId,
      questionId,
      eventType,
      selectedAnswer,
      previousAnswer,
      timeSpentSeconds,
      totalElapsedSeconds,
      wordCount,
      details
    } = req.body;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    let exam = null;
    if (examId) {
      exam = await Exam.findById(examId).lean();
    }

    let question = null;
    if (questionId) {
      question = await Question.findById(questionId).lean();
    }

    let targetModule = null;
    if (moduleId) {
      targetModule = await Module.findById(moduleId).lean();
    } else if (question && question.module_id) {
      targetModule = await Module.findById(question.module_id).lean();
    }

    const location = req.body.location || student.last_location || null;

    // Save Telemetry Log to MongoDB
    await TelemetryLog.create({
      student_id: student._id,
      exam_id: exam ? exam._id : null,
      module_id: targetModule ? targetModule._id : null,
      question_id: question ? question._id : null,
      event_type: eventType || 'answer_select',
      time_spent_seconds: Number(timeSpentSeconds) || 0,
      details: {
        selectedAnswer: selectedAnswer !== undefined ? String(selectedAnswer).substring(0, 500) : '',
        previousAnswer: previousAnswer !== undefined ? String(previousAnswer).substring(0, 500) : '',
        wordCount: Number(wordCount) || 0,
        totalElapsedSeconds: Number(totalElapsedSeconds) || 0,
        location: location || null,
        ...(details || {})
      },
      ip_address: req.ip || req.headers['x-forwarded-for'] || '',
      user_agent: req.headers['user-agent'] || ''
    });

    // Send Real-Time Alert to Telegram Bot
    if (eventType === 'answer_select' || eventType === 'theory_input' || eventType === 'code_edit') {
      telegramBot.notifyQuestionInteraction({
        student,
        exam,
        moduleTitle: targetModule?.title || '',
        questionNumber: question ? question.question_number : req.body.questionNumber,
        questionType: question?.type || req.body.questionType || 'mcq',
        questionText: question?.question || req.body.questionText || '',
        marks: question?.marks || req.body.marks || 0,
        selectedAnswer,
        previousAnswer,
        timeSpentSeconds: Number(timeSpentSeconds) || 0,
        totalElapsedSeconds: Number(totalElapsedSeconds) || 0,
        wordCount: Number(wordCount) || 0,
        location
      }).catch(err => console.warn('[Telegram Telemetry Notification Failed]:', err.message));
    }

    return res.json({ success: true, message: 'Telemetry recorded.' });
  } catch (err) {
    console.error('Telemetry error:', err);
    return res.status(500).json({ error: 'Failed to record telemetry.' });
  }
});

// 2. Test Telegram Bot Connection
router.post('/test-telegram', requireAuth, async (req, res) => {
  try {
    const { customToken, customChatId } = req.body;
    const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

    const testMsg = [
      `🤖 <b>ExamDesk Telegram Bot Test</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `✅ <b>Connection Status:</b> Successfully Connected!`,
      `👤 <b>Triggered By:</b> ${telegramBot.escapeHtml(req.user.name)} (${req.user.role})`,
      `⏰ <b>Server Time:</b> ${now} (IST)`,
      `🔔 <i>Real-time proctoring alerts and student click tracking are active.</i>`
    ].join('\n');

    let result;
    if (customToken && customChatId) {
      // Direct custom test
      const url = `https://api.telegram.org/bot${customToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: customChatId, text: testMsg, parse_mode: 'HTML' })
      });
      const data = await response.json();
      result = { success: data.ok, error: data.description };
    } else {
      result = await telegramBot.sendMessage(testMsg);
    }

    if (!result.success) {
      return res.status(400).json({ error: result.error || result.reason || 'Failed to send test message to Telegram.' });
    }

    return res.json({ success: true, message: 'Test message delivered to Telegram successfully!' });
  } catch (err) {
    console.error('Telegram test error:', err);
    return res.status(500).json({ error: 'Telegram test failed: ' + err.message });
  }
});

// 3. Admin: Get Telemetry Logs for an Exam or Student
router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const { examId, studentId, limit = 50 } = req.query;
    const query = {};
    if (examId) query.exam_id = examId;
    if (studentId) query.student_id = studentId;

    const logs = await TelemetryLog.find(query)
      .populate('student_id', 'name email')
      .populate('exam_id', 'title')
      .populate('question_id', 'question type marks')
      .sort({ created_at: -1 })
      .limit(Number(limit))
      .lean();

    return res.json({ logs });
  } catch (err) {
    console.error('Fetch telemetry logs error:', err);
    return res.status(500).json({ error: 'Failed to fetch telemetry logs.' });
  }
});

module.exports = router;
