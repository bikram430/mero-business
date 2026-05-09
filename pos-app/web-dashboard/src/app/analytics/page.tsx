'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MerchantShell, Card } from '@/components/MerchantShell';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function Rs(paisa: number) { return `Rs ${(paisa / 100).toLocaleString('en-NP')}`; }

const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  return `${h}${i < 12 ? 'am' : 'pm'}`;
});

const URGENCY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  critical: { bg: '#FEE2E2', color: '#DC2626', label: 'Critical' },
  low:      { bg: '#FEF3C7', color: '#D97706', label: 'Low'      },
  ok:       { bg: '#D1FAE5', color: '#16A34A', label: 'OK'       },
};

// ── Icons ──────────────────────────────────────────────────────────────────────
const IcTrend    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IcBox      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IcClock    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcAlert    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcStar     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcRefresh  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>;

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');
  const [productView, setProductView] = useState<'revenue' | 'qty'>('revenue');

  async function load(p: string) {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) { router.replace('/login'); return; }
      const res = await fetch(`${BASE_URL}/analytics?period=${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch { /* stay on page, show empty state */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(period); }, [period]);

  const PERIODS = [
    { key: 'today', label: 'Today'       },
    { key: 'week',  label: 'Last 7 Days' },
    { key: 'month', label: 'Last 30 Days'},
  ];

  const maxHourRev  = data ? Math.max(...data.hourly_stats.map((h: any) => h.revenue), 1) : 1;
  const maxDayRev   = data ? Math.max(...data.day_stats.map((d: any) => d.revenue), 1) : 1;
  const topProducts = data ? (productView === 'revenue' ? data.top_by_revenue : data.top_by_qty) : [];
  const maxProdRev  = topProducts.length ? Math.max(...topProducts.map((p: any) => productView === 'revenue' ? p.total_revenue : p.total_qty), 1) : 1;

  const peakHourLabel = data?.peak_hour != null ? HOURS[data.peak_hour] : null;
  const peakDayLabel  = data?.peak_day  != null ? DAYS[data.peak_day]   : null;

  const payTotal = data ? Math.max(data.cash_revenue + data.digital_revenue + data.khata_revenue, 1) : 1;
  const cashPct  = data ? Math.round((data.cash_revenue    / payTotal) * 100) : 0;
  const digPct   = data ? Math.round((data.digital_revenue / payTotal) * 100) : 0;
  const khataPct = data ? Math.round((data.khata_revenue   / payTotal) * 100) : 0;

  const criticalStockCount = data?.stock_alerts?.filter((s: any) => s.urgency === 'critical').length || 0;

  return (
    <MerchantShell maxWidth={1300}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .bar-col:hover { opacity: 0.75; }
        .an-period-btn:hover { background: #EFF6FF !important; color: #1E40AF !important; }
      `}</style>

      {/* Page header */}
      <div className="mb-hero-row" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '0 0 4px', letterSpacing: -0.4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#2563EB', display: 'flex' }}><IcTrend /></span>
            Analytics
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>Sales intelligence — timing, top products, stock velocity</p>
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', padding: 4, borderRadius: 10 }}>
          {PERIODS.map(({ key, label }) => (
            <button key={key} className="an-period-btn"
              onClick={() => setPeriod(key as any)}
              style={{
                padding: '8px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: period === key ? 700 : 500,
                background: period === key ? '#fff' : 'transparent',
                color: period === key ? '#0F172A' : '#64748B',
                boxShadow: period === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 14 }}>
          <div style={{ width: 36, height: 36, border: '3px solid #DBEAFE', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#94A3B8', fontSize: 14, margin: 0 }}>Loading analytics...</p>
        </div>
      ) : !data ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', background: '#fff', borderRadius: 18, border: '1px solid #E2E8F0' }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>No data yet</p>
          <p style={{ color: '#64748B', margin: 0 }}>Complete some sales to see analytics.</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="mb-stat-grid" style={{ marginBottom: 20 }}>
            {[
              { label: 'Total Revenue',    value: Rs(data.total_revenue),    sub: `${PERIODS.find(p=>p.key===period)?.label}`, accent: '#2563EB', bg: '#EFF6FF' },
              { label: 'Total Orders',     value: data.total_orders,          sub: 'Completed sales',       accent: '#16A34A', bg: '#F0FDF4' },
              { label: 'Avg Order Value',  value: Rs(data.avg_order_value),  sub: 'Per transaction',       accent: '#7C3AED', bg: '#F5F3FF' },
              { label: 'Peak Hour',        value: peakHourLabel ?? '—',      sub: peakDayLabel ? `Busiest: ${peakDayLabel}` : 'Not enough data', accent: '#D97706', bg: '#FFFBEB' },
            ].map((c, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #E2E8F0', borderTop: `3px solid ${c.accent}`, borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.accent }} />
                </div>
                <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 3px', fontWeight: 500 }}>{c.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: c.accent, margin: '0 0 2px', letterSpacing: -0.3 }}>{c.value}</p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Hourly chart + Day of week */}
          <div className="mb-two-col" style={{ marginBottom: 20 }}>
            {/* Hourly sales */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#2563EB', display: 'flex' }}><IcClock /></span>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>Sales by Hour of Day</h2>
                </div>
                {peakHourLabel && (
                  <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IcStar /> Peak: {peakHourLabel}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120, overflowX: 'auto', paddingBottom: 4 }}>
                {data.hourly_stats.map((h: any) => {
                  const pct = (h.revenue / maxHourRev) * 100;
                  const isPeak = h.hour === data.peak_hour;
                  return (
                    <div key={h.hour} className="bar-col" title={`${HOURS[h.hour]}: ${Rs(h.revenue)}`}
                      style={{ flex: '1 0 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'default', minWidth: 18 }}>
                      <div style={{
                        width: '80%', height: Math.max(pct * 0.9, h.revenue > 0 ? 4 : 1),
                        background: isPeak ? '#D97706' : (h.revenue > 0 ? '#DBEAFE' : '#F1F5F9'),
                        borderRadius: '3px 3px 2px 2px', transition: 'height 0.3s',
                        border: isPeak ? '1px solid #F59E0B' : 'none',
                      }} />
                      {h.hour % 4 === 0 && (
                        <span style={{ fontSize: 8, color: '#94A3B8', whiteSpace: 'nowrap' }}>{HOURS[h.hour]}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {peakHourLabel && (
                <p style={{ fontSize: 12, color: '#6B7280', margin: '12px 0 0', background: '#FFFBEB', borderRadius: 8, padding: '8px 12px' }}>
                  Best time to staff up: <strong style={{ color: '#D97706' }}>{peakHourLabel}</strong> — restock and prep before this window for maximum throughput.
                </p>
              )}
            </Card>

            {/* Day of week */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ color: '#7C3AED', display: 'flex' }}><IcClock /></span>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>Busiest Day of Week</h2>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 120 }}>
                {data.day_stats.map((d: any, i: number) => {
                  const pct = (d.revenue / maxDayRev) * 100;
                  const isPeak = i === data.peak_day;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 9, color: '#94A3B8', textAlign: 'center' }}>{d.revenue > 0 ? Rs(d.revenue) : ''}</span>
                      <div style={{
                        width: '100%', height: Math.max(pct * 0.9, d.revenue > 0 ? 5 : 2),
                        background: isPeak ? '#7C3AED' : (d.revenue > 0 ? '#E9D5FF' : '#F1F5F9'),
                        borderRadius: '4px 4px 2px 2px',
                      }} />
                      <span style={{ fontSize: 10, color: isPeak ? '#7C3AED' : '#94A3B8', fontWeight: isPeak ? 700 : 400 }}>{DAYS[i]}</span>
                    </div>
                  );
                })}
              </div>
              {peakDayLabel && (
                <p style={{ fontSize: 12, color: '#6B7280', margin: '12px 0 0', background: '#F5F3FF', borderRadius: 8, padding: '8px 12px' }}>
                  Busiest day: <strong style={{ color: '#7C3AED' }}>{peakDayLabel}</strong> — ensure full stock and staffing on this day.
                </p>
              )}
            </Card>
          </div>

          {/* Top products */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#16A34A', display: 'flex' }}><IcBox /></span>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>Top Products</h2>
              </div>
              <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', padding: 3, borderRadius: 8 }}>
                {[{ key: 'revenue', label: 'By Revenue' }, { key: 'qty', label: 'By Quantity' }].map(({ key, label }) => (
                  <button key={key} onClick={() => setProductView(key as any)}
                    style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: productView === key ? 700 : 500, background: productView === key ? '#fff' : 'transparent', color: productView === key ? '#0F172A' : '#64748B', transition: 'all 0.15s' }}
                  >{label}</button>
                ))}
              </div>
            </div>

            {topProducts.length === 0 ? (
              <p style={{ color: '#94A3B8', textAlign: 'center', padding: '24px 0', margin: 0 }}>No product data for this period yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topProducts.map((p: any, i: number) => {
                  const val = productView === 'revenue' ? p.total_revenue : p.total_qty;
                  const pct = (val / maxProdRev) * 100;
                  const medal = i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7F32' : null;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 24, textAlign: 'center', flexShrink: 0 }}>
                        {medal
                          ? <span style={{ color: medal, display: 'flex', justifyContent: 'center' }}><IcStar /></span>
                          : <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{i + 1}</span>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_name}</span>
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                            <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 700 }}>{Rs(p.total_revenue)}</span>
                            <span style={{ fontSize: 12, color: '#64748B' }}>×{p.total_qty}</span>
                          </div>
                        </div>
                        <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: i === 0 ? '#2563EB' : '#BFDBFE', borderRadius: 3, transition: 'width 0.4s' }} />
                        </div>
                        {p.category && <span style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, display: 'block' }}>{p.category}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Payment breakdown */}
          <Card style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>Payment Method Breakdown</h2>
            <div style={{ display: 'flex', height: 28, borderRadius: 8, overflow: 'hidden', marginBottom: 14, gap: 2 }}>
              {cashPct  > 0 && <div style={{ width: `${cashPct}%`,  background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700, minWidth: 30, transition: 'width 0.4s' }}>{cashPct}%</div>}
              {digPct   > 0 && <div style={{ width: `${digPct}%`,   background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700, minWidth: 30, transition: 'width 0.4s' }}>{digPct}%</div>}
              {khataPct > 0 && <div style={{ width: `${khataPct}%`, background: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700, minWidth: 30, transition: 'width 0.4s' }}>{khataPct}%</div>}
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Cash',    value: data.cash_revenue,    pct: cashPct,  color: '#16A34A' },
                { label: 'Digital', value: data.digital_revenue, pct: digPct,   color: '#2563EB' },
                { label: 'Khata',   value: data.khata_revenue,   pct: khataPct, color: '#D97706' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#374151' }}>{m.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{Rs(m.value)}</span>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>({m.pct}%)</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Stock intelligence */}
          {data.stock_alerts?.length > 0 && (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: criticalStockCount > 0 ? '#DC2626' : '#D97706', display: 'flex' }}><IcAlert /></span>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>Stock Intelligence &amp; Restock Timing</h2>
                </div>
                {criticalStockCount > 0 && (
                  <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
                    {criticalStockCount} critical
                  </span>
                )}
              </div>

              <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 14px', background: '#F8FAFC', borderRadius: 8, padding: '8px 12px' }}>
                Based on your 30-day sales velocity. Restock <strong>before peak hours</strong> ({peakHourLabel ?? 'your busiest window'}) for maximum freshness and availability.
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {['Product', 'Category', 'In Stock', 'Sold /30d', 'Velocity/day', 'Days Left', 'Restock By', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: 0.5, whiteSpace: 'nowrap', borderBottom: '1px solid #E2E8F0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.stock_alerts.map((s: any, i: number) => {
                      const urg = URGENCY_STYLE[s.urgency] || URGENCY_STYLE.ok;
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: s.urgency === 'critical' ? '#FFF5F5' : '#fff' }}>
                          <td style={{ padding: '11px 12px', fontWeight: 600, color: '#0F172A' }}>{s.product_name}</td>
                          <td style={{ padding: '11px 12px', color: '#64748B' }}>{s.category || '—'}</td>
                          <td style={{ padding: '11px 12px', fontWeight: 700, color: s.stock_qty < 5 ? '#DC2626' : '#0F172A' }}>
                            {s.stock_qty >= 0 ? s.stock_qty : '—'}
                          </td>
                          <td style={{ padding: '11px 12px', color: '#374151' }}>{s.units_sold_30d}</td>
                          <td style={{ padding: '11px 12px', color: '#374151' }}>
                            {s.velocity_per_day > 0 ? `${s.velocity_per_day}/day` : '—'}
                          </td>
                          <td style={{ padding: '11px 12px', fontWeight: 700, color: s.urgency === 'critical' ? '#DC2626' : s.urgency === 'low' ? '#D97706' : '#16A34A' }}>
                            {s.days_remaining != null ? `${s.days_remaining}d` : '—'}
                          </td>
                          <td style={{ padding: '11px 12px', color: '#374151', fontFamily: 'monospace', fontSize: 12 }}>
                            {s.restock_by || '—'}
                          </td>
                          <td style={{ padding: '11px 12px' }}>
                            <span style={{ background: urg.bg, color: urg.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                              {urg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 16, padding: '12px 16px', background: '#EFF6FF', borderRadius: 10, fontSize: 12, color: '#1E40AF' }}>
                <strong>Restock tip:</strong> Order stock 1–2 days before the <strong>restock by</strong> date. Aim to receive deliveries in the morning, before your peak hour{peakHourLabel ? ` (${peakHourLabel})` : ''}, so products are fresh and shelves are full at your busiest time.
              </div>
            </Card>
          )}
        </>
      )}
    </MerchantShell>
  );
}
