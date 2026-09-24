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
const telegramBot = require('../services/telegramBot');

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
      const sub = await ExamSubmission.findOne({ exam_id: examId, student_id: studentId }).sort({ attempt_number: -1, createdAt: -1 });
      const totalAttempts = await ExamSubmission.countDocuments({ exam_id: examId, student_id: studentId, submitted_at: { $ne: null } });

      const isCompleted = sub && (sub.submitted_at || sub.is_cancelled || sub.status === 'submitted' || sub.status === 'graded' || sub.status === 'cancelled');

      return {
        ...e,
        id: e._id.toString(),
        module_count: modules.length,
        question_count: questionCount,
        registration_status: reg ? reg.status : null,
        registration_id: reg ? reg._id.toString() : null,
        submission_status: sub ? sub.status : null,
        submission_id: sub ? sub._id.toString() : null,
        student_score: sub ? sub.score : null,
        attempt_number: sub ? (sub.attempt_number || 1) : 1,
        total_attempts: totalAttempts,
        can_reattempt: Boolean(reg && isCompleted)
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
      const sub = await ExamSubmission.findOne({ exam_id: examId, student_id: studentId }).sort({ attempt_number: -1, createdAt: -1 });
      const totalAttempts = await ExamSubmission.countDocuments({ exam_id: examId, student_id: studentId, submitted_at: { $ne: null } });

      const isCompleted = sub && (sub.submitted_at || sub.is_cancelled || sub.status === 'submitted' || sub.status === 'graded' || sub.status === 'cancelled');

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
        attempt_number: sub ? (sub.attempt_number || 1) : 1,
        total_attempts: totalAttempts,
        can_reattempt: Boolean(isCompleted),
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
    const moduleId = req.query.moduleId;

    const exam = await Exam.findById(examId).lean();
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    const registration = await ExamRegistration.findOne({ exam_id: exam._id, student_id: studentId });
    if (!registration) {
      return res.status(403).json({ error: 'You must register for this exam before accessing instructions.' });
    }

    const latestSubmission = await ExamSubmission.findOne({ exam_id: exam._id, student_id: studentId }).sort({ attempt_number: -1, createdAt: -1 }).lean();
    const totalAttempts = await ExamSubmission.countDocuments({ exam_id: exam._id, student_id: studentId, submitted_at: { $ne: null } });
    const allAttempts = await ExamSubmission.find({ exam_id: exam._id, student_id: studentId })
      .sort({ attempt_number: -1 })
      .select('_id attempt_number status score total_marks percentage submitted_at is_cancelled')
      .lean();

    let moduleIds;
    let targetModule = null;

    if (moduleId) {
      targetModule = await Module.findOne({ _id: moduleId, exam_id: exam._id }).lean();
      if (targetModule) {
        moduleIds = [targetModule._id];
      }
    }

    if (!moduleIds) {
      const modules = await Module.find({ exam_id: exam._id }).select('_id');
      moduleIds = modules.map(m => m._id);
    }

    const theoryCount = await Question.countDocuments({ module_id: { $in: moduleIds }, type: 'theory' });
    const mcqCount = await Question.countDocuments({ module_id: { $in: moduleIds }, type: 'mcq' });
    const codingCount = await Question.countDocuments({ module_id: { $in: moduleIds }, type: 'coding' });
    const totalQuestions = theoryCount + mcqCount + codingCount;

    return res.json({
      exam: {
        ...exam,
        id: exam._id.toString()
      },
      targetModule: targetModule ? { ...targetModule, id: targetModule._id.toString() } : null,
      registration: registration.toJSON(),
      submission: latestSubmission ? { ...latestSubmission, id: latestSubmission._id.toString() } : null,
      total_attempts: totalAttempts,
      all_attempts: allAttempts.map(a => ({ ...a, id: a._id.toString() })),
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

// 4a. Get Exam Modules Overview (Module-Wise Dashboard)
router.get('/exams/:id/modules-overview', requireStudent, async (req, res) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;

    const exam = await Exam.findById(examId).lean();
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    const registration = await ExamRegistration.findOne({ exam_id: exam._id, student_id: studentId });
    if (!registration) {
      return res.status(403).json({ error: 'You must register for this examination before accessing modules.' });
    }

    const latestSubmission = await ExamSubmission.findOne({ exam_id: exam._id, student_id: studentId }).sort({ attempt_number: -1, createdAt: -1 }).lean();
    const totalAttempts = await ExamSubmission.countDocuments({ exam_id: exam._id, student_id: studentId, submitted_at: { $ne: null } });

    // Fetch student answers for latest submission if any
    let studentAnswersMap = {};
    if (latestSubmission) {
      const answers = await StudentAnswer.find({ submission_id: latestSubmission._id }).lean();
      answers.forEach(a => {
        studentAnswersMap[a.question_id.toString()] = a;
      });
    }

    // Fetch all modules
    const rawModules = await Module.find({ exam_id: exam._id }).sort({ order_num: 1 }).lean();

    const modulesWithStats = await Promise.all(rawModules.map(async (m, idx) => {
      const questions = await Question.find({ module_id: m._id }).lean();
      const theoryCount = questions.filter(q => q.type === 'theory').length;
      const mcqCount = questions.filter(q => q.type === 'mcq').length;
      const codingCount = questions.filter(q => q.type === 'coding').length;
      const moduleTotalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

      let answeredInModule = 0;
      let scoreInModule = 0;
      questions.forEach(q => {
        const ans = studentAnswersMap[q._id.toString()];
        if (ans && ans.answer) {
          answeredInModule++;
          scoreInModule += (ans.marks_obtained || 0);
        }
      });

      const isCompleted = questions.length > 0 && answeredInModule === questions.length;
      const isInProgress = answeredInModule > 0 && answeredInModule < questions.length;

      return {
        id: m._id.toString(),
        module_number: m.order_num || (idx + 1),
        title: m.title,
        description: m.description,
        order_num: m.order_num,
        stats: {
          total_questions: questions.length,
          theory_count: theoryCount,
          mcq_count: mcqCount,
          coding_count: codingCount,
          total_marks: moduleTotalMarks
        },
        progress: {
          answered_count: answeredInModule,
          module_score: scoreInModule,
          is_completed: isCompleted,
          is_in_progress: isInProgress,
          status: isCompleted ? 'completed' : isInProgress ? 'in_progress' : 'not_started'
        }
      };
    }));

    const totalQuestionsAll = modulesWithStats.reduce((sum, m) => sum + m.stats.total_questions, 0);
    const totalAnsweredAll = modulesWithStats.reduce((sum, m) => sum + m.progress.answered_count, 0);
    const completedModulesCount = modulesWithStats.filter(m => m.progress.is_completed).length;

    return res.json({
      exam: {
        ...exam,
        id: exam._id.toString()
      },
      registration: registration.toJSON(),
      submission: latestSubmission ? { ...latestSubmission, id: latestSubmission._id.toString() } : null,
      total_attempts: totalAttempts,
      modules: modulesWithStats,
      overall_progress: {
        total_modules: modulesWithStats.length,
        completed_modules: completedModulesCount,
        total_questions: totalQuestionsAll,
        answered_questions: totalAnsweredAll,
        percent_completed: totalQuestionsAll > 0 ? Math.round((totalAnsweredAll / totalQuestionsAll) * 100) : 0
      }
    });
  } catch (err) {
    console.error('Modules overview error:', err);
    return res.status(500).json({ error: 'Failed to retrieve examination modules.' });
  }
});

// 4b. Reattempt Exam (Initializes a brand new examination attempt)
router.post('/exams/:id/reattempt', requireStudent, async (req, res) => {
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

    const lastAttempt = await ExamSubmission.findOne({ exam_id: exam._id, student_id: studentId }).sort({ attempt_number: -1 });
    const nextAttemptNumber = lastAttempt ? (lastAttempt.attempt_number + 1) : 1;

    const newSubmission = await ExamSubmission.create({
      exam_id: exam._id,
      student_id: studentId,
      started_at: new Date(),
      total_marks: exam.total_marks,
      status: 'in_progress',
      attempt_number: nextAttemptNumber,
      tab_switch_count: 0,
      is_cancelled: false,
      cancel_reason: null
    });

    await ExamRegistration.updateOne({ _id: registration._id }, { status: 'in_progress' });

    return res.status(201).json({
      message: `Reattempt #${nextAttemptNumber} started successfully!`,
      submissionId: newSubmission._id.toString(),
      attemptNumber: nextAttemptNumber,
      examId: exam._id.toString()
    });
  } catch (err) {
    console.error('Reattempt exam error:', err);
    return res.status(500).json({ error: 'Failed to initialize reattempt.' });
  }
});

