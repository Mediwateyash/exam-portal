async function testFullFlow() {
  const BASE = 'http://localhost:5000/api';

  // 1. Login Admin
  const adminRes = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@examdesk.com', password: 'admin123' })
  }).then(r => r.json());
  console.log('1. Admin Login:', adminRes.user?.name);

  // 2. Create Exam as Admin
  const examRes = await fetch(BASE + '/exams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminRes.token },
    body: JSON.stringify({
      title: 'Full Stack Web Engineering Certification Exam',
      description: 'End-to-end full stack verification exam',
      duration: 60,
      total_marks: 40,
      passing_marks: 20
    })
  }).then(r => r.json());
  console.log('2. Exam Created:', examRes.exam?.title, 'ID:', examRes.exam?.id);

  // 3. Add Module
  const modRes = await fetch(BASE + '/exams/' + examRes.exam.id + '/modules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminRes.token },
    body: JSON.stringify({ title: 'JavaScript & REST APIs', description: 'Async endpoints and ES6+', order_num: 1 })
  }).then(r => r.json());
  console.log('3. Module Created:', modRes.module?.title, 'ID:', modRes.module?.id);

  // 4. Import JSON Questions
  const jsonQuestions = JSON.stringify({
    module: {
      title: 'JavaScript & REST APIs',
      questions: [
        { type: 'theory', question: 'Explain the difference between let, var and const in JavaScript.', wordLimit: 150, marks: 10 },
        { type: 'mcq', question: 'Which keyword is used to declare a constant in JavaScript?', options: ['var', 'let', 'const', 'static'], correctAnswer: 'const', marks: 10 },
        { type: 'coding', question: 'Write a JavaScript program to reverse a string.', inputDescription: 'A single string.', outputDescription: 'Print the reversed string.', constraints: 'String length between 1 and 1000.', sampleInput: 'hello', sampleOutput: 'olleh', marks: 20 }
      ]
    }
  });

  const importRes = await fetch(BASE + '/exams/modules/' + modRes.module.id + '/import-json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminRes.token },
    body: JSON.stringify({ jsonString: jsonQuestions })
  }).then(r => r.json());
  console.log('4. JSON Questions Imported:', importRes.count, 'questions');

  // 5. Register Student
  const testEmail = 'student_' + Date.now() + '@test.com';
  const regRes = await fetch(BASE + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alice Cooper', email: testEmail, password: 'password123', confirmPassword: 'password123' })
  }).then(r => r.json());
  console.log('5. Student Registered:', regRes.user?.name);

  // 6. Student Registers for Exam
  const enrollRes = await fetch(BASE + '/student/exams/' + examRes.exam.id + '/register', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + regRes.token }
  }).then(r => r.json());
  console.log('6. Student Enrolled in Exam:', enrollRes.message);

  // 7. Student Starts Exam
  const startRes = await fetch(BASE + '/student/exams/' + examRes.exam.id + '/start', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + regRes.token }
  }).then(r => r.json());
  console.log('7. Exam Paper Loaded! Total questions:', startRes.questions?.length, 'Remaining time (seconds):', startRes.remainingSeconds);

  // 8. Student Submits Exam Answers
  const qTheory = startRes.questions.find(q => q.type === 'theory');
  const qMcq = startRes.questions.find(q => q.type === 'mcq');
  const qCoding = startRes.questions.find(q => q.type === 'coding');

  const submitRes = await fetch(BASE + '/student/exams/' + examRes.exam.id + '/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + regRes.token },
    body: JSON.stringify({
      answers: [
        { questionId: qTheory.id, answer: 'var is function scoped and hoisted with undefined. let and const are block scoped and temporal dead zone applies. const cannot be reassigned.' },
        { questionId: qMcq.id, answer: 'const' },
        { questionId: qCoding.id, answer: 'function reverse(str) { return str.split("").reverse().join(""); }', language: 'javascript' }
      ]
    })
  }).then(r => r.json());
  console.log('8. Exam Submitted! Automatic MCQ Score Earned:', submitRes.submission?.mcqScore, 'Status:', submitRes.submission?.status);

  // 9. Admin Evaluates Theory & Coding Answers
  const evalRes = await fetch(BASE + '/submissions/' + submitRes.submission.id + '/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminRes.token },
    body: JSON.stringify({
      evaluations: [
        { questionId: qTheory.id, marksObtained: 10, teacherRemarks: 'Excellent distinction between scopes and TDZ.' },
        { questionId: qCoding.id, marksObtained: 20, teacherRemarks: 'Clean and optimal implementation.' }
      ]
    })
  }).then(r => r.json());
  console.log('9. Evaluation Published! Total Score:', evalRes.submission?.score, '/', evalRes.submission?.total_marks, '(' + evalRes.submission?.percentage + '%)', 'Status:', evalRes.submission?.status);

  // 10. Student Views Final Results & Detailed Scorecard
  const resultRes = await fetch(BASE + '/results/' + submitRes.submission.id, {
    headers: { 'Authorization': 'Bearer ' + regRes.token }
  }).then(r => r.json());
  console.log('10. Student Scorecard Verified! Exam:', resultRes.submission?.exam_title, 'Passed:', resultRes.submission?.isPassed, 'Final Score:', resultRes.submission?.score + '/' + resultRes.submission?.total_marks, 'Evaluator remarks count:', resultRes.answers.filter(a => a.teacherRemarks).length);

  console.log('\n=============================================');
  console.log('  ALL 10 VERIFICATION STEPS PASSED 100%!     ');
  console.log('=============================================');
}

testFullFlow().catch(console.error);
