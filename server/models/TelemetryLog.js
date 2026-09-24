const mongoose = require('mongoose');

const TelemetryLogSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  exam_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    index: true
  },
  submission_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamSubmission',
    index: true
  },
  module_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    index: true
  },
  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    index: true
  },
  event_type: {
    type: String,
    enum: [
      'login',
      'exam_start',
      'module_start',
      'question_view',
      'answer_select',
      'theory_input',
      'code_edit',
      'clear_response',
      'mark_review',
      'tab_switch',
      'fullscreen_exit',
      'exam_submit',
      'reattempt'
    ],
    required: true,
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  time_spent_seconds: {
    type: Number,
    default: 0
  },
  ip_address: {
    type: String,
    default: ''
  },
  user_agent: {
    type: String,
    default: ''
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

TelemetryLogSchema.index({ student_id: 1, exam_id: 1, created_at: -1 });

TelemetryLogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.student_id) ret.student_id = ret.student_id.toString();
    if (ret.exam_id) ret.exam_id = ret.exam_id.toString();
    if (ret.submission_id) ret.submission_id = ret.submission_id.toString();
    if (ret.question_id) ret.question_id = ret.question_id.toString();
    if (ret.module_id) ret.module_id = ret.module_id.toString();
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('TelemetryLog', TelemetryLogSchema);