// 5. Start Exam (Loads Question Paper with Timer - supports Module-wise or Full Exam)
router.post('/exams/:id/start', requireStudent, async (req, res) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;
    const isReattemptRequest = Boolean(req.body?.reattempt || req.query?.reattempt === 'true');
    const moduleId = req.body?.moduleId || req.query?.moduleId || null;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    const registration = await ExamRegistration.findOne({ exam_id: exam._id, student_id: studentId });
    if (!registration) {
      return res.status(403).json({ error: 'You are not registered for this examination. Please register first.' });
    }

    // Look for active in-progress submission
    let submission = await ExamSubmission.findOne({
      exam_id: exam._id,
      student_id: studentId,
      submitted_at: null,
      is_cancelled: { $ne: true }
    }).sort({ attempt_number: -1, createdAt: -1 });

    const now = new Date();
    let startedAt;

    if (!submission) {
      const lastAttempt = await ExamSubmission.findOne({ exam_id: exam._id, student_id: studentId }).sort({ attempt_number: -1 });
      
      if (lastAttempt && (lastAttempt.submitted_at || lastAttempt.is_cancelled) && !isReattemptRequest) {
        return res.status(400).json({
          error: lastAttempt.is_cancelled
            ? 'This examination attempt was cancelled due to security policy violations.'
            : 'You have already completed and submitted this examination.',
          submissionId: lastAttempt._id.toString(),
          status: lastAttempt.status,
          isCancelled: lastAttempt.is_cancelled || false,
          cancelReason: lastAttempt.cancel_reason || null,
          canReattempt: true,
          attemptNumber: lastAttempt.attempt_number || 1
        });
      }

      const nextAttemptNumber = lastAttempt ? (lastAttempt.attempt_number + 1) : 1;
      startedAt = now;
      submission = await ExamSubmission.create({
        exam_id: exam._id,
        student_id: studentId,
        started_at: startedAt,
        total_marks: exam.total_marks,
        status: 'in_progress',
        attempt_number: nextAttemptNumber,
        tab_switch_count: 0,
        is_cancelled: false
      });

      await ExamRegistration.updateOne({ _id: registration._id }, { status: 'in_progress' });
    } else {
      startedAt = submission.started_at;
    }

    const startTimeMs = new Date(startedAt).getTime();
    const durationMs = exam.duration * 60 * 1000;
    const elapsedMs = Date.now() - startTimeMs;
    const remainingSeconds = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));

    // Fetch modules for this exam
    let moduleFilter = { exam_id: exam._id };
    let activeModule = null;

    if (moduleId) {
      activeModule = await Module.findOne({ _id: moduleId, exam_id: exam._id }).lean();
      if (activeModule) {
        moduleFilter._id = activeModule._id;
      }
    }

    const modules = await Module.find(moduleFilter).sort({ order_num: 1 }).lean();
    const allModulesForExam = await Module.find({ exam_id: exam._id }).sort({ order_num: 1 }).lean();
    
    const moduleMap = {};
    allModulesForExam.forEach(m => { moduleMap[m._id.toString()] = m.title; });
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

    // Send Telegram Notification
    User.findById(studentId).lean().then(studentUser => {
      telegramBot.notifyExamStart({
        student: studentUser || { name: 'Student', email: req.user.email },
        exam,
        targetModule: activeModule,
        attemptNumber: submission.attempt_number || 1,
        duration: exam.duration
      }).catch(() => {});
    }).catch(() => {});

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
      isModuleExam: Boolean(activeModule),
      activeModule: activeModule ? {
        id: activeModule._id.toString(),
        title: activeModule.title,
        description: activeModule.description,
        order_num: activeModule.order_num
      } : null,
      submissionId: submission._id.toString(),
      attemptNumber: submission.attempt_number || 1,
      startedAt,
      remainingSeconds,
      tabSwitchCount: submission.tab_switch_count || 0,
      isCancelled: submission.is_cancelled || false,
      questions,
      sections,
      savedAnswers: answersMap
    });
  } catch (err) {
    console.error('Start exam error:', err);
    return res.status(500).json({ error: 'Failed to start examination session.' });
  }
});

