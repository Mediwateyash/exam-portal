const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamSubmission = require('../models/ExamSubmission');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

// Register a new student
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
      role: 'student'
    });

    const userPayload = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      message: 'Registration successful!',
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Failed to complete registration.' });
  }
});

// Login for Admin or Student
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRecord = await User.findOne({ email: normalizedEmail });

    if (!userRecord) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = bcrypt.compareSync(password, userRecord.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userPayload = {
      id: userRecord._id.toString(),
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      message: 'Login successful!',
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Authentication failed.' });
  }
});

// Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userRecord = await User.findById(req.user.id).select('-password');
    if (!userRecord) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    return res.json({ user: userRecord });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// Admin Dashboard stats
router.get('/admin/stats', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  try {
    const totalExams = await Exam.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeExams = await Exam.countDocuments({ status: 'published' });
    const totalQuestions = await Question.countDocuments();
    const totalSubmissions = await ExamSubmission.countDocuments({ submitted_at: { $ne: null } });
    const pendingEvaluations = await ExamSubmission.countDocuments({ status: { $in: ['submitted', 'evaluating'] } });

    const recentExams = await Exam.find().sort({ createdAt: -1 }).limit(5).lean();

    return res.json({
      stats: {
        totalExams,
        totalStudents,
        activeExams,
        totalQuestions,
        totalSubmissions,
        pendingEvaluations
      },
      recentExams: recentExams.map(e => ({
        ...e,
        id: e._id.toString()
      }))
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch admin stats.' });
  }
});

module.exports = router;
