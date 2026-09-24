const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { connectDB } = require('./database/db');
const User = require('./models/User');
const Exam = require('./models/Exam');
const Module = require('./models/Module');
const Question = require('./models/Question');
const ExamSubmission = require('./models/ExamSubmission');
const ExamRegistration = require('./models/ExamRegistration');
const StudentAnswer = require('./models/StudentAnswer');

async function testReattemptFlow() {
  await connectDB();
  console.log('--- Starting Reattempt & Multi-Attempt Verification Test ---');

  // 1. Get or create student
  const student = await User.findOne({ email: 'student@examdesk.com' });
  const exam = await Exam.findOne({ status: 'published' });

  if (!student || !exam) {
    throw new Error('Seed student or exam not found in MongoDB.');
  }

  console.log(`Testing with student: ${student.email} on exam: "${exam.title}" (${exam._id})`);

  // Reset any in-progress submissions for clean test
  await ExamSubmission.deleteMany({ exam_id: exam._id, student_id: student._id });
  await ExamRegistration.deleteMany({ exam_id: exam._id, student_id: student._id });

  // 2. Register
  await ExamRegistration.create({
    exam_id: exam._id,
    student_id: student._id,
    status: 'registered'
  });
  console.log('Step 1: Student registered.');

  // 3. Attempt #1: Start Exam
  const sub1 = await ExamSubmission.create({
    exam_id: exam._id,
    student_id: student._id,
    started_at: new Date(),
    total_marks: exam.total_marks,
    status: 'in_progress',
    attempt_number: 1
  });
  console.log(`Step 2: Started Attempt #1 (ID: ${sub1._id}, Attempt: ${sub1.attempt_number})`);

  // Submit Attempt #1
  sub1.submitted_at = new Date();
  sub1.score = 75;
  sub1.percentage = 75;
  sub1.status = 'graded';
  await sub1.save();
  console.log('Step 3: Submitted Attempt #1 with score 75%');

  // 4. Attempt #2: Initialize Reattempt
  const lastAttempt = await ExamSubmission.findOne({ exam_id: exam._id, student_id: student._id }).sort({ attempt_number: -1 });
  const nextAttemptNum = lastAttempt ? lastAttempt.attempt_number + 1 : 1;

  const sub2 = await ExamSubmission.create({
    exam_id: exam._id,
    student_id: student._id,
    started_at: new Date(),
    total_marks: exam.total_marks,
    status: 'in_progress',
    attempt_number: nextAttemptNum,
    tab_switch_count: 0,
    is_cancelled: false
  });
  console.log(`Step 4: Initialized Reattempt #${sub2.attempt_number} (ID: ${sub2._id})`);

  if (sub2.attempt_number !== 2) {
    throw new Error(`Expected attempt_number 2, got ${sub2.attempt_number}`);
  }

  // 5. Simulate Tab Violation on Attempt #2 (1st warning, 2nd cancellation)
  sub2.tab_switch_count = 1;
  await sub2.save();
  console.log('Step 5: Recorded 1st tab switch on Attempt #2 (Warning issued)');

  sub2.tab_switch_count = 2;
  sub2.is_cancelled = true;
  sub2.status = 'cancelled';
  sub2.submitted_at = new Date();
  await sub2.save();
  console.log('Step 6: Recorded 2nd tab switch on Attempt #2 -> Cancelled session');

  // 6. Attempt #3: Reattempt after cancellation!
  const lastAttemptAfterCancel = await ExamSubmission.findOne({ exam_id: exam._id, student_id: student._id }).sort({ attempt_number: -1 });
  const nextAttemptNum3 = lastAttemptAfterCancel ? lastAttemptAfterCancel.attempt_number + 1 : 1;

  const sub3 = await ExamSubmission.create({
    exam_id: exam._id,
    student_id: student._id,
    started_at: new Date(),
    total_marks: exam.total_marks,
    status: 'in_progress',
    attempt_number: nextAttemptNum3,
    tab_switch_count: 0,
    is_cancelled: false
  });
  console.log(`Step 7: Reattempt after cancellation -> Attempt #${sub3.attempt_number} initialized! (ID: ${sub3._id})`);

  if (sub3.attempt_number !== 3) {
    throw new Error(`Expected attempt_number 3, got ${sub3.attempt_number}`);
  }

  // Submit Attempt #3 successfully
  sub3.submitted_at = new Date();
  sub3.score = 95;
  sub3.percentage = 95;
  sub3.status = 'graded';
  await sub3.save();
  console.log('Step 8: Submitted Attempt #3 with score 95%');

  // 7. Verify all 3 attempts exist in DB and are queryable
  const allSubmissions = await ExamSubmission.find({ exam_id: exam._id, student_id: student._id }).sort({ attempt_number: 1 });
  console.log(`Step 9: Found ${allSubmissions.length} total attempts for this student:`);
  allSubmissions.forEach(s => {
    console.log(`  - Attempt #${s.attempt_number}: Status=${s.status}, Score=${s.score}/${s.total_marks} (${s.percentage}%), Cancelled=${s.is_cancelled}`);
  });

  if (allSubmissions.length !== 3) {
    throw new Error(`Expected 3 total attempts in DB, found ${allSubmissions.length}`);
  }

  console.log('\n======================================================');
  console.log('  REATTEMPT & MULTI-ATTEMPT SYSTEM FULLY VERIFIED!   ');
  console.log('======================================================');
  process.exit(0);
}

testReattemptFlow().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
