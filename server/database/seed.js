const bcrypt = require('bcryptjs');
const { connectDB } = require('./db');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Module = require('../models/Module');
const Question = require('../models/Question');

async function seed() {
  await connectDB();
  console.log('Seeding ExamDesk MongoDB Atlas database...');

  // 1. Seed Admin & Students
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const studentPasswordHash = bcrypt.hashSync('student123', 10);

  let admin = await User.findOne({ email: 'admin@examdesk.com' });
  if (!admin) {
    admin = await User.create({
      name: 'Prof. Alan Vance',
      email: 'admin@examdesk.com',
      password: adminPasswordHash,
      role: 'admin'
    });
    console.log('Admin user created in MongoDB.');
  } else {
    admin.name = 'Prof. Alan Vance';
    await admin.save();
  }

  let student = await User.findOne({ email: 'student@examdesk.com' });
  if (!student) {
    student = await User.create({
      name: 'Alex Johnson',
      email: 'student@examdesk.com',
      password: studentPasswordHash,
      role: 'student'
    });
    console.log('Student user created in MongoDB.');
  } else {
    student.name = 'Alex Johnson';
    await student.save();
  }

  // 2. Seed Default Exam if not present
  let existingExam = await Exam.findOne({ title: 'Full Stack Web Development Examination' });
  if (!existingExam) {
    const instructionsText = `1. This examination consists of Three Sections: Section A (Theory), Section B (MCQ), and Section C (Coding).
2. Section A: Adhere strictly to the specified word limits. Answers should be clear and well-structured.
3. Section B: Select the single most accurate option for each question.
4. Section C: Write clean, legible code in the provided editor. Choose your preferred language.
5. The timer will continuously run. Your answers are auto-saved.
6. When the countdown reaches 00:00:00, the exam will be automatically submitted.
7. Do not refresh or navigate away from the test window during the session.`;

    existingExam = await Exam.create({
      title: 'Full Stack Web Development Examination',
      description: 'Comprehensive assessment covering modern JavaScript, React architecture, asynchronous programming, Node.js backend services, and database principles.',
      duration: 90,
      total_marks: 100,
      passing_marks: 40,
      exam_date: new Date().toISOString().split('T')[0],
      start_time: '10:00 AM',
      end_time: '11:30 AM',
      instructions: instructionsText,
      status: 'published',
      created_by: admin._id
    });

    // 3. Create Modules
    const mod1 = await Module.create({
      exam_id: existingExam._id,
      title: 'JavaScript & Asynchronous Concepts',
      description: 'Core ES6+, closures, prototype, promises, event loop',
      order_num: 1
    });

    const mod2 = await Module.create({
      exam_id: existingExam._id,
      title: 'React & Component Architecture',
      description: 'Hooks, state management, virtual DOM, component lifecycles',
      order_num: 2
    });

    const mod3 = await Module.create({
      exam_id: existingExam._id,
      title: 'Node.js, Express & Database Systems',
      description: 'REST API design, middleware, transactions, SQL/NoSQL',
      order_num: 3
    });

    // 4. Create Questions
    // Module 1 Questions
    await Question.create([
      {
        module_id: mod1._id,
        type: 'theory',
        question: 'Explain the difference between let, var, and const in JavaScript with respect to scope, hoisting, and reassignment.',
        marks: 10,
        word_limit: 150
      },
      {
        module_id: mod1._id,
        type: 'mcq',
        question: 'Which keyword is used to declare a constant variable in JavaScript?',
        marks: 5,
        options: ['var', 'let', 'const', 'static'],
        correct_answer: 'const'
      },
      {
        module_id: mod1._id,
        type: 'mcq',
        question: 'What is the output of `typeof NaN` in standard JavaScript?',
        marks: 5,
        options: ['undefined', 'number', 'object', 'NaN'],
        correct_answer: 'number'
      },
      {
        module_id: mod1._id,
        type: 'coding',
        question: 'Write a program to reverse a given string without using built-in reverse helper functions.',
        marks: 15,
        coding_details: {
          inputDescription: 'A single string consisting of ASCII characters.',
          outputDescription: 'Print the reversed string.',
          constraints: 'String length between 1 and 1000 characters.',
          sampleInput: 'hello',
          sampleOutput: 'olleh'
        }
      },
      // Module 2 Questions
      {
        module_id: mod2._id,
        type: 'theory',
        question: 'Describe the concept of the Virtual DOM in React and explain how the reconciliation algorithm optimizes UI rendering performance.',
        marks: 15,
        word_limit: 200
      },
      {
        module_id: mod2._id,
        type: 'mcq',
        question: 'Which React hook is primarily used for managing side effects such as data fetching or subscriptions?',
        marks: 5,
        options: ['useState', 'useEffect', 'useReducer', 'useCallback'],
        correct_answer: 'useEffect'
      },
      {
        module_id: mod2._id,
        type: 'coding',
        question: 'Write a function that takes an array of integers and returns a new array with all duplicate elements removed while maintaining original order.',
        marks: 15,
        coding_details: {
          inputDescription: 'An array of integers separated by spaces.',
          outputDescription: 'Array of unique integers in their first appearance order.',
          constraints: '1 <= Array length <= 5000',
          sampleInput: '1 2 2 3 4 4 5',
          sampleOutput: '1 2 3 4 5'
        }
      },
      // Module 3 Questions
      {
        module_id: mod3._id,
        type: 'theory',
        question: 'Compare relational SQL databases with document-based NoSQL databases, discussing when you would choose one over the other in a production web service.',
        marks: 15,
        word_limit: 200
      },
      {
        module_id: mod3._id,
        type: 'mcq',
        question: 'Which HTTP method is idempotent and used to update a resource by replacing it entirely?',
        marks: 5,
        options: ['POST', 'PUT', 'PATCH', 'CONNECT'],
        correct_answer: 'PUT'
      },
      {
        module_id: mod3._id,
        type: 'coding',
        question: 'Write a function that validates whether an input string containing brackets `()`, `{}`, `[]` is well-balanced.',
        marks: 15,
        coding_details: {
          inputDescription: 'A string containing bracket characters.',
          outputDescription: 'Return "true" if balanced, "false" otherwise.',
          constraints: 'String length between 1 and 1000.',
          sampleInput: '{[()]}',
          sampleOutput: 'true'
        }
      }
    ]);

    console.log('Sample exam, modules, and questions seeded into MongoDB Atlas.');
  }

  console.log('MongoDB database seeding complete.');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}

module.exports = { seed };
