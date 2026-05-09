'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { MerchantShell, PageHeader, Card, lx } from '@/components/MerchantShell';

function formatRs(paisa: number) { return `Rs ${(paisa / 100).toLocaleString('ne-NP')}`; }
function formatDate(s?: string) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS: Record<string, { bg: string; color: string; border: string; label: string }> = {
  active:  { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'BAKI' },
  partial: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', label: 'PARTIAL' },
  paid:    { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: 'PAID' },
};

export default function KhataPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer_phone: '', customer_name: '', amount_rs: '', due_date: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.replace('/login'); return; }
    load();
  }, [filter]);

  async function load() {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/khata' : `/khata?status_filter=${filter}`;
      const { data: d } = await api.get(url);
      setData(d);
    } catch (e: any) { if (e?.response?.status === 401) router.replace('/login'); }
    finally { setLoading(false); }
  }

  async function handleAddKhata() {
    if (!form.customer_phone || form.customer_phone.length < 10) { setError('Valid phone number haalna'); return; }
    const paisa = Math.round(parseFloat(form.amount_rs) * 100);
    if (!form.amount_rs || isNaN(paisa) || paisa <= 0) { setError('Valid amount haalna'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/khata', { customer_phone: form.customer_phone, customer_name: form.customer_name || undefined, amount_due: paisa, due_date: form.due_date || undefined, notes: form.notes || undefined });
      setShowForm(false); setForm({ customer_phone: '', customer_name: '', amount_rs: '', due_date: '', notes: '' }); load();
    } catch (e: any) { setError(e.response?.data?.detail || 'Save bhayena'); }
    finally { setSaving(false); }
  }

  async function recordPayment(id: string, remaining: number) {
    const rsStr = window.prompt(`Kati payment garyo? (baki: ${formatRs(remaining)})\nRs ma haalna:`);
    if (!rsStr) return;
    const paisa = Math.round(parseFloat(rsStr) * 100);
    if (!paisa || paisa <= 0) { alert('Invalid amount'); return; }
    try { await api.post(`/khata/${id}/pay`, { amount_paid: paisa }); load(); }
    catch (e: any) { alert(e.response?.data?.detail || 'Record bhayena'); }
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <MerchantShell maxWidth={1000}>
      <PageHeader
        title="Khata (Udhari)"
        subtitle="Track credit given to customers"
        action={<button style={lx.btnDanger} onClick={() => setShowForm(!showForm)}>+ Naya Khata</button>}
      />

      {/* Summary */}
      {data && (
        <div className="mb-stat-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Outstanding', value: formatRs(data.total_outstanding), sub: `${data.total_active} customers`, accent: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
            { label: 'Total Credit Given', value: formatRs(data.total_amount_due), accent: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
            { label: 'Collected', value: formatRs(data.total_amount_paid), accent: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
          ].map((c, i) => (
            <div key={i} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 16, padding: '18px 20px' }}>
              <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 4px', fontWeight: 500 }}>{c.label}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: c.accent, margin: '0 0 2px' }}>{c.value}</p>
              {c.sub && <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>{c.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <Card style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 18px' }}>Naya Khata Entry</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14, marginBottom: 14 }}>
            {[
              { key: 'customer_phone', label: 'Phone *', type: 'text', ph: '98XXXXXXXX' },
              { key: 'customer_name', label: 'Customer Name', type: 'text', ph: 'Optional' },
              { key: 'amount_rs', label: 'Amount (Rs) *', type: 'number', ph: 'e.g. 500' },
              { key: 'due_date', label: 'Due Date', type: 'date', ph: '' },
            ].map(({ key, label, type, ph }) => (
              <div key={key}>
                <label style={lx.label}>{label}</label>
                <input style={lx.input} type={type} placeholder={ph} value={(form as any)[key]} onChange={(e) => set(key, e.target.value)} />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lx.label}>Notes</label>
              <textarea style={{ ...lx.input, height: 60, resize: 'vertical' }} placeholder="Items, details..." value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </div>
          {error && <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 10 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={lx.btnDanger} onClick={handleAddKhata} disabled={saving}>{saving ? 'Saving...' : 'Add Khata'}</button>
            <button style={lx.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </Card>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[{ key: 'active', label: 'Baki' }, { key: 'all', label: 'Sabai' }, { key: 'paid', label: 'Paid' }].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: filter === f.key ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
            background: filter === f.key ? '#EFF6FF' : '#fff',
            color: filter === f.key ? '#2563EB' : '#64748B',
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <Card><p style={{ textAlign: 'center', color: '#94A3B8', padding: '32px 0' }}>Loading...</p></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(data?.khata_list ?? []).map((k: any) => {
            const st = STATUS[k.status] ?? STATUS.active;
            return (
              <div key={k.id} style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: k.status !== 'paid' ? 14 : 0, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 3px' }}>{k.customer_name || 'Unknown Customer'}</p>
                    <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 3px' }}>{k.customer_phone}</p>
                    {k.due_date && <p style={{ fontSize: 12, color: '#D97706', fontWeight: 600, margin: '2px 0' }}>Due: {formatDate(k.due_date)}</p>}
                    {k.notes && <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0' }}>{k.notes}</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-block', marginBottom: 6 }}>{st.label}</span>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#DC2626', margin: '0 0 2px' }}>{formatRs(k.amount_remaining)}</p>
                    <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>of {formatRs(k.amount_due)}</p>
                  </div>
                </div>
                {k.status !== 'paid' && (
                  <button onClick={() => recordPayment(k.id, k.amount_remaining)} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14, width: '100%' }}>
                    Record Payment
                  </button>
                )}
              </div>
            );
          })}
          {(data?.khata_list ?? []).length === 0 && (
            <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>{filter === 'active' ? 'Koi baki chaina' : 'Koi khata chaina'}</p>
              <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>{filter === 'active' ? 'Sabai customers le payment gareka chan!' : 'Khata add garnus'}</p>
            </Card>
          )}
        </div>
      )}
    </MerchantShell>
  );
}
