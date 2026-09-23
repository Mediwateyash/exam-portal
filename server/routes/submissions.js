const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ExamSubmission = require('../models/ExamSubmission');
const StudentAnswer = require('../models/StudentAnswer');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const User = require('../models/User');
const Module = require('../models/Module');
const { requireAdmin } = require('../middleware/auth');

// 1. GET all submissions (Admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { examId, status } = req.query;

    const filter = { submitted_at: { $ne: null } };
    if (examId) filter.exam_id = examId;
    if (status) filter.status = status;

    const submissions = await ExamSubmission.find(filter)
      .populate('student_id', 'name email')
      .populate('exam_id', 'title passing_marks')
      .sort({ submitted_at: -1 })
      .lean();

    const formattedSubmissions = await Promise.all(submissions.filter(s => s.exam_id && s.student_id).map(async (s) => {
      const examId = s.exam_id._id;
      const modules = await Module.find({ exam_id: examId }).select('_id');
      const moduleIds = modules.map(m => m._id);
      const totalQuestions = await Question.countDocuments({ module_id: { $in: moduleIds } });

      const answeredCount = await StudentAnswer.countDocuments({
        submission_id: s._id,
        answer: { $exists: true, $ne: '' }
      });

      return {
        submission_id: s._id.toString(),
        exam_id: examId.toString(),
        student_id: s.student_id._id.toString(),
        started_at: s.started_at,
        submitted_at: s.submitted_at,
        score: s.score,
        total_marks: s.total_marks,
        percentage: s.percentage,
        status: s.status,
        student_name: s.student_id.name,
        student_email: s.student_id.email,
        exam_title: s.exam_id.title,
        passing_marks: s.exam_id.passing_marks,
        answered_count: answeredCount,
        total_questions: totalQuestions,
        pending_manual_eval: s.status === 'submitted' ? 1 : 0
      };
    }));

    return res.json({ submissions: formattedSubmissions });
  } catch (err) {
    console.error('Get submissions error:', err);
    return res.status(500).json({ error: 'Failed to retrieve submissions.' });
  }
});

// 2. GET detailed submission for grading & review (Admin)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const submissionId = req.params.id;

    const submission = await ExamSubmission.findById(submissionId)
      .populate('student_id', 'name email')
      .populate('exam_id')
      .lean();

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
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

    const questionsWithAnswers = questions.map(q => {
      const sa = answersMap[q._id.toString()] || {};
      return {
        questionId: q._id.toString(),
        moduleTitle: moduleMap[q.module_id.toString()] || 'Module',
        type: q.type,
        question: q.question,
        maxMarks: q.marks,
        wordLimit: q.word_limit,
        options: q.options || [],
        correctAnswer: q.correct_answer,
        codingDetails: q.coding_details || null,
        answer: sa.answer || '',
        language: sa.language || '',
        wordCount: sa.word_count || 0,
        marksObtained: sa.marks_obtained !== undefined ? sa.marks_obtained : 0,
        isEvaluated: !!sa.is_evaluated,
        teacherRemarks: sa.teacher_remarks || ''
      };
    });

    return res.json({
      submission: {
        id: submission._id.toString(),
        student_name: submission.student_id?.name || 'Student',
        student_email: submission.student_id?.email || 'N/A',
        exam_title: exam.title,
        exam_description: exam.description,
        exam_duration: exam.duration,
        passing_marks: exam.passing_marks,
        started_at: submission.started_at,
        submitted_at: submission.submitted_at,
        score: submission.score,
        total_marks: submission.total_marks,
        percentage: submission.percentage,
        status: submission.status
      },
      answers: questionsWithAnswers
    });
  } catch (err) {
    console.error('Get submission details error:', err);
    return res.status(500).json({ error: 'Failed to retrieve submission details.' });
  }
});

// 3. POST evaluate submission (Teacher grading theory & coding questions)
router.post('/:id/evaluate', requireAdmin, async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { evaluations } = req.body;

    const submission = await ExamSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    for (const item of (evaluations || [])) {
      const qId = item.questionId?.toString();
      const marks = Math.max(0, parseFloat(item.marksObtained || 0));
      const remarks = item.teacherRemarks ? String(item.teacherRemarks).trim() : '';

      await StudentAnswer.findOneAndUpdate(
        { submission_id: submission._id, question_id: qId },
        {
          marks_obtained: marks,
          teacher_remarks: remarks,
          is_evaluated: true
        },
        { upsert: true, new: true }
      );
    }

    // Calculate sum of all answers marks
    const allAnswers = await StudentAnswer.find({ submission_id: submission._id });
    const totalEarned = allAnswers.reduce((sum, a) => sum + (a.marks_obtained || 0), 0);

    const totalPossible = submission.total_marks > 0 ? submission.total_marks : 100;
    const percentage = parseFloat(((totalEarned / totalPossible) * 100).toFixed(2));

    submission.score = totalEarned;
    submission.percentage = percentage;
    submission.status = 'graded';
    await submission.save();

    return res.json({
      message: 'Evaluation saved successfully!',
      submission: {
        id: submission._id.toString(),
        score: submission.score,
        total_marks: submission.total_marks,
        percentage: submission.percentage,
        status: submission.status
      }
    });
  } catch (err) {
    console.error('Evaluate submission error:', err);
    return res.status(500).json({ error: 'Failed to save evaluation.' });
  }
});

module.exports = router;
