const express = require('express');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect); // All expense routes require auth

// GET /api/expenses — get all with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user._id };

    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Expense.countDocuments(filter),
    ]);

    res.json({ expenses, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/expenses
router.post('/', async (req, res) => {
  try {
    const { title, amount, category, description, date } = req.body;
    const expense = await Expense.create({
      userId: req.user._id,
      title,
      amount: parseFloat(amount),
      category,
      description,
      date: date || Date.now(),
    });
    res.status(201).json(expense);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...req.body, amount: parseFloat(req.body.amount) },
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });
    res.json({ message: 'Expense deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/expenses/summary — category totals
router.get('/summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const summary = await Expense.aggregate([
      { $match: { userId: req.user._id, date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
