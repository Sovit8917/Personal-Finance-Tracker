const express = require('express');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/budgets?month=&year= — get budgets with spending progress
router.get('/', async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const budgets = await Budget.find({ userId: req.user._id, month, year });

    // Get actual spending per category for this month
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const spending = await Expense.aggregate([
      { $match: { userId: req.user._id, date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', spent: { $sum: '$amount' } } },
    ]);

    const spendingMap = {};
    spending.forEach(s => { spendingMap[s._id] = s.spent; });

    const result = budgets.map(b => ({
      ...b.toObject(),
      spent: spendingMap[b.category] || 0,
      remaining: b.limit - (spendingMap[b.category] || 0),
      percentage: Math.min(((spendingMap[b.category] || 0) / b.limit) * 100, 100).toFixed(1),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/budgets
router.post('/', async (req, res) => {
  try {
    const { category, limit, month, year } = req.body;
    // Upsert — update if exists, create if not
    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, category, month: parseInt(month), year: parseInt(year) },
      { limit: parseFloat(limit) },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json(budget);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!budget) return res.status(404).json({ error: 'Budget not found.' });
    res.json({ message: 'Budget deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
