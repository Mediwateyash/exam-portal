const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const Module = require('../models/Module');
const Question = require('../models/Question');
const ExamRegistration = require('../models/ExamRegistration');
const ExamSubmission = require('../models/ExamSubmission');
const StudentAnswer = require('../models/StudentAnswer');
const User = require('../models/User');
const { requireStudent, requireAuth } = require('../middleware/auth');

// 1. Available Exams for Student
router.get('/exams', requireAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const exams = await Exam.find({ status: 'published' }).sort({ createdAt: -1 }).lean();

    const enrichedExams = await Promise.all(exams.map(async (e) => {
      const examId = e._id;
      const modules = await Module.find({ exam_id: examId }).select('_id');
      const moduleIds = modules.map(m => m._id);
      const questionCount = await Question.countDocuments({ module_id: { $in: moduleIds } });

      const reg = await ExamRegistration.findOne({ exam_id: examId, student_id: studentId });
      const sub = await ExamSubmission.findOne({ exam_id: examId, student_id: studentId, submitted_at: { $ne: null } });

      return {
        ...e,
        id: e._id.toString(),
        module_count: modules.length,
        question_count: questionCount,
        registration_status: reg ? reg.status : null,
        registration_id: reg ? reg._id.toString() : null,
        submission_status: sub ? sub.status : null,
        submission_id: sub ? sub._id.toString() : null,
        student_score: sub ? sub.score : null
      };
    }));

    return res.json({ exams: enrichedExams });
  } catch (err) {
    console.error('Student available exams error:', err);
    return res.status(500).json({ error: 'Failed to retrieve available exams.' });
  }
});

// 2. Register for an Exam
router.post('/exams/:id/register', requireStudent, async (req, res) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    if (exam.status !== 'published') {
      return res.status(400).json({ error: 'This exam is currently not open for registration.' });
    }

    const existing = await ExamRegistration.findOne({ exam_id: exam._id, student_id: studentId });
    if (existing) {
      return res.status(400).json({ error: 'You are already registered for this examination.' });
    }

    const registration = await ExamRegistration.create({
      exam_id: exam._id,
      student_id: studentId,
      status: 'registered'
    });

    return res.status(201).json({
      message: 'Successfully registered for examination!',
      registrationId: registration._id.toString()
    });
  } catch (err) {
    console.error('Exam registration error:', err);
    return res.status(500).json({ error: 'Failed to register for exam.' });
  }
});

// 3. My Exams (Registered & Attempted)
router.get('/my-exams', requireStudent, async (req, res) => {
  try {
    const studentId = req.user.id;

    const registrations = await ExamRegistration.find({ student_id: studentId })
      .populate('exam_id')
      .sort({ registered_at: -1 })
      .lean();

    const myExams = await Promise.all(registrations.filter(r => r.exam_id).map(async (r) => {
      const exam = r.exam_id;
      const examId = exam._id;

      const modules = await Module.find({ exam_id: examId }).select('_id');
      const moduleIds = modules.map(m => m._id);
      const questionCount = await Question.countDocuments({ module_id: { $in: moduleIds } });
      const sub = await ExamSubmission.findOne({ exam_id: examId, student_id: studentId, submitted_at: { $ne: null } });

      return {
        ...exam,
        id: exam._id.toString(),
        registered_at: r.registered_at,
        reg_status: r.status,
        submission_id: sub ? sub._id.toString() : null,
        started_at: sub ? sub.started_at : null,
        submitted_at: sub ? sub.submitted_at : null,
        student_score: sub ? sub.score : null,
        submission_status: sub ? sub.status : null,
        module_count: modules.length,
        question_count: questionCount
      };
    }));

    return res.json({ myExams });
  } catch (err) {
    console.error('My exams error:', err);
    return res.status(500).json({ error: 'Failed to retrieve your registered exams.' });
  }
});