// 5b. Record Security Violation (Tab Switch)
router.post('/exams/:id/security-violation', requireStudent, async (req, res) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;
    const { violationType } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    // Find latest active in-progress submission
    const submission = await ExamSubmission.findOne({
      exam_id: exam._id,
      student_id: studentId,
      submitted_at: null,
      is_cancelled: { $ne: true }
    }).sort({ attempt_number: -1, createdAt: -1 });

    if (!submission) {
      const existing = await ExamSubmission.findOne({ exam_id: exam._id, student_id: studentId }).sort({ attempt_number: -1 });
      if (existing && existing.is_cancelled) {
        return res.json({
          tabSwitchCount: existing.tab_switch_count,
          isCancelled: true,
          action: 'cancelled',
          message: 'Exam has already been cancelled.',
          canReattempt: true
        });
      }
      return res.status(400).json({ error: 'No active examination session found.' });
    }

    submission.tab_switch_count = (submission.tab_switch_count || 0) + 1;

    if (submission.tab_switch_count >= 2) {
      submission.is_cancelled = true;
      submission.cancel_reason = 'Exceeded maximum permitted tab switches (2)';
      submission.status = 'cancelled';
      submission.submitted_at = new Date();
      await submission.save();

      await ExamRegistration.updateOne(
        { exam_id: exam._id, student_id: studentId },
        { status: 'completed' }
      );

      // Send Telegram Proctoring Violation Alert
      User.findById(studentId).lean().then(studentUser => {
        telegramBot.notifySecurityViolation({
          student: studentUser || { name: 'Student', email: req.user.email },
          exam,
          violationType: violationType || 'tab_switch',
          count: submission.tab_switch_count,
          action: 'cancelled'
        }).catch(() => {});
      }).catch(() => {});

      return res.json({
        tabSwitchCount: submission.tab_switch_count,
        isCancelled: true,
        action: 'cancelled',
        message: 'Exam has been cancelled due to repeated tab switch violations.',
        canReattempt: true
      });
    }

    await submission.save();

    // Send Telegram Warning Alert
    User.findById(studentId).lean().then(studentUser => {
      telegramBot.notifySecurityViolation({
        student: studentUser || { name: 'Student', email: req.user.email },
        exam,
        violationType: violationType || 'tab_switch',
        count: submission.tab_switch_count,
        action: 'warning'
      }).catch(() => {});
    }).catch(() => {});

    return res.json({
      tabSwitchCount: submission.tab_switch_count,
      isCancelled: false,
      action: 'warning',
      message: 'Tab switch detected. Warning 1 of 1. A second tab switch will immediately cancel your exam.'
    });
  } catch (err) {
    console.error('Security violation error:', err);
    return res.status(500).json({ error: 'Failed to record security violation.' });
  }
});

