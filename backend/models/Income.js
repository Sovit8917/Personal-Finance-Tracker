const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: [true, 'Title is required'], trim: true },
    amount: { type: Number, required: [true, 'Amount is required'], min: [0, 'Amount must be positive'] },
    source: {
      type: String,
      required: true,
      enum: ['Salary', 'Freelance', 'Bonus', 'Investment', 'Rental', 'Other'],
      default: 'Other',
    },
    frequency: {
      type: String,
      enum: ['One-time', 'Daily', 'Weekly', 'Monthly', 'Yearly'],
      default: 'Monthly',
    },
    isRecurring: { type: Boolean, default: false },
    description: { type: String, trim: true, default: '' },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Income', incomeSchema);
