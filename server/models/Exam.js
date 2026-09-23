const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  total_marks: {
    type: Number,
    required: true,
    default: 100
  },
  passing_marks: {
    type: Number,
    required: true,
    default: 40
  },
  exam_date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  start_time: {
    type: String,
    default: '10:00 AM'
  },
  end_time: {
    type: String,
    default: '11:30 AM'
  },
  instructions: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'completed', 'archived'],
    default: 'published'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

ExamSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Exam', ExamSchema);
