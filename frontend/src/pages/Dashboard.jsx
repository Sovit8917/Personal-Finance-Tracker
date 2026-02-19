import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../utils/api';
import { formatCurrency, CATEGORY_COLORS, getCurrentMonthYear } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, sub, color = 'var(--accent)' }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [categorySummary, setCategorySummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const { month, year } = getCurrentMonthYear();

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, catRes] = await Promise.all([
          api.get('/transactions/dashboard'),
          api.get(`/expenses/summary?month=${month}&year=${year}`),
        ]);
        setStats(dashRes.data);
        setCategorySummary(catRes.data.map(c => ({ name: c._id, value: c.total })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="spinner" />;

  const savings = (stats?.monthIncome || 0) - (stats?.monthExpenses || 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800 }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: 4 }}>Here's your financial overview</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard label="This Month Income" value={formatCurrency(stats?.monthIncome || 0)} color="var(--accent)" />
        <StatCard label="This Month Expenses" value={formatCurrency(stats?.monthExpenses || 0)} color="var(--red)" />
        <StatCard label="This Month Savings" value={formatCurrency(savings)} color={savings >= 0 ? 'var(--accent)' : 'var(--red)'} />
        <StatCard label="Total Savings" value={formatCurrency(stats?.savings || 0)} sub="All time" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Bar Chart */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            6-Month Trend
          </div>
          {stats?.trend?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.trend} barGap={4}>
                <XAxis dataKey="month" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={v => formatCurrency(v)}
                />
                <Bar dataKey="income" fill="var(--accent)" radius={[4,4,0,0]} name="Income" />
                <Bar dataKey="expenses" fill="var(--red)" radius={[4,4,0,0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>No data yet</p>}
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            Spending by Category
          </div>
          {categorySummary.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categorySummary} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                  {categorySummary.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#6b7394'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={v => formatCurrency(v)}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>No expenses this month</p>}
        </div>
      </div>
    </div>
  );
}
