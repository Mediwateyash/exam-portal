const mongoose = require('mongoose');

const StudentAnswerSchema = new mongoose.Schema({
  submission_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamSubmission',
    required: true,
    index: true
  },
  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
    index: true
  },
  answer: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'javascript'
  },
  word_count: {
    type: Number,
    default: 0
  },
  marks_obtained: {
    type: Number,
    default: 0
  },
  is_evaluated: {
    type: Boolean,
    default: false
  },
  teacher_remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

StudentAnswerSchema.index({ submission_id: 1, question_id: 1 }, { unique: true });

StudentAnswerSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.submission_id = ret.submission_id ? ret.submission_id.toString() : null;
    ret.question_id = ret.question_id ? ret.question_id.toString() : null;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('StudentAnswer', StudentAnswerSchema);
