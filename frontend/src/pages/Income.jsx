import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { formatCurrency, formatDate, INCOME_SOURCES, INCOME_FREQUENCIES } from '../utils/helpers';

const FIELDS = [
  { name: 'title', label: 'Title', placeholder: 'e.g. Monthly Salary', required: true },
  { name: 'amount', label: 'Amount (₹)', type: 'number', placeholder: '0.00', required: true, min: '0', step: '0.01' },
  { name: 'source', label: 'Source', type: 'select', options: INCOME_SOURCES, required: true },
  { name: 'frequency', label: 'Frequency', type: 'select', options: INCOME_FREQUENCIES },
  { name: 'isRecurring', label: 'Recurring', type: 'checkbox', placeholder: 'This is a recurring income' },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional note...' },
];

export default function Income() {
  const [income, setIncome] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ source: '', search: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchIncome = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, ...filters });
      const res = await api.get(`/income?${params}`);
      setIncome(res.data.income);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchIncome(); }, [fetchIncome]);

  const handleSave = async (form) => {
    setSaving(true);
    setError('');
    try {
      if (modal === 'edit') await api.put(`/income/${selected._id}`, form);
      else await api.post('/income', form);
      setModal(null);
      setSelected(null);
      fetchIncome();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this income record?')) return;
    try { await api.delete(`/income/${id}`); fetchIncome(); }
    catch (err) { alert(err.message); }
  };

  const openAdd = () => { setSelected({ date: new Date().toISOString().split('T')[0], frequency: 'Monthly' }); setModal('add'); setError(''); };
  const openEdit = (item) => { setSelected(item); setModal('edit'); setError(''); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>Income</h1>
          <p style={{ color: 'var(--muted)', marginTop: 2 }}>{total} record{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Income</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div className="form-label" style={{ marginBottom: 6 }}>Search</div>
          <input className="form-input" placeholder="Search..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
        </div>
        <div style={{ minWidth: 140 }}>
          <div className="form-label" style={{ marginBottom: 6 }}>Source</div>
          <select className="form-input" value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}>
            <option value="">All Sources</option>
            {INCOME_SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ source: '', search: '' }); setPage(1); }}>Clear</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? <div className="spinner" /> : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Source</th>
                  <th>Frequency</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {income.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No income records found</td></tr>
                ) : income.map(item => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{item.title}</div>
                      {item.isRecurring && <span style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2, display: 'block' }}>↺ Recurring</span>}
                    </td>
                    <td><span className="badge badge-green">{item.source}</span></td>
                    <td style={{ color: 'var(--muted)' }}>{item.frequency}</td>
                    <td style={{ color: 'var(--muted)' }}>{formatDate(item.date)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
          title={modal === 'edit' ? 'Edit Income' : 'Add Income'}
          fields={FIELDS}
          initialData={modal === 'edit' ? { ...selected, date: selected.date ? new Date(selected.date).toISOString().split('T')[0] : '' } : selected}
          onClose={() => { setModal(null); setSelected(null); }}
          onSubmit={handleSave}
          loading={saving}
          error={error}
        />
      )}
    </div>
  );
}
