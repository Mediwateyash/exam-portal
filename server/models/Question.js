const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  module_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['theory', 'mcq', 'coding'],
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  marks: {
    type: Number,
    required: true,
    default: 1
  },
  word_limit: {
    type: Number,
    default: null
  },
  options: {
    type: [String],
    default: []
  },
  correct_answer: {
    type: String,
    default: null
  },
  coding_details: {
    inputDescription: { type: String, default: '' },
    outputDescription: { type: String, default: '' },
    constraints: { type: String, default: '' },
    sampleInput: { type: String, default: '' },
    sampleOutput: { type: String, default: '' }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

QuestionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.module_id = ret.module_id ? ret.module_id.toString() : null;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Question', QuestionSchema);
