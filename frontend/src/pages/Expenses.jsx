import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { formatCurrency, formatDate, EXPENSE_CATEGORIES } from '../utils/helpers';

const FIELDS = [
  { name: 'title', label: 'Title', placeholder: 'e.g. Grocery run', required: true },
  { name: 'amount', label: 'Amount (₹)', type: 'number', placeholder: '0.00', required: true, min: '0', step: '0.01' },
  { name: 'category', label: 'Category', type: 'select', options: EXPENSE_CATEGORIES, required: true },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional note...' },
];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ category: '', search: '', startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, ...filters });
      const res = await api.get(`/expenses?${params}`);
      setExpenses(res.data.expenses);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleSave = async (form) => {
    setSaving(true);
    setError('');
    try {
      if (modal === 'edit') {
        await api.put(`/expenses/${selected._id}`, form);
      } else {
        await api.post('/expenses', form);
      }
      setModal(null);
      setSelected(null);
      fetchExpenses();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEdit = (exp) => {
    setSelected(exp);
    setModal('edit');
    setError('');
  };

  const openAdd = () => {
    setSelected({ date: new Date().toISOString().split('T')[0] });
    setModal('add');
    setError('');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>Expenses</h1>
          <p style={{ color: 'var(--muted)', marginTop: 2 }}>{total} record{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Expense</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div className="form-label" style={{ marginBottom: 6 }}>Search</div>
          <input className="form-input" placeholder="Search..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
        </div>
        <div style={{ minWidth: 140 }}>
          <div className="form-label" style={{ marginBottom: 6 }}>Category</div>
          <select className="form-input" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
            <option value="">All</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 130 }}>
          <div className="form-label" style={{ marginBottom: 6 }}>From</div>
          <input className="form-input" type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
        </div>
        <div style={{ minWidth: 130 }}>
          <div className="form-label" style={{ marginBottom: 6 }}>To</div>
          <input className="form-input" type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ category: '', search: '', startDate: '', endDate: '' }); setPage(1); }}>
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? <div className="spinner" /> : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No expenses found</td></tr>
                ) : expenses.map(exp => (
                  <tr key={exp._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{exp.title}</div>
                      {exp.description && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{exp.description}</div>}
                    </td>
                    <td><span className="badge badge-yellow">{exp.category}</span></td>
                    <td style={{ color: 'var(--muted)' }}>{formatDate(exp.date)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)', fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(exp)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(exp._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            <span style={{ padding: '6px 12px', color: 'var(--muted)', fontSize: 13 }}>Page {page} of {pages}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>Next →</button>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal === 'edit' ? 'Edit Expense' : 'Add Expense'}
          fields={FIELDS}
          initialData={modal === 'edit' ? { ...selected, date: selected.date ? new Date(selected.date).toISOString().split('T')[0] : '', amount: selected.amount } : selected}
          onClose={() => { setModal(null); setSelected(null); }}
          onSubmit={handleSave}
          loading={saving}
          error={error}
        />
      )}
    </div>
  );
}
