import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', search: '', startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, ...filters });
      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>Transaction History</h1>
        <p style={{ color: 'var(--muted)', marginTop: 2 }}>{total} total transaction{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div className="form-label" style={{ marginBottom: 6 }}>Search</div>
          <input className="form-input" placeholder="Search by title..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
        </div>
        <div style={{ minWidth: 130 }}>
          <div className="form-label" style={{ marginBottom: 6 }}>Type</div>
          <select className="form-input" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
            <option value="">All</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
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
        <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ type: '', search: '', startDate: '', endDate: '' }); setPage(1); }}>Clear</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? <div className="spinner" /> : (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Category / Source</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No transactions found</td></tr>
                ) : transactions.map(tx => (
                  <tr key={tx._id}>
                    <td>
                      <span className={`badge ${tx.type === 'income' ? 'badge-green' : 'badge-red'}`}>
                        {tx.type === 'income' ? '↑ Income' : '↓ Expense'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{tx.title}</div>
                      {tx.description && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{tx.description}</div>}
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{tx.category || tx.source}</td>
                    <td style={{ color: 'var(--muted)' }}>{formatDate(tx.date)}</td>
                    <td style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: tx.type === 'income' ? 'var(--accent)' : 'var(--red)',
                    }}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
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
    </div>
  );
}
