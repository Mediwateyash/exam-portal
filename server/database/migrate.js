const { db } = require('./db');

db.exec('PRAGMA foreign_keys=OFF;');
db.exec('DROP TABLE IF EXISTS student_answers;');
db.exec('DROP TABLE IF EXISTS exam_submissions;');
db.exec(`
  CREATE TABLE exam_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    started_at DATETIME NOT NULL,
    submitted_at DATETIME,
    score REAL DEFAULT 0,
    total_marks REAL DEFAULT 0,
    percentage REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'submitted', 'evaluating', 'graded')),
    UNIQUE(exam_id, student_id),
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE student_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    answer TEXT,
    language TEXT,
    word_count INTEGER DEFAULT 0,
    marks_obtained REAL DEFAULT 0,
    is_evaluated INTEGER DEFAULT 0,
    teacher_remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id, question_id),
    FOREIGN KEY (submission_id) REFERENCES exam_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
  );
`);
db.exec('PRAGMA foreign_keys=ON;');
console.log('Migration successful: exam_submissions and student_answers updated.');
