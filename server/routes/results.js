const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ExamSubmission = require('../models/ExamSubmission');
const StudentAnswer = require('../models/StudentAnswer');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const Module = require('../models/Module');
const { requireStudent } = require('../middleware/auth');

// 1. GET all results for current student
router.get('/', requireStudent, async (req, res) => {
  try {
    const studentId = req.user.id;

    const submissions = await ExamSubmission.find({
      student_id: studentId,
      submitted_at: { $ne: null }
    })
      .populate('exam_id')
      .sort({ submitted_at: -1 })
      .lean();

    const formattedResults = await Promise.all(submissions.filter(s => s.exam_id).map(async (s) => {
      const exam = s.exam_id;
      const examId = exam._id;

      const modules = await Module.find({ exam_id: examId }).select('_id');
      const moduleIds = modules.map(m => m._id);
      const totalQuestions = await Question.countDocuments({ module_id: { $in: moduleIds } });

      const answeredCount = await StudentAnswer.countDocuments({
        submission_id: s._id,
        answer: { $exists: true, $ne: '' }
      });

      const isPassed = s.status === 'graded' ? s.score >= exam.passing_marks : null;

      return {
        submission_id: s._id.toString(),
        exam_id: examId.toString(),
        started_at: s.started_at,
        submitted_at: s.submitted_at,
        score: s.score,
        total_marks: s.total_marks,
        percentage: s.percentage,
        status: s.status,
        exam_title: exam.title,
        exam_description: exam.description,
        exam_duration: exam.duration,
        passing_marks: exam.passing_marks,
        total_questions: totalQuestions,
        answered_questions: answeredCount,
        isPassed
      };
    }));

    return res.json({ results: formattedResults });
  } catch (err) {
    console.error('Get student results error:', err);
    return res.status(500).json({ error: 'Failed to retrieve examination results.' });
  }
});

// 2. GET detailed result breakdown by submission ID
router.get('/:submissionId', requireStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    const submissionId = req.params.submissionId;

    const submission = await ExamSubmission.findOne({
      _id: submissionId,
      student_id: studentId
    }).populate('exam_id').lean();

    if (!submission) {
      return res.status(404).json({ error: 'Result not found or unauthorized.' });
    }

    const exam = submission.exam_id;
    const modules = await Module.find({ exam_id: exam._id }).sort({ order_num: 1 }).lean();
    const moduleMap = {};
    modules.forEach(m => { moduleMap[m._id.toString()] = m.title; });
    const moduleIds = modules.map(m => m._id);

    const questions = await Question.find({ module_id: { $in: moduleIds } }).lean();
    const typeOrder = { theory: 1, mcq: 2, coding: 3 };
    questions.sort((a, b) => (typeOrder[a.type] || 4) - (typeOrder[b.type] || 4));

    const studentAnswers = await StudentAnswer.find({ submission_id: submission._id }).lean();
    const answersMap = {};
    studentAnswers.forEach(sa => {
      answersMap[sa.question_id.toString()] = sa;
    });

    const breakdown = questions.map(q => {
      const sa = answersMap[q._id.toString()] || {};
      return {
        questionId: q._id.toString(),
        moduleTitle: moduleMap[q.module_id.toString()] || 'Module',
        type: q.type,
        question: q.question,
        maxMarks: q.marks,
        wordLimit: q.word_limit,
        options: q.options || [],
        correctAnswer: q.type === 'mcq' ? q.correct_answer : undefined,
        codingDetails: q.coding_details || null,
        answer: sa.answer || '',
        language: sa.language || '',
        wordCount: sa.word_count || 0,
        marksObtained: sa.marks_obtained !== undefined ? sa.marks_obtained : 0,
        isEvaluated: !!sa.is_evaluated,
        teacherRemarks: sa.teacher_remarks || ''
      };
    });

    const isPassed = submission.status === 'graded' ? submission.score >= exam.passing_marks : null;

    return res.json({
      submission: {
        id: submission._id.toString(),
        exam_title: exam.title,
        exam_description: exam.description,
        passing_marks: exam.passing_marks,
        instructions: exam.instructions,
        started_at: submission.started_at,
        submitted_at: submission.submitted_at,
        score: submission.score,
        total_marks: submission.total_marks,
        percentage: submission.percentage,
        status: submission.status,
        isPassed
      },
      answers: breakdown
    });
  } catch (err) {
    console.error('Get result detail error:', err);
    return res.status(500).json({ error: 'Failed to retrieve result details.' });
  }
});

module.exports = router;
