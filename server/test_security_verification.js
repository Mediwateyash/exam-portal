const assert = require('assert');

async function testSecurityAndObjectIdFixes() {
  const BASE = 'http://localhost:5000/api';
  console.log('--- STARTING SECURITY & BUG FIX VERIFICATION ---');

  // 1. Admin Login
  const adminRes = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@examdesk.com', password: 'admin123' })
  }).then(r => r.json());
  assert(adminRes.token, 'Admin login failed');
  console.log('✓ Admin login successful');

  // 2. Create Exam & Import Questions
  const examRes = await fetch(BASE + '/exams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminRes.token },
    body: JSON.stringify({
      title: 'Security & ObjectId Verification Exam',
      description: 'Testing tab switch security and ObjectId persistence',
      duration: 45,
      total_marks: 50,
      passing_marks: 25
    })
  }).then(r => r.json());
  assert(examRes.exam?.id, 'Failed to create exam');
  const examId = examRes.exam.id;
  console.log('✓ Created exam:', examId);

  const modRes = await fetch(BASE + '/exams/' + examId + '/modules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminRes.token },
    body: JSON.stringify({ title: 'Module 1 - Algorithms', description: 'Core test module', order_num: 1 })
  }).then(r => r.json());
  const moduleId = modRes.module.id;

  const jsonQuestions = JSON.stringify({
    module: {
      title: 'Module 1 - Algorithms',
      questions: [
        { type: 'theory', question: 'Describe how binary search operates.', wordLimit: 100, marks: 15 },
        { type: 'mcq', question: 'What is the worst-case time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'], correctAnswer: 'O(log n)', marks: 10 },
        { type: 'coding', question: 'Implement binary search in JavaScript.', inputDescription: 'Array and target.', outputDescription: 'Index or -1.', constraints: 'n <= 1000', sampleInput: '[1,2,3], 2', sampleOutput: '1', marks: 25 }
      ]
    }
  });

  const importRes = await fetch(BASE + '/exams/modules/' + moduleId + '/import-json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminRes.token },
    body: JSON.stringify({ jsonString: jsonQuestions })
  }).then(r => r.json());
  assert.strictEqual(importRes.count, 3, 'Imported question count mismatch');
  console.log('✓ Imported 3 questions (theory, mcq, coding)');

  // -------------------------------------------------------------
  // TEST SUITE 1: End-to-End ObjectId Fix & Evaluation Flow
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 1: E2E OBJECTID BUG FIX & GRADING FLOW ---');
  const student1Email = 'student1_' + Date.now() + '@test.com';
  const reg1 = await fetch(BASE + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Bob Normal', email: student1Email, password: 'password123', confirmPassword: 'password123' })
  }).then(r => r.json());

  await fetch(BASE + '/student/exams/' + examId + '/register', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + reg1.token }
  });

  const start1 = await fetch(BASE + '/student/exams/' + examId + '/start', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + reg1.token }
  }).then(r => r.json());
  assert(start1.questions?.length === 3, 'Questions not returned correctly');
  assert.strictEqual(start1.tabSwitchCount, 0, 'Initial tab switch count should be 0');
  assert.strictEqual(start1.isCancelled, false, 'Initial isCancelled should be false');

  const qTheory = start1.questions.find(q => q.type === 'theory');
  const qMcq = start1.questions.find(q => q.type === 'mcq');
  const qCoding = start1.questions.find(q => q.type === 'coding');

  // Submit with exact string IDs (verifies frontend fix)
  const submit1 = await fetch(BASE + '/student/exams/' + examId + '/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + reg1.token },
    body: JSON.stringify({
      answers: [
        { questionId: qTheory.id, answer: 'Binary search repeatedly divides the search interval in half on sorted arrays.' },
        { questionId: qMcq.id, answer: 'O(log n)' },
        { questionId: qCoding.id, answer: 'function binarySearch(arr, t) { let l=0, r=arr.length-1; while(l<=r){ let m=Math.floor((l+r)/2); if(arr[m]===t) return m; if(arr[m]<t) l=m+1; else r=m-1; } return -1; }', language: 'javascript' }
      ]
    })
  }).then(r => r.json());
  assert.strictEqual(submit1.submission?.mcqScore, 10, 'MCQ score should be 10');
  assert.strictEqual(submit1.submission?.status, 'submitted', 'Status should be submitted pending manual evaluation');
  console.log('✓ Normal submission successful, MCQ auto-graded 10/10');

  // Admin views submission details
  const subDetails = await fetch(BASE + '/submissions/' + submit1.submission.id, {
    headers: { 'Authorization': 'Bearer ' + adminRes.token }
  }).then(r => r.json());
  assert.strictEqual(subDetails.answers.length, 3);
  const codingAns = subDetails.answers.find(a => a.type === 'coding');
  assert(codingAns.answer.includes('function binarySearch'), 'Student coding answer was lost or not saved!');
  console.log('✓ Teacher can inspect candidate theory and coding answers');

  // Admin evaluates with exact string IDs (verifies frontend evaluation fix)
  const evalRes = await fetch(BASE + '/submissions/' + submit1.submission.id + '/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminRes.token },
    body: JSON.stringify({
      evaluations: [
        { questionId: qTheory.id, marksObtained: 14, teacherRemarks: 'Clear explanation of half interval reduction.' },
        { questionId: qCoding.id, marksObtained: 24, teacherRemarks: 'Optimal implementation with proper boundary conditions.' }
      ]
    })
  }).then(r => r.json());
  assert.strictEqual(evalRes.submission?.score, 48, 'Total score should be 10 + 14 + 24 = 48');
  assert.strictEqual(evalRes.submission?.status, 'graded', 'Status should be graded');
  console.log('✓ Teacher evaluation published, final score: 48/50 (96%)');

  // Student checks final result
  const finalResult = await fetch(BASE + '/results/' + submit1.submission.id, {
    headers: { 'Authorization': 'Bearer ' + reg1.token }
  }).then(r => r.json());
  assert.strictEqual(finalResult.submission?.score, 48);
  assert.strictEqual(finalResult.submission?.isPassed, true, 'Student should be marked as passed');
  console.log('✓ Student verified final report card with passing status');

  // -------------------------------------------------------------
  // TEST SUITE 2: Tab Switch Warning, Cancellation & Answer Persistence
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: TAB SWITCH SECURITY, CANCELLATION & ANSWER PERSISTENCE ---');
  const student2Email = 'student2_' + Date.now() + '@test.com';
  const reg2 = await fetch(BASE + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Charlie Violator', email: student2Email, password: 'password123', confirmPassword: 'password123' })
  }).then(r => r.json());

  await fetch(BASE + '/student/exams/' + examId + '/register', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + reg2.token }
  });

  const start2 = await fetch(BASE + '/student/exams/' + examId + '/start', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + reg2.token }
  }).then(r => r.json());
  const submissionId2 = start2.submissionId;
  assert(submissionId2, 'Submission ID missing');

  // First tab switch violation
  const viol1 = await fetch(BASE + '/student/exams/' + examId + '/security-violation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + reg2.token },
    body: JSON.stringify({ violationType: 'tab_switch' })
  }).then(r => r.json());
  assert.strictEqual(viol1.tabSwitchCount, 1, 'Tab switch count should be 1');
  assert.strictEqual(viol1.isCancelled, false, 'Exam should not be cancelled after 1st violation');
  assert.strictEqual(viol1.action, 'warning', 'Action should be warning');
  console.log('✓ First tab switch: issued official warning (1 of 1)');

  // Refresh test: Reloading exam should retain tabSwitchCount = 1
  const startReload = await fetch(BASE + '/student/exams/' + examId + '/start', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + reg2.token }
  }).then(r => r.json());
  assert.strictEqual(startReload.tabSwitchCount, 1, 'Tab switch count must persist across page reloads');
  assert.strictEqual(startReload.isCancelled, false);
  console.log('✓ Reload exam paper: tab switch count 1 was persisted from server');

  // Student types answers before second violation
  const currentAnswersBeforeViolation = [
    { questionId: qTheory.id, answer: 'Partial theory answer before tab switch' },
    { questionId: qMcq.id, answer: 'O(log n)' },
    { questionId: qCoding.id, answer: '// work in progress binary search code', language: 'javascript' }
  ];

  // Save answers endpoint (called immediately when cancellation triggers)
  const saveRes = await fetch(BASE + '/student/exams/' + examId + '/save-answers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + reg2.token },
    body: JSON.stringify({ answers: currentAnswersBeforeViolation })
  }).then(r => r.json());
  assert.strictEqual(saveRes.savedCount, 3, 'All 3 answers should be saved');
  console.log('✓ Saved answers before cancellation via /save-answers');

  // Second tab switch violation -> Cancels exam!
  const viol2 = await fetch(BASE + '/student/exams/' + examId + '/security-violation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + reg2.token },
    body: JSON.stringify({ violationType: 'tab_switch' })
  }).then(r => r.json());
  assert.strictEqual(viol2.tabSwitchCount, 2, 'Tab switch count should be 2');
  assert.strictEqual(viol2.isCancelled, true, 'Exam must be cancelled after 2nd violation');
  assert.strictEqual(viol2.action, 'cancelled', 'Action should be cancelled');
  console.log('✓ Second tab switch: exam immediately cancelled');

  // Verify re-entry is blocked
  const reenterRes = await fetch(BASE + '/student/exams/' + examId + '/start', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + reg2.token }
  });
  assert.strictEqual(reenterRes.status, 400, 'Re-entry must be rejected with 400');
  const reenterJson = await reenterRes.json();
  assert(reenterJson.isCancelled, 'isCancelled must be true in start rejection');
  console.log('✓ Re-entry blocked: student cannot re-enter cancelled exam');

  // Verify submit is blocked on cancelled exam
  const submitBlocked = await fetch(BASE + '/student/exams/' + examId + '/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + reg2.token },
    body: JSON.stringify({ answers: currentAnswersBeforeViolation })
  });
  assert.strictEqual(submitBlocked.status, 400, 'Submission must be blocked for cancelled exam');
  console.log('✓ Submission blocked: student cannot submit a cancelled exam');

  // Verify Admin can see the cancelled submission and its preserved answers
  const adminSub = await fetch(BASE + '/submissions/' + submissionId2, {
    headers: { 'Authorization': 'Bearer ' + adminRes.token }
  }).then(r => r.json());
  assert.strictEqual(adminSub.submission?.status, 'cancelled');
  assert.strictEqual(adminSub.submission?.is_cancelled, true);
  assert.strictEqual(adminSub.submission?.tab_switch_count, 2);
  assert(adminSub.answers.some(a => a.answer === 'Partial theory answer before tab switch'), 'Preserved theory answer missing');
  assert(adminSub.answers.some(a => a.answer === '// work in progress binary search code'), 'Preserved coding answer missing');
  console.log('✓ Admin inspection: cancelled status, tab_switch_count=2, and all preserved answers confirmed');

  // Verify Student result detail shows cancelled status without grading
  const studentResult = await fetch(BASE + '/results/' + submissionId2, {
    headers: { 'Authorization': 'Bearer ' + reg2.token }
  }).then(r => r.json());
  assert.strictEqual(studentResult.submission?.status, 'cancelled');
  assert.strictEqual(studentResult.submission?.is_cancelled, true);
  assert.strictEqual(studentResult.submission?.isPassed, null, 'Cancelled exam must not declare pass/fail');
  console.log('✓ Student scorecard: cancelled status verified, isPassed is null');

  console.log('\n======================================================');
  console.log('  ALL SECURITY & BUG FIX VERIFICATION TESTS PASSED!   ');
  console.log('======================================================\n');
}

testSecurityAndObjectIdFixes().catch(err => {
  console.error('VERIFICATION FAILURE:', err);
  process.exit(1);
});
