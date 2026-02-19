const express = require('express');
const Income = require('../models/Income');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/income
router.get('/', async (req, res) => {
  try {
    const { source, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user._id };

    if (source) filter.source = source;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [income, total] = await Promise.all([
      Income.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Income.countDocuments(filter),
    ]);

    res.json({ income, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/income
router.post('/', async (req, res) => {
  try {
    const { title, amount, source, frequency, isRecurring, description, date } = req.body;
    const income = await Income.create({
      userId: req.user._id,
      title,
      amount: parseFloat(amount),
      source,
      frequency,
      isRecurring,
      description,
      date: date || Date.now(),
    });
    res.status(201).json(income);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/income/:id
router.put('/:id', async (req, res) => {
  try {
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...req.body, amount: parseFloat(req.body.amount) },
      { new: true, runValidators: true }
    );
    if (!income) return res.status(404).json({ error: 'Income not found.' });
    res.json(income);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/income/:id
router.delete('/:id', async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!income) return res.status(404).json({ error: 'Income not found.' });
    res.json({ message: 'Income deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
