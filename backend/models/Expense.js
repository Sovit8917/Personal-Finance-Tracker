const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: [true, 'Title is required'], trim: true },
    amount: { type: Number, required: [true, 'Amount is required'], min: [0, 'Amount must be positive'] },
    category: {
      type: String,
      required: true,
      enum: ['Groceries', 'Utilities', 'Entertainment', 'Dining Out', 'Transportation', 'Healthcare', 'Clothing', 'Education', 'Rent', 'Other'],
      default: 'Other',
    },
    description: { type: String, trim: true, default: '' },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
