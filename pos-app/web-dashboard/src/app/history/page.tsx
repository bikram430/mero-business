'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { transactionsApi } from '@/lib/api';
import { MerchantShell, PageHeader, Card } from '@/components/MerchantShell';

interface Transaction {
  id: string; total_amount: number; discount_amount: number; payment_method: string;
  payment_status: string; customer_phone?: string; table_number?: string;
  created_at?: string; items: { product_name: string; qty: number; unit_price: number }[];
}

const STATUS: Record<string, { bg: string; color: string; border: string }> = {
  paid:      { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  pending:   { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  failed:    { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  cancelled: { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' },
};

const METHOD_COLOR: Record<string, string> = { cash: '#16A34A', esewa: '#7C3AED', fonepay: '#DC2626', khalti: '#7C3AED', khata: '#D97706' };

function formatRs(paisa: number) { return `Rs ${(paisa / 100).toFixed(0)}`; }
function formatDate(s?: string) {
  if (!s) return '—';
  return new Date(s).toLocaleString('en', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function HistoryPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.replace('/login'); return; }
    transactionsApi.recent(100)
      .then(({ data }) => setTransactions(data))
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = transactions.filter(t => t.payment_status === 'paid').reduce((s, t) => s + t.total_amount, 0);

  return (
    <MerchantShell maxWidth={960}>
      <PageHeader title={`Sales History`} subtitle={`${transactions.length} transactions`} />

      {/* Summary strip */}
      {transactions.length > 0 && (
        <div className="mb-stat-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Revenue', value: formatRs(totalRevenue), color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
            { label: 'Transactions', value: String(transactions.length), color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
            { label: 'Paid', value: String(transactions.filter(t => t.payment_status === 'paid').length), color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '16px 18px' }}>
              <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 4px', fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <Card><p style={{ textAlign: 'center', color: '#94A3B8', padding: '40px 0' }}>Loading...</p></Card>
      ) : transactions.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ width: 56, height: 56, background: '#EFF6FF', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <p style={{ color: '#0F172A', fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>No transactions yet</p>
          <p style={{ color: '#64748B', fontSize: 14 }}>Complete your first sale to see it here</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {transactions.map((t) => {
            const st = STATUS[t.payment_status] ?? STATUS.cancelled;
            const isExpanded = expanded === t.id;
            return (
              <div key={t.id} onClick={() => setExpanded(isExpanded ? null : t.id)} style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '14px 16px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{formatRs(t.total_amount)}</span>
                      {t.discount_amount > 0 && <span style={{ fontSize: 12, color: '#94A3B8' }}>−{formatRs(t.discount_amount)} discount</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: METHOD_COLOR[t.payment_method] ?? '#64748B', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: '2px 8px' }}>
                        {t.payment_method?.toUpperCase()}
                      </span>
                      {t.table_number && <span style={{ fontSize: 12, color: '#64748B' }}>Table {t.table_number}</span>}
                      {t.customer_phone && <span style={{ fontSize: 12, color: '#64748B' }}>{t.customer_phone}</span>}
                      <span style={{ fontSize: 12, color: '#94A3B8' }}>{formatDate(t.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {t.payment_status.toUpperCase()}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>

                {isExpanded && t.items?.length > 0 && (
                  <div style={{ borderTop: '1px solid #F1F5F9', marginTop: 14, paddingTop: 14 }}>
                    {t.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', marginBottom: 6, padding: '3px 0' }}>
                        <span style={{ color: '#0F172A', fontWeight: 500 }}>{item.product_name} <span style={{ color: '#94A3B8' }}>×{item.qty}</span></span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatRs(item.unit_price * item.qty)}</span>
                      </div>
                    ))}
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: '10px 0 0', fontFamily: 'monospace' }}>
                      Receipt #{t.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </MerchantShell>
  );
}