// 4. Get Exam Instructions
router.get('/exams/:id/instructions', requireStudent, async (req, res) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;

    const exam = await Exam.findById(examId).lean();
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    const registration = await ExamRegistration.findOne({ exam_id: exam._id, student_id: studentId });
    if (!registration) {
      return res.status(403).json({ error: 'You must register for this exam before accessing instructions.' });
    }

    const submission = await ExamSubmission.findOne({ exam_id: exam._id, student_id: studentId }).lean();

    const modules = await Module.find({ exam_id: exam._id }).select('_id');
    const moduleIds = modules.map(m => m._id);

    const theoryCount = await Question.countDocuments({ module_id: { $in: moduleIds }, type: 'theory' });
    const mcqCount = await Question.countDocuments({ module_id: { $in: moduleIds }, type: 'mcq' });
    const codingCount = await Question.countDocuments({ module_id: { $in: moduleIds }, type: 'coding' });
    const totalQuestions = theoryCount + mcqCount + codingCount;

    return res.json({
      exam: {
        ...exam,
        id: exam._id.toString()
      },
      registration: registration.toJSON(),
      submission: submission ? { ...submission, id: submission._id.toString() } : null,
      stats: {
        theory_count: theoryCount,
        mcq_count: mcqCount,
        coding_count: codingCount,
        total_questions: totalQuestions
      }
    });
  } catch (err) {
    console.error('Exam instructions error:', err);
    return res.status(500).json({ error: 'Failed to retrieve exam instructions.' });
  }
});

// 5. Start Exam (Loads Question Paper with Timer)
router.post('/exams/:id/start', requireStudent, async (req, res) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    const registration = await ExamRegistration.findOne({ exam_id: exam._id, student_id: studentId });
    if (!registration) {
      return res.status(403).json({ error: 'You are not registered for this examination. Please register first.' });
    }

    let submission = await ExamSubmission.findOne({ exam_id: exam._id, student_id: studentId });

    if (submission && submission.submitted_at) {
      return res.status(400).json({
        error: 'You have already completed and submitted this examination.',
        submissionId: submission._id.toString(),
        status: submission.status
      });
    }

    const now = new Date();
    let startedAt;

    if (!submission) {
      startedAt = now;
      submission = await ExamSubmission.create({
        exam_id: exam._id,
        student_id: studentId,
        started_at: startedAt,
        total_marks: exam.total_marks,
        status: 'in_progress'
      });

      await ExamRegistration.updateOne({ _id: registration._id }, { status: 'in_progress' });
    } else {
      startedAt = submission.started_at;
    }

    const startTimeMs = new Date(startedAt).getTime();
    const durationMs = exam.duration * 60 * 1000;
    const elapsedMs = Date.now() - startTimeMs;
    const remainingSeconds = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));

    // Fetch all questions for this exam
    const modules = await Module.find({ exam_id: exam._id }).sort({ order_num: 1 }).lean();
    const moduleMap = {};
    modules.forEach(m => { moduleMap[m._id.toString()] = m.title; });
    const moduleIds = modules.map(m => m._id);

    const rawQuestions = await Question.find({ module_id: { $in: moduleIds } }).lean();

    // Sort: Theory first, MCQ second, Coding third
    const typeOrder = { theory: 1, mcq: 2, coding: 3 };
    rawQuestions.sort((a, b) => (typeOrder[a.type] || 4) - (typeOrder[b.type] || 4));

    const questions = rawQuestions.map((q, index) => ({
      id: q._id.toString(),
      questionNumber: index + 1,
      moduleId: q.module_id.toString(),
      moduleTitle: moduleMap[q.module_id.toString()] || 'Module',
      type: q.type,
      question: q.question,
      marks: q.marks,
      wordLimit: q.word_limit,
      options: q.options || [],
      codingDetails: q.coding_details || null
    }));

    // Group into Section A, B, C
    const sections = {
      sectionA: {
        title: 'SECTION A — THEORY',
        type: 'theory',
        description: 'Answer questions in detail adhering strictly to the word limits.',
        questions: questions.filter(q => q.type === 'theory')
      },
      sectionB: {
        title: 'SECTION B — MCQ',
        type: 'mcq',
        description: 'Select the single most appropriate option.',
        questions: questions.filter(q => q.type === 'mcq')
      },
      sectionC: {
        title: 'SECTION C — CODING',
        type: 'coding',
        description: 'Write complete, clean code in the editor for the given problems.',
        questions: questions.filter(q => q.type === 'coding')
      }
    };

    const savedAnswersList = await StudentAnswer.find({ submission_id: submission._id }).lean();
    const answersMap = {};
    savedAnswersList.forEach(a => {
      answersMap[a.question_id.toString()] = {
        answer: a.answer || '',
        language: a.language || 'javascript',
        wordCount: a.word_count || 0
      };
    });

    return res.json({
      exam: {
        id: exam._id.toString(),
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        totalMarks: exam.total_marks,
        passingMarks: exam.passing_marks,
        instructions: exam.instructions
      },
      submissionId: submission._id.toString(),
      startedAt,
      remainingSeconds,
      questions,
      sections,
      savedAnswers: answersMap
    });
  } catch (err) {
    console.error('Start exam error:', err);
    return res.status(500).json({ error: 'Failed to start examination session.' });
  }
});

