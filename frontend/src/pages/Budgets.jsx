import { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { formatCurrency, EXPENSE_CATEGORIES, CATEGORY_COLORS, getCurrentMonthYear } from '../utils/helpers';

const FIELDS = [
  { name: 'category', label: 'Category', type: 'select', options: EXPENSE_CATEGORIES, required: true },
  { name: 'limit', label: 'Monthly Limit (₹)', type: 'number', placeholder: '0.00', required: true, min: '0', step: '0.01' },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Budgets() {
  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/budgets?month=${month}&year=${year}`);
      setBudgets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBudgets(); }, [month, year]);

  const handleSave = async (form) => {
    setSaving(true);
    setError('');
    try {
      await api.post('/budgets', { ...form, month, year });
      setModal(false);
      fetchBudgets();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this budget?')) return;
    try { await api.delete(`/budgets/${id}`); fetchBudgets(); }
    catch (err) { alert(err.message); }
  };

  const getProgressClass = (pct) => {
    if (pct >= 90) return 'danger';
    if (pct >= 70) return 'warning';
    return 'safe';
  };

  const years = [curYear - 1, curYear, curYear + 1];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>Budgets</h1>
          <p style={{ color: 'var(--muted)', marginTop: 2 }}>Set monthly spending limits per category</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setModal(true); setError(''); }}>+ Set Budget</button>
      </div>

      {/* Month/Year Picker */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select className="form-input" value={month} onChange={e => setMonth(Number(e.target.value))} style={{ width: 160 }}>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select className="form-input" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 100 }}>
          {years.map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      {/* Budget Cards */}
      {loading ? <div className="spinner" /> : budgets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No budgets set</div>
          <div style={{ color: 'var(--muted)', marginBottom: 20 }}>Set a budget for {MONTHS[month - 1]} {year} to track your spending</div>
          <button className="btn btn-primary" onClick={() => { setModal(true); setError(''); }}>+ Set First Budget</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {budgets.map(b => {
            const pct = parseFloat(b.percentage);
            const progressClass = getProgressClass(pct);
            const color = CATEGORY_COLORS[b.category] || '#6b7394';
            return (
              <div className="card" key={b._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 8 }} />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{b.category}</span>
                  </div>
                  <button className="btn btn-danger btn-sm" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => handleDelete(b._id)}>Remove</button>
                </div>

                <div className="progress-bar" style={{ marginBottom: 10 }}>
                  <div className={`progress-fill ${progressClass}`} style={{ width: `${pct}%` }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--muted)' }}>Spent: <strong style={{ color: progressClass === 'danger' ? 'var(--red)' : 'var(--text)' }}>{formatCurrency(b.spent)}</strong></span>
                  <span style={{ color: 'var(--muted)' }}>Limit: <strong>{formatCurrency(b.limit)}</strong></span>
                </div>

                <div style={{ marginTop: 8, fontSize: 12, color: b.remaining < 0 ? 'var(--red)' : 'var(--accent)' }}>
                  {b.remaining < 0 ? `⚠ Over by ${formatCurrency(Math.abs(b.remaining))}` : `✓ ${formatCurrency(b.remaining)} remaining`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal
          title="Set Monthly Budget"
          fields={FIELDS}
          initialData={{}}
          onClose={() => setModal(false)}
          onSubmit={handleSave}
          loading={saving}
          error={error}
        />
      )}
    </div>
  );
}
