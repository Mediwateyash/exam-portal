const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./database/db');
const { seed } = require('./database/seed');

const authRoutes = require('./routes/auth');
const examsRoutes = require('./routes/exams');
const questionsRoutes = require('./routes/questions');
const studentRoutes = require('./routes/student');
const submissionsRoutes = require('./routes/submissions');
const resultsRoutes = require('./routes/results');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'ExamDesk',
    tagline: 'Your Digital Examination Desk',
    database: 'MongoDB Atlas',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/results', resultsRoutes);

// Static frontend build serve
const clientDist = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDist));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexHtml = path.join(clientDist, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send('ExamDesk API Server is running on MongoDB Atlas. Access frontend via Vite dev server at http://localhost:5173');
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Connect to MongoDB Atlas, seed defaults, and start server
connectDB()
  .then(() => seed())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`  EXAMDESK — Online Examination Portal   `);
      console.log(`  Connected to MongoDB Atlas: [examdesk] `);
      console.log(`  Server running on http://localhost:${PORT}`);
      console.log(`=========================================`);
    });
  })
  .catch(err => {
    console.error('Failed to start server on MongoDB Atlas:', err);
  });
