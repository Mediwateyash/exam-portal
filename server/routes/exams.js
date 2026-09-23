const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const Module = require('../models/Module');
const Question = require('../models/Question');
const ExamRegistration = require('../models/ExamRegistration');
const ExamSubmission = require('../models/ExamSubmission');
const { requireAdmin } = require('../middleware/auth');

// Helper to validate a single question object
function validateQuestion(q, index) {
  const errors = [];
  const pos = `Question #${index + 1}`;

  if (!q || typeof q !== 'object') {
    return [`${pos}: Invalid question object.`];
  }

  if (!q.type || !['theory', 'mcq', 'coding'].includes(q.type.toLowerCase())) {
    errors.push(`${pos}: 'type' must be one of 'theory', 'mcq', or 'coding'. Received: '${q.type}'`);
  }

  if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
    errors.push(`${pos}: 'question' text is required.`);
  }

  const marks = Number(q.marks);
  if (isNaN(marks) || marks <= 0) {
    errors.push(`${pos}: 'marks' must be a positive number.`);
  }

  const type = q.type ? q.type.toLowerCase() : '';

  if (type === 'theory') {
    const wordLimit = Number(q.wordLimit);
    if (isNaN(wordLimit) || wordLimit <= 0) {
      errors.push(`${pos} (Theory): 'wordLimit' must be a positive integer.`);
    }
  } else if (type === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2) {
      errors.push(`${pos} (MCQ): 'options' must be an array with at least 2 choices.`);
    } else {
      const emptyOption = q.options.some(opt => typeof opt !== 'string' || !opt.trim());
      if (emptyOption) {
        errors.push(`${pos} (MCQ): all options must be non-empty strings.`);
      }
    }

    if (!q.correctAnswer || typeof q.correctAnswer !== 'string' || !q.correctAnswer.trim()) {
      errors.push(`${pos} (MCQ): 'correctAnswer' is required.`);
    } else if (Array.isArray(q.options) && !q.options.map(o => String(o).trim()).includes(String(q.correctAnswer).trim())) {
      errors.push(`${pos} (MCQ): 'correctAnswer' ("${q.correctAnswer}") must match one of the provided options.`);
    }
  } else if (type === 'coding') {
    if (!q.inputDescription && !q.sampleInput) {
      errors.push(`${pos} (Coding): 'inputDescription' or 'sampleInput' is required.`);
    }
    if (!q.outputDescription && !q.sampleOutput) {
      errors.push(`${pos} (Coding): 'outputDescription' or 'sampleOutput' is required.`);
    }
  }

  return errors;
}

// 1. GET all exams (Admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 }).lean();

    const enrichedExams = await Promise.all(exams.map(async (e) => {
      const examId = e._id;
      const modules = await Module.find({ exam_id: examId }).select('_id');
      const moduleIds = modules.map(m => m._id);
      const questionCount = await Question.countDocuments({ module_id: { $in: moduleIds } });
      const registeredStudents = await ExamRegistration.countDocuments({ exam_id: examId });
      const submissionCount = await ExamSubmission.countDocuments({ exam_id: examId, submitted_at: { $ne: null } });

      return {
        ...e,
        id: e._id.toString(),
        module_count: modules.length,
        question_count: questionCount,
        registered_students: registeredStudents,
        submission_count: submissionCount
      };
    }));

    return res.json({ exams: enrichedExams });
  } catch (err) {
    console.error('Get exams error:', err);
    return res.status(500).json({ error: 'Failed to retrieve exams.' });
  }
});

// 2. GET single exam with modules & questions (Admin)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).lean();
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    const modules = await Module.find({ exam_id: exam._id }).sort({ order_num: 1, createdAt: 1 }).lean();

    const modulesWithQuestions = await Promise.all(modules.map(async (mod) => {
      const questions = await Question.find({ module_id: mod._id }).sort({ createdAt: 1 }).lean();
      return {
        ...mod,
        id: mod._id.toString(),
        questions: questions.map(q => ({
          ...q,
          id: q._id.toString(),
          coding_details: q.coding_details || null
        }))
      };
    }));

    const registeredRecords = await ExamRegistration.find({ exam_id: exam._id }).populate('student_id', 'name email').sort({ registered_at: -1 }).lean();

    const registeredStudents = registeredRecords.map(r => ({
      registration_id: r._id.toString(),
      registered_at: r.registered_at,
      status: r.status,
      student_id: r.student_id?._id?.toString() || r.student_id?.toString(),
      name: r.student_id?.name || 'Unknown Student',
      email: r.student_id?.email || 'N/A'
    }));

    return res.json({
      exam: {
        ...exam,
        id: exam._id.toString(),
        modules: modulesWithQuestions,
        registeredStudents
      }
    });
  } catch (err) {
    console.error('Get exam details error:', err);
    return res.status(500).json({ error: 'Failed to retrieve exam details.' });
  }
});

