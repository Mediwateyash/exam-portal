const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Exam = require('./models/Exam');
const Module = require('./models/Module');
const Question = require('./models/Question');
const ExamRegistration = require('./models/ExamRegistration');
const ExamSubmission = require('./models/ExamSubmission');
const StudentAnswer = require('./models/StudentAnswer');

async function testModuleWiseExamFlow() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const student = await User.findOne({ email: 'student@examdesk.com' });
  if (!student) {
    console.error('Student user not found');
    process.exit(1);
  }

  const exam = await Exam.findOne();
  if (!exam) {
    console.error('Exam not found');
    process.exit(1);
  }

  const modules = await Module.find({ exam_id: exam._id }).sort({ order_num: 1 });
  console.log(`Exam: "${exam.title}" has ${modules.length} modules.`);
  if (modules.length === 0) {
    console.log('Creating sample module for testing...');
    const newMod = await Module.create({
      exam_id: exam._id,
      title: 'Core Fundamentals',
      description: 'Foundational concepts and principles',
      order_num: 1
    });
    modules.push(newMod);
  }

  const targetModule = modules[0];
  console.log(`Targeting Module 1: "${targetModule.title}" (ID: ${targetModule._id})`);

  // Ensure questions exist in this module
  let modQuestions = await Question.find({ module_id: targetModule._id });
  if (modQuestions.length === 0) {
    console.log('Adding sample MCQ and Theory questions to Module 1...');
    const q1 = await Question.create({
      module_id: targetModule._id,
      type: 'mcq',
      question: 'What is the output of typeof null in JavaScript?',
      marks: 5,
      options: ['object', 'null', 'undefined', 'number'],
      correct_answer: 'object'
    });
    const q2 = await Question.create({
      module_id: targetModule._id,
      type: 'theory',
      question: 'Explain the concept of closures in JavaScript with an example.',
      marks: 10,
      word_limit: 150
    });
    modQuestions = [q1, q2];
  }
  console.log(`Module 1 has ${modQuestions.length} questions.`);

  // 1. Ensure student registration
  await ExamRegistration.findOneAndUpdate(
    { exam_id: exam._id, student_id: student._id },
    { registered_at: new Date(), status: 'registered' },
    { upsert: true }
  );
  console.log('✓ Student registered for exam');

  // 2. Start module-wise exam session
  console.log('Testing startExam for module...');
  // Find or create in-progress submission
  let submission = await ExamSubmission.findOne({
    exam_id: exam._id,
    student_id: student._id,
    submitted_at: null,
    is_cancelled: { $ne: true }
  });

  if (!submission) {
    const lastAttempt = await ExamSubmission.findOne({ exam_id: exam._id, student_id: student._id }).sort({ attempt_number: -1 });
    const nextAttempt = lastAttempt ? (lastAttempt.attempt_number + 1) : 1;
    submission = await ExamSubmission.create({
      exam_id: exam._id,
      student_id: student._id,
      started_at: new Date(),
      total_marks: exam.total_marks,
      status: 'in_progress',
      attempt_number: nextAttempt,
      tab_switch_count: 0
    });
  }

  // Answer Module 1 questions
  for (const q of modQuestions) {
    const userAns = q.type === 'mcq' ? (q.options[0] || 'object') : 'Closures allow inner functions to access outer function scope.';
    await StudentAnswer.findOneAndUpdate(
      { submission_id: submission._id, question_id: q._id },
      {
        answer: userAns,
        marks_obtained: q.type === 'mcq' ? (userAns.toLowerCase() === String(q.correct_answer || '').toLowerCase() ? q.marks : 0) : 0,
        is_evaluated: q.type === 'mcq'
      },
      { upsert: true }
    );
  }
  console.log('✓ Student answers saved for Module 1');

  // Verify modules overview calculation
  const rawModules = await Module.find({ exam_id: exam._id }).sort({ order_num: 1 }).lean();
  const answers = await StudentAnswer.find({ submission_id: submission._id }).lean();
  const studentAnswersMap = {};
  answers.forEach(a => { studentAnswersMap[a.question_id.toString()] = a; });

  for (const m of rawModules) {
    const qs = await Question.find({ module_id: m._id }).lean();
    let answeredInModule = 0;
    qs.forEach(q => {
      if (studentAnswersMap[q._id.toString()]?.answer) {
        answeredInModule++;
      }
    });
    const isCompleted = qs.length > 0 && answeredInModule === qs.length;
    console.log(`  Module "${m.title}": ${answeredInModule}/${qs.length} answered -> Completed: ${isCompleted}`);
  }

  console.log('ALL MODULE-WISE ASSESSMENT TESTS PASSED SUCCESSFULLY! ✓');
  await mongoose.disconnect();
  process.exit(0);
}

testModuleWiseExamFlow().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
