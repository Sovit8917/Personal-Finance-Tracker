const express = require('express');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/transactions — combined expense + income history
router.get('/', async (req, res) => {
  try {
    const { type, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    let expenses = [];
    let income = [];

    if (type !== 'income') {
      const eFilter = { userId };
      if (Object.keys(dateFilter).length) eFilter.date = dateFilter;
      if (search) eFilter.title = { $regex: search, $options: 'i' };
      expenses = await Expense.find(eFilter).lean();
      expenses = expenses.map(e => ({ ...e, type: 'expense' }));
    }

    if (type !== 'expense') {
      const iFilter = { userId };
      if (Object.keys(dateFilter).length) iFilter.date = dateFilter;
      if (search) iFilter.title = { $regex: search, $options: 'i' };
      income = await Income.find(iFilter).lean();
      income = income.map(i => ({ ...i, type: 'income' }));
    }

    // Merge and sort by date
    const all = [...expenses, ...income].sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = all.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = all.slice(skip, skip + parseInt(limit));

    res.json({ transactions: paginated, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transactions/dashboard — summary stats
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [totalExpenses, totalIncome, monthExpenses, monthIncome] = await Promise.all([
      Expense.aggregate([{ $match: { userId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Income.aggregate([{ $match: { userId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([
        { $match: { userId, date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Income.aggregate([
        { $match: { userId, date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    // Monthly trend (last 6 months)
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const [exp, inc] = await Promise.all([
        Expense.aggregate([
          { $match: { userId, date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Income.aggregate([
          { $match: { userId, date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

      trend.push({
        month: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        expenses: exp[0]?.total || 0,
        income: inc[0]?.total || 0,
      });
    }

    res.json({
      totalExpenses: totalExpenses[0]?.total || 0,
      totalIncome: totalIncome[0]?.total || 0,
      monthExpenses: monthExpenses[0]?.total || 0,
      monthIncome: monthIncome[0]?.total || 0,
      savings: (totalIncome[0]?.total || 0) - (totalExpenses[0]?.total || 0),
      trend,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
