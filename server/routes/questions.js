const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Module = require('../models/Module');
const { requireAdmin } = require('../middleware/auth');

// Add a single question manually to a module
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      moduleId, type, question, marks, wordLimit,
      options, correctAnswer, codingDetails
    } = req.body;

    if (!moduleId || !type || !question) {
      return res.status(400).json({ error: 'Module ID, type, and question are required.' });
    }

    const mod = await Module.findById(moduleId);
    if (!mod) {
      return res.status(404).json({ error: 'Target module not found.' });
    }

    const marksNum = parseInt(marks || 1, 10);
    let optionsArr = [];
    let codingObj = null;
    let finalWordLimit = null;
    let finalCorrectAnswer = null;

    if (type === 'theory') {
      finalWordLimit = parseInt(wordLimit || 150, 10);
    } else if (type === 'mcq') {
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ error: 'MCQ questions require at least 2 options.' });
      }
      if (!correctAnswer) {
        return res.status(400).json({ error: 'MCQ questions require a correct answer.' });
      }
      optionsArr = options.map(o => String(o).trim());
      finalCorrectAnswer = String(correctAnswer).trim();
    } else if (type === 'coding') {
      codingObj = {
        inputDescription: codingDetails?.inputDescription || '',
        outputDescription: codingDetails?.outputDescription || '',
        constraints: codingDetails?.constraints || '',
        sampleInput: codingDetails?.sampleInput || '',
        sampleOutput: codingDetails?.sampleOutput || ''
      };
    }

    const created = await Question.create({
      module_id: mod._id,
      type,
      question: question.trim(),
      marks: marksNum,
      word_limit: finalWordLimit,
      options: optionsArr,
      correct_answer: finalCorrectAnswer,
      coding_details: codingObj
    });

    return res.status(201).json({
      message: 'Question added successfully!',
      question: {
        ...created.toJSON(),
        id: created._id.toString()
      }
    });
  } catch (err) {
    console.error('Add question error:', err);
    return res.status(500).json({ error: 'Failed to add question.' });
  }
});

// Update a question
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { question, marks, wordLimit, options, correctAnswer, codingDetails } = req.body;
    const existing = await Question.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    if (question) existing.question = question.trim();
    if (marks !== undefined) existing.marks = parseInt(marks, 10);
    if (existing.type === 'theory' && wordLimit !== undefined) existing.word_limit = parseInt(wordLimit, 10);
    if (existing.type === 'mcq') {
      if (options && Array.isArray(options)) existing.options = options.map(o => String(o).trim());
      if (correctAnswer !== undefined) existing.correct_answer = String(correctAnswer).trim();
    }
    if (existing.type === 'coding' && codingDetails) {
      existing.coding_details = {
        inputDescription: codingDetails.inputDescription || '',
        outputDescription: codingDetails.outputDescription || '',
        constraints: codingDetails.constraints || '',
        sampleInput: codingDetails.sampleInput || '',
        sampleOutput: codingDetails.sampleOutput || ''
      };
    }

    await existing.save();

    return res.json({
      message: 'Question updated successfully!',
      question: {
        ...existing.toJSON(),
        id: existing._id.toString()
      }
    });
  } catch (err) {
    console.error('Update question error:', err);
    return res.status(500).json({ error: 'Failed to update question.' });
  }
});

// Delete a question
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await Question.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Question not found.' });
    }
    return res.json({ message: 'Question deleted successfully.' });
  } catch (err) {
    console.error('Delete question error:', err);
    return res.status(500).json({ error: 'Failed to delete question.' });
  }
});

module.exports = router;