// 6. Submit Exam & Automatic Evaluation
router.post('/exams/:id/submit', requireStudent, async (req, res) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;
    const { answers } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    const submission = await ExamSubmission.findOne({ exam_id: exam._id, student_id: studentId });
    if (!submission) {
      return res.status(400).json({ error: 'No active examination session found to submit.' });
    }

    const modules = await Module.find({ exam_id: exam._id }).select('_id');
    const moduleIds = modules.map(m => m._id);
    const examQuestions = await Question.find({ module_id: { $in: moduleIds } });

    const questionsMap = {};
    let totalExamMarks = 0;
    let hasTheoryOrCoding = false;

    examQuestions.forEach(q => {
      questionsMap[q._id.toString()] = q;
      totalExamMarks += q.marks;
      if (q.type === 'theory' || q.type === 'coding') {
        hasTheoryOrCoding = true;
      }
    });

    let autoScore = 0;
    let mcqEarned = 0;
    let mcqTotal = 0;
    let attemptedCount = 0;

    const answersList = Array.isArray(answers) ? answers : Object.values(answers || {});

    for (const item of answersList) {
      const qId = item.questionId?.toString();
      const q = questionsMap[qId];
      if (!q) continue;

      const userAns = item.answer !== undefined && item.answer !== null ? String(item.answer).trim() : '';
      const lang = item.language || (q.type === 'coding' ? 'javascript' : null);

      let wordCount = 0;
      let marksObtained = 0;
      let isEvaluated = false;

      if (userAns.length > 0) {
        attemptedCount++;
      }

      if (q.type === 'mcq') {
        mcqTotal += q.marks;
        isEvaluated = true;
        const isCorrect = userAns.toLowerCase() === String(q.correct_answer || '').trim().toLowerCase();
        if (isCorrect) {
          marksObtained = q.marks;
          mcqEarned += q.marks;
          autoScore += q.marks;
        } else {
          marksObtained = 0;
        }
      } else if (q.type === 'theory') {
        wordCount = userAns ? userAns.trim().split(/\s+/).filter(Boolean).length : 0;
        isEvaluated = false;
        marksObtained = 0;
      } else if (q.type === 'coding') {
        isEvaluated = false;
        marksObtained = 0;
      }

      await StudentAnswer.findOneAndUpdate(
        { submission_id: submission._id, question_id: q._id },
        {
          answer: userAns,
          language: lang,
          word_count: wordCount,
          marks_obtained: marksObtained,
          is_evaluated: isEvaluated
        },
        { upsert: true, new: true }
      );
    }

    const finalStatus = hasTheoryOrCoding ? 'submitted' : 'graded';
    const totalMarks = totalExamMarks || exam.total_marks || 100;
    const percentage = totalMarks > 0 ? parseFloat(((autoScore / totalMarks) * 100).toFixed(2)) : 0;

    submission.submitted_at = new Date();
    submission.score = autoScore;
    submission.total_marks = totalMarks;
    submission.percentage = percentage;
    submission.status = finalStatus;
    await submission.save();

    await ExamRegistration.updateOne({ exam_id: exam._id, student_id: studentId }, { status: 'completed' });

    const studentRecord = await User.findById(studentId);

    return res.json({
      message: 'Examination submitted successfully!',
      submission: {
        id: submission._id.toString(),
        examId: exam._id.toString(),
        examTitle: exam.title,
        studentName: studentRecord?.name || 'Student',
        submittedAt: submission.submitted_at.toISOString(),
        totalQuestions: examQuestions.length,
        attemptedQuestions: attemptedCount,
        unattemptedQuestions: Math.max(0, examQuestions.length - attemptedCount),
        mcqScore: mcqEarned,
        mcqTotal: mcqTotal,
        initialScore: autoScore,
        totalMarks: totalMarks,
        status: finalStatus,
        hasManualEvaluationPending: hasTheoryOrCoding
      }
    });
  } catch (err) {
    console.error('Submit exam error:', err);
    return res.status(500).json({ error: 'Failed to submit examination.' });
  }
});

module.exports = router;
