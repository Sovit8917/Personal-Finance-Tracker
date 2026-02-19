import { useState, useEffect } from 'react';

export default function Modal({ title, onClose, onSubmit, fields, initialData = {}, loading, error }) {
  const [form, setForm] = useState(initialData);

  useEffect(() => { setForm(initialData); }, [initialData]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = e => { e.preventDefault(); onSubmit(form); };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {fields.map(field => (
            <div className="form-group" key={field.name}>
              <label className="form-label">{field.label}{field.required && ' *'}</label>
              {field.type === 'select' ? (
                <select className="form-input" name={field.name} value={form[field.name] || ''} onChange={handleChange} required={field.required}>
                  <option value="">Select {field.label}</option>
                  {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea className="form-input" name={field.name} value={form[field.name] || ''} onChange={handleChange} placeholder={field.placeholder} rows={3} style={{ resize: 'vertical' }} />
              ) : field.type === 'checkbox' ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" name={field.name} checked={!!form[field.name]} onChange={handleChange} />
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>{field.placeholder}</span>
                </label>
              ) : (
                <input className="form-input" type={field.type || 'text'} name={field.name} value={form[field.name] || ''} onChange={handleChange} placeholder={field.placeholder} required={field.required} min={field.min} step={field.step} />
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-ghost" type="button" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