// 3. POST create new exam
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      title, description, duration, total_marks, passing_marks,
      exam_date, start_time, end_time, instructions, status
    } = req.body;

    if (!title || !duration) {
      return res.status(400).json({ error: 'Exam title and duration are required.' });
    }

    const createdExam = await Exam.create({
      title: title.trim(),
      description: description || '',
      duration: parseInt(duration, 10),
      total_marks: parseInt(total_marks || 100, 10),
      passing_marks: parseInt(passing_marks || 40, 10),
      exam_date: exam_date || new Date().toISOString().split('T')[0],
      start_time: start_time || '10:00 AM',
      end_time: end_time || '11:30 AM',
      instructions: instructions || '',
      status: status || 'published',
      created_by: req.user.id
    });

    return res.status(201).json({
      message: 'Exam created successfully!',
      exam: {
        ...createdExam.toJSON(),
        id: createdExam._id.toString()
      }
    });
  } catch (err) {
    console.error('Create exam error:', err);
    return res.status(500).json({ error: 'Failed to create exam.' });
  }
});

// 4. PUT update exam
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const {
      title, description, duration, total_marks, passing_marks,
      exam_date, start_time, end_time, instructions, status
    } = req.body;

    const updated = await Exam.findByIdAndUpdate(
      req.params.id,
      {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(duration && { duration: parseInt(duration, 10) }),
        ...(total_marks !== undefined && { total_marks: parseInt(total_marks, 10) }),
        ...(passing_marks !== undefined && { passing_marks: parseInt(passing_marks, 10) }),
        ...(exam_date && { exam_date }),
        ...(start_time && { start_time }),
        ...(end_time && { end_time }),
        ...(instructions !== undefined && { instructions }),
        ...(status && { status })
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    return res.json({ message: 'Exam updated successfully!', exam: { ...updated.toJSON(), id: updated._id.toString() } });
  } catch (err) {
    console.error('Update exam error:', err);
    return res.status(500).json({ error: 'Failed to update exam.' });
  }
});

// 5. DELETE exam
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    // Cascade delete modules and questions
    const modules = await Module.find({ exam_id: exam._id });
    const moduleIds = modules.map(m => m._id);
    await Question.deleteMany({ module_id: { $in: moduleIds } });
    await Module.deleteMany({ exam_id: exam._id });
    await ExamRegistration.deleteMany({ exam_id: exam._id });
    await ExamSubmission.deleteMany({ exam_id: exam._id });

    return res.json({ message: 'Exam and all associated modules/questions deleted successfully.' });
  } catch (err) {
    console.error('Delete exam error:', err);
    return res.status(500).json({ error: 'Failed to delete exam.' });
  }
});

// 6. MODULES: Add module to exam
router.post('/:id/modules', requireAdmin, async (req, res) => {
  try {
    const { title, description, order_num } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Module title is required.' });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    const moduleCount = await Module.countDocuments({ exam_id: exam._id });
    const nextOrder = order_num || (moduleCount + 1);

    const newMod = await Module.create({
      exam_id: exam._id,
      title: title.trim(),
      description: description || '',
      order_num: nextOrder
    });

    return res.status(201).json({
      message: 'Module added successfully!',
      module: { ...newMod.toJSON(), id: newMod._id.toString(), questions: [] }
    });
  } catch (err) {
    console.error('Add module error:', err);
    return res.status(500).json({ error: 'Failed to add module.' });
  }
});

// 7. MODULES: Update module
router.put('/modules/:moduleId', requireAdmin, async (req, res) => {
  try {
    const { title, description, order_num } = req.body;
    const mod = await Module.findByIdAndUpdate(
      req.params.moduleId,
      {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(order_num !== undefined && { order_num: parseInt(order_num, 10) })
      },
      { new: true }
    );

    if (!mod) {
      return res.status(404).json({ error: 'Module not found.' });
    }

    return res.json({ message: 'Module updated successfully!', module: { ...mod.toJSON(), id: mod._id.toString() } });
  } catch (err) {
    console.error('Update module error:', err);
    return res.status(500).json({ error: 'Failed to update module.' });
  }
});

// 8. MODULES: Delete module
router.delete('/modules/:moduleId', requireAdmin, async (req, res) => {
  try {
    const mod = await Module.findByIdAndDelete(req.params.moduleId);
    if (!mod) {
      return res.status(404).json({ error: 'Module not found.' });
    }
    await Question.deleteMany({ module_id: mod._id });
    return res.json({ message: 'Module and its questions deleted successfully.' });
  } catch (err) {
    console.error('Delete module error:', err);
    return res.status(500).json({ error: 'Failed to delete module.' });
  }
});

