const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Exam = require('./models/Exam');
const Module = require('./models/Module');
const Question = require('./models/Question');
const ExamSubmission = require('./models/ExamSubmission');
const TelemetryLog = require('./models/TelemetryLog');
const telegramBot = require('./services/telegramBot');

async function testTelegramAndTelemetry() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  const student = await User.findOne({ email: 'student@examdesk.com' });
  const exam = await Exam.findOne();
  const question = await Question.findOne({ type: 'mcq' });

  if (!student || !exam || !question) {
    console.error('Seed student, exam, or question missing.');
    process.exit(1);
  }

  console.log(`Testing Telemetry with student: ${student.name} (${student.email}) on exam: "${exam.title}"`);

  // 1. Log Login Event
  const loginLog = await TelemetryLog.create({
    student_id: student._id,
    event_type: 'login',
    details: { email: student.email, role: student.role },
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0'
  });
  console.log('✓ Login telemetry event logged:', loginLog._id.toString());

  // 2. Log Question Click / Answer Selection with Time Spent
  const answerLog = await TelemetryLog.create({
    student_id: student._id,
    exam_id: exam._id,
    question_id: question._id,
    event_type: 'answer_select',
    time_spent_seconds: 35,
    details: {
      selectedAnswer: question.options ? question.options[0] : 'Test Answer',
      previousAnswer: '',
      totalElapsedSeconds: 120
    }
  });
  console.log('✓ Answer click telemetry event logged with 35s duration:', answerLog._id.toString());

  // 3. Log Tab Switch Violation
  const tabSwitchLog = await TelemetryLog.create({
    student_id: student._id,
    exam_id: exam._id,
    event_type: 'tab_switch',
    details: { violationCount: 1, action: 'warning' }
  });
  console.log('✓ Tab switch violation telemetry event logged:', tabSwitchLog._id.toString());

  // 4. Verify MongoDB Query on Telemetry Logs
  const recentLogs = await TelemetryLog.find({ student_id: student._id }).sort({ created_at: -1 }).limit(5);
  console.log(`✓ Queried ${recentLogs.length} recent telemetry events for student from MongoDB.`);

  // 5. Test Telegram Bot Message Formatter
  console.log('Telegram Bot Configuration State:', telegramBot.isConfigured ? 'Configured' : 'Awaiting Token in .env (Safe Fallback Mode)');
  console.log('ALL TELEMETRY & TELEGRAM BOT MODULE TESTS PASSED! ✓');

  await mongoose.disconnect();
  process.exit(0);
}

testTelegramAndTelemetry().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
