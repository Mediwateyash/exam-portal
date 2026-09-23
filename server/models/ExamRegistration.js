const mongoose = require('mongoose');

const ExamRegistrationSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['registered', 'in_progress', 'completed'],
    default: 'registered'
  },
  registered_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

ExamRegistrationSchema.index({ exam_id: 1, student_id: 1 }, { unique: true });

ExamRegistrationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.exam_id = ret.exam_id ? ret.exam_id.toString() : null;
    ret.student_id = ret.student_id ? ret.student_id.toString() : null;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('ExamRegistration', ExamRegistrationSchema);