// 5c. Save Student Answers (Preserves answers during cancellation or background persistence)
router.post('/exams/:id/save-answers', requireStudent, async (req, res) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;
    const { answers } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    // Find active submission or latest submission
    let submission = await ExamSubmission.findOne({
      exam_id: exam._id,
      student_id: studentId,
      submitted_at: null,
      is_cancelled: { $ne: true }
    }).sort({ attempt_number: -1, createdAt: -1 });

    if (!submission) {
      submission = await ExamSubmission.findOne({ exam_id: exam._id, student_id: studentId }).sort({ attempt_number: -1 });
    }

    if (!submission) {
      return res.status(404).json({ error: 'Submission session not found.' });
    }

    const modules = await Module.find({ exam_id: exam._id }).select('_id');
    const moduleIds = modules.map(m => m._id);
    const examQuestions = await Question.find({ module_id: { $in: moduleIds } });
    const questionsMap = {};
    examQuestions.forEach(q => { questionsMap[q._id.toString()] = q; });

    const answersList = Array.isArray(answers) ? answers : Object.values(answers || {});
    let savedCount = 0;

    for (const item of answersList) {
      const qId = item.questionId?.toString();
      const q = questionsMap[qId];
      if (!q) continue;

      const userAns = item.answer !== undefined && item.answer !== null ? String(item.answer).trim() : '';
      const lang = item.language || (q.type === 'coding' ? 'javascript' : null);
      const wordCount = q.type === 'theory' && userAns ? userAns.trim().split(/\s+/).filter(Boolean).length : 0;

      await StudentAnswer.findOneAndUpdate(
        { submission_id: submission._id, question_id: q._id },
        {
          answer: userAns,
          language: lang,
          word_count: wordCount,
          marks_obtained: 0,
          is_evaluated: false
        },
        { upsert: true, new: true }
      );
      savedCount++;
    }

    return res.json({ message: 'Answers saved successfully.', savedCount, attemptNumber: submission.attempt_number || 1 });
  } catch (err) {
    console.error('Save answers error:', err);
    return res.status(500).json({ error: 'Failed to save answers.' });
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

    const submission = await ExamSubmission.findOne({
      exam_id: exam._id,
      student_id: studentId,
      submitted_at: null,
      is_cancelled: { $ne: true }
    }).sort({ attempt_number: -1, createdAt: -1 });

    if (!submission) {
      const latest = await ExamSubmission.findOne({ exam_id: exam._id, student_id: studentId }).sort({ attempt_number: -1 });
      if (latest && (latest.is_cancelled || latest.submitted_at)) {
        return res.status(400).json({
          error: latest.is_cancelled
            ? 'This examination attempt was cancelled due to security policy violations and cannot be submitted.'
            : 'This examination attempt has already been submitted.',
          canReattempt: true
        });
      }
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
    const elapsedSeconds = submission.started_at ? Math.floor((new Date().getTime() - new Date(submission.started_at).getTime()) / 1000) : 0;

    // Send Telegram Exam Submission Alert
    telegramBot.notifyExamSubmission({
      student: studentRecord || { name: 'Student', email: req.user.email },
      exam,
      targetModule: null,
      attemptNumber: submission.attempt_number || 1,
      score: autoScore,
      totalMarks: totalMarks,
      percentage: percentage,
      attemptedCount: attemptedCount,
      totalQuestions: examQuestions.length,
      totalTimeSpentSeconds: elapsedSeconds,
      status: finalStatus
    }).catch(() => {});

    return res.json({
      message: 'Examination submitted successfully!',
      submission: {
        id: submission._id.toString(),
        examId: exam._id.toString(),
        examTitle: exam.title,
        studentName: studentRecord?.name || 'Student',
        submittedAt: submission.submitted_at.toISOString(),
        attemptNumber: submission.attempt_number || 1,
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
