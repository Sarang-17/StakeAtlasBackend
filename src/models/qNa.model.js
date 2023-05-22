const mongoose = require('mongoose');

const qNaSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    question_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    question: { type: String, required: true },
    answer: {
      ans: String,
      vote: {
        type: Number,
        default: 0,
      },
      answered_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      tag: String,
    },
  },
  {
    timestamps: true,
  }
);

const qNa = mongoose.model('QnA', qNaSchema);
module.exports = qNa;
