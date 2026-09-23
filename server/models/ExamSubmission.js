const mongoose = require('mongoose');

const ExamSubmissionSchema = new mongoose.Schema({
  exam_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    index: true
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  started_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  submitted_at: {
    type: Date,
    default: null
  },
  score: {
    type: Number,
    default: 0
  },
  total_marks: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'evaluating', 'graded'],
    default: 'in_progress'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

ExamSubmissionSchema.index({ exam_id: 1, student_id: 1 }, { unique: true });

ExamSubmissionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.exam_id = ret.exam_id ? ret.exam_id.toString() : null;
    ret.student_id = ret.student_id ? ret.student_id.toString() : null;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('ExamSubmission', ExamSubmissionSchema);