// 9. JSON QUESTION IMPORTER & VALIDATOR
router.post('/modules/:moduleId/import-json', requireAdmin, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { jsonString, previewOnly } = req.body;

    const mod = await Module.findById(moduleId);
    if (!mod) {
      return res.status(404).json({ error: 'Target module not found.' });
    }

    if (!jsonString || typeof jsonString !== 'string') {
      return res.status(400).json({ error: 'Please provide valid JSON text.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      return res.status(400).json({
        error: 'Invalid JSON Syntax',
        details: [parseError.message]
      });
    }

    let questionsList = [];
    if (parsed.module && Array.isArray(parsed.module.questions)) {
      questionsList = parsed.module.questions;
    } else if (Array.isArray(parsed.questions)) {
      questionsList = parsed.questions;
    } else if (Array.isArray(parsed)) {
      questionsList = parsed;
    } else {
      return res.status(400).json({
        error: 'Unrecognized JSON format',
        details: ['Expected { "module": { "title": "...", "questions": [...] } } or an array of questions.']
      });
    }

    if (questionsList.length === 0) {
      return res.status(400).json({
        error: 'Empty question list',
        details: ['The provided JSON contains 0 questions.']
      });
    }

    const allErrors = [];
    const normalizedQuestions = [];

    questionsList.forEach((q, idx) => {
      const qErrors = validateQuestion(q, idx);
      if (qErrors.length > 0) {
        allErrors.push(...qErrors);
      } else {
        const type = q.type.toLowerCase();
        let options = [];
        let correctAnswer = null;
        let wordLimit = null;
        let codingDetails = { inputDescription: '', outputDescription: '', constraints: '', sampleInput: '', sampleOutput: '' };

        if (type === 'theory') {
          wordLimit = parseInt(q.wordLimit, 10) || 150;
        } else if (type === 'mcq') {
          options = q.options.map(o => String(o).trim());
          correctAnswer = String(q.correctAnswer).trim();
        } else if (type === 'coding') {
          codingDetails = {
            inputDescription: q.inputDescription || '',
            outputDescription: q.outputDescription || '',
            constraints: q.constraints || '',
            sampleInput: q.sampleInput || '',
            sampleOutput: q.sampleOutput || ''
          };
        }

        normalizedQuestions.push({
          module_id: mod._id,
          type,
          question: q.question.trim(),
          marks: parseInt(q.marks, 10),
          word_limit: wordLimit,
          options,
          correct_answer: correctAnswer,
          coding_details: codingDetails,
          rawPreview: {
            type,
            question: q.question.trim(),
            marks: parseInt(q.marks, 10),
            wordLimit,
            options,
            correctAnswer,
            codingDetails: type === 'coding' ? codingDetails : null
          }
        });
      }
    });

    if (allErrors.length > 0) {
      return res.status(422).json({
        error: 'JSON Validation Failed',
        details: allErrors,
        validCount: normalizedQuestions.length,
        totalCount: questionsList.length
      });
    }

    if (previewOnly) {
      return res.json({
        message: 'JSON is valid and ready for import.',
        preview: normalizedQuestions.map(nq => nq.rawPreview),
        summary: {
          total: normalizedQuestions.length,
          theory: normalizedQuestions.filter(q => q.type === 'theory').length,
          mcq: normalizedQuestions.filter(q => q.type === 'mcq').length,
          coding: normalizedQuestions.filter(q => q.type === 'coding').length,
          totalMarks: normalizedQuestions.reduce((sum, q) => sum + q.marks, 0)
        }
      });
    }

    // Insert into MongoDB
    const docsToInsert = normalizedQuestions.map(nq => ({
      module_id: nq.module_id,
      type: nq.type,
      question: nq.question,
      marks: nq.marks,
      word_limit: nq.word_limit,
      options: nq.options,
      correct_answer: nq.correct_answer,
      coding_details: nq.coding_details
    }));

    const insertedDocs = await Question.insertMany(docsToInsert);

    return res.status(201).json({
      message: `Successfully imported ${insertedDocs.length} questions into module "${mod.title}"!`,
      count: insertedDocs.length,
      questions: insertedDocs.map(d => ({ ...d.toJSON(), id: d._id.toString() }))
    });
  } catch (err) {
    console.error('Import questions JSON error:', err);
    return res.status(500).json({ error: 'Failed to import questions.' });
  }
});

module.exports = router;
