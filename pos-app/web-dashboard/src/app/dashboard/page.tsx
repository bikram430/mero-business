'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi, dashboardApi, productsApi, transactionsApi, storeApi } from '@/lib/api';
import { MerchantShell, getMerchantType, getMerchantName } from '@/components/MerchantShell';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function Rs(p: number) { return `Rs ${(p / 100).toLocaleString('en-NP')}`; }

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(iso?: string) {
  if (!iso) return '—';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short' });
}

function shortId(id: string) { return `#${id.slice(0, 6).toUpperCase()}`; }

// ── Icons ──────────────────────────────────────────────────────────────────────
const IcSale     = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>;
const IcProducts = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IcAnalytics= () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IcHistory  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcStore    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IcKhata    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IcCheck    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcAlert    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcPlus     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcChevron  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>;
const IcRefresh  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>;

const METHOD: Record<string, { label: string; color: string; bg: string }> = {
  cash:    { label: 'Cash',    color: '#16A34A', bg: '#F0FDF4' },
  esewa:   { label: 'eSewa',   color: '#7C3AED', bg: '#F5F3FF' },
  fonepay: { label: 'FonePay', color: '#DC2626', bg: '#FEF2F2' },
  khalti:  { label: 'Khalti',  color: '#7C3AED', bg: '#F5F3FF' },
  khata:   { label: 'Khata',   color: '#D97706', bg: '#FFFBEB' },
};

const ORDER_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#FEF3C7', color: '#D97706', label: 'Pending'  },
  accepted:  { bg: '#DBEAFE', color: '#2563EB', label: 'Accepted' },
  ready:     { bg: '#EDE9FE', color: '#7C3AED', label: 'Ready'    },
  collected: { bg: '#D1FAE5', color: '#16A34A', label: 'Collected'},
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled'},
};

// ── Quick action card ─────────────────────────────────────────────────────────
function ActionCard({ href, icon, label, accent, sub }: { href: string; icon: React.ReactNode; label: string; accent: string; sub?: string }) {
  return (
    <Link href={href} className="mb-action-card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: '20px 12px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = accent; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${accent}22`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 14, background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
        {icon}
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>{label}</p>
        {sub && <p style={{ fontSize: 10, color: '#94A3B8', margin: '3px 0 0' }}>{sub}</p>}
      </div>
    </Link>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [merchantType, setMerchantType] = useState<'retail' | 'restaurant'>('retail');
  const [merchantName, setMerchantName] = useState('');
  const [storeInfo, setStoreInfo] = useState<any>(null);

  // Dashboard snapshot
  const [dash, setDash] = useState<any>(null);
  const [loadingDash, setLoadingDash] = useState(true);

  // Pending orders
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  // Recent transactions
  const [recentTx, setRecentTx] = useState<any[]>([]);

  // Low stock
  const [lowStock, setLowStock] = useState<any[]>([]);

  // Revenue visibility toggle
  const [hideRevenue, setHideRevenue] = useState(false);

  // Auto-refresh pending orders every 10 seconds
  async function fetchPendingOrders() {
    const orders = await storeApi.collectOrders('pending').catch(() => null);
    setPendingOrders(Array.isArray(orders?.data) ? orders.data : []);
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.replace('/login'); return; }
    setMerchantType(getMerchantType());
    setMerchantName(getMerchantName());

    Promise.all([
      authApi.me().catch(() => null),
      dashboardApi.get().catch(() => null),
      storeApi.collectOrders('pending').catch(() => null),
      transactionsApi.recent(8).catch(() => null),
      productsApi.list().catch(() => null),
    ]).then(([me, dash, orders, txs, prods]) => {
      if (!me) { router.replace('/login'); return; }
      setStoreInfo(me?.data);
      setDash(dash?.data);
      setPendingOrders(Array.isArray(orders?.data) ? orders.data : []);
      setRecentTx(Array.isArray(txs?.data) ? txs.data.slice(0, 8) : []);
      const prods_ = Array.isArray(prods?.data) ? prods.data : [];
      setLowStock(prods_.filter((p: any) => p.stock_qty !== null && p.stock_qty !== undefined && p.stock_qty <= 5).sort((a: any, b: any) => a.stock_qty - b.stock_qty));
    }).finally(() => {
      setLoadingDash(false);
      setLoadingOrders(false);
    });

    const interval = setInterval(fetchPendingOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  async function updateOrderStatus(orderId: string, newStatus: string) {
    setUpdatingOrder(orderId);
    try {
      await storeApi.updateOrderStatus(orderId, newStatus);
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    } catch { /* keep order in list */ }
    finally { setUpdatingOrder(null); }
  }

  const isRest = merchantType === 'restaurant';
  const todayTx = dash?.today_transactions ?? 0;
  const todayTotal = dash?.today_total ?? 0;
  const accentColor = isRest ? '#4F46E5' : '#16A34A';
  const saleBtnBg = isRest ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : 'linear-gradient(135deg,#16A34A,#15803D)';

  const ACTIONS = [
    { href: '/sale',           icon: <IcSale />,     label: isRest ? 'New Order' : 'New Sale',  accent: accentColor,  sub: 'Start selling' },
    { href: '/products',       icon: <IcProducts />, label: 'Products',   accent: '#0EA5E9', sub: 'Manage stock'  },
    { href: '/analytics',      icon: <IcAnalytics />,label: 'Analytics',  accent: '#8B5CF6', sub: 'Sales insights' },
    { href: '/history',        icon: <IcHistory />,  label: 'History',    accent: '#F59E0B', sub: 'All transactions'},
    { href: '/khata',          icon: <IcKhata />,    label: 'Khata',      accent: '#D97706', sub: 'Credit ledger'  },
    { href: '/store-settings', icon: <IcStore />,    label: 'My Store',   accent: '#64748B', sub: 'Settings & offers'},
  ];

  return (
    <MerchantShell>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .tx-row:hover { background: #F8FAFC !important; }
        .mb-stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
        @media (max-width: 900px) {
          .mb-action-grid { grid-template-columns: repeat(3,1fr) !important; }
          .dash-top-split { grid-template-columns: 1fr !important; }
          .mb-stat-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 480px) {
          .mb-action-grid { grid-template-columns: repeat(3,1fr) !important; gap: 8px !important; }
          .mb-stat-grid { grid-template-columns: repeat(2,1fr) !important; gap: 8px !important; }
          .dash-hero-bar { padding: 14px 16px 12px !important; gap: 10px !important; }
          .dash-hero-title { font-size: 19px !important; letter-spacing: -0.2px !important; }
          .dash-date-row { gap: 6px !important; }
          .dash-date-text { display: none !important; }
          .dash-date-short { display: block !important; }
          .dash-sale-btn { padding: 10px 14px !important; font-size: 13px !important; border-radius: 11px !important; }
          .dash-sale-btn-long { display: none !important; }
          .dash-sale-btn-short { display: inline !important; }
        }
        .dash-date-short { display: none; }
        .dash-sale-btn-short { display: none; }
        @media (max-width: 900px) { .dash-queue-col { border-right: none !important; border-bottom: 1px solid #F1F5F9; } }
        @media (max-width: 480px) { .mb-action-card { padding: 14px 8px !important; gap: 7px !important; border-radius: 12px !important; } }
      `}</style>

      {/* ── Top command card: greeting + queue + transactions ── */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: 20, overflow: 'hidden' }}>

        {/* Top bar: greeting + Start New Sale */}
        <div className="dash-hero-bar" style={{ padding: '22px 28px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="dash-date-row" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <p className="dash-date-text" style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
                {new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="dash-date-short" style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>
                {new Date().toLocaleDateString('en', { day: 'numeric', month: 'short' })}
              </p>
              {storeInfo && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: storeInfo.is_public ? '#D1FAE5' : '#F1F5F9', color: storeInfo.is_public ? '#16A34A' : '#94A3B8', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: storeInfo.is_public ? '#16A34A' : '#CBD5E1', animation: storeInfo.is_public ? 'pulse 2s ease infinite' : 'none', flexShrink: 0 }} />
                  {storeInfo.is_public ? 'Live' : 'Hidden'}
                </span>
              )}
              <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, textTransform: 'capitalize' }}>{isRest ? 'Restaurant' : 'Retail'}</span>
            </div>
            <h1 className="dash-hero-title" style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: -0.6, lineHeight: 1.1 }}>
              {getGreeting()}{merchantName ? `, ${merchantName.split(' ')[0]}` : ''}
            </h1>
          </div>
          <Link href="/sale" className="dash-sale-btn" style={{ background: saleBtnBg, color: '#fff', textDecoration: 'none', borderRadius: 14, padding: '13px 26px', fontWeight: 800, fontSize: 15, boxShadow: isRest ? '0 4px 20px rgba(79,70,229,0.35)' : '0 4px 20px rgba(22,163,74,0.35)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, letterSpacing: -0.2 }}>
            <IcPlus />
            <span className="dash-sale-btn-long">{isRest ? 'Open Table / New Order' : 'Start New Sale'}</span>
            <span className="dash-sale-btn-short">{isRest ? 'New Order' : 'New Sale'}</span>
          </Link>
        </div>

        {/* Bottom split: Queue | Transactions */}
        <div className="dash-top-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

          {/* Click & Collect Queue */}
          <div className="dash-queue-col" style={{ borderRight: '1px solid #F1F5F9' }}>
            <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: '0 0 1px' }}>Click &amp; Collect Queue</h2>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>First in, first served — oldest at top</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {pendingOrders.length > 0 && (
                  <span style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20, animation: 'pulse 2s ease infinite' }}>
                    {pendingOrders.length} pending
                  </span>
                )}
                <button onClick={() => fetchPendingOrders()} title="Refresh" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
                  <IcRefresh />
                </button>
              </div>
            </div>

            {loadingOrders ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '36px 0' }}>
                <div style={{ width: 26, height: 26, border: '3px solid #DBEAFE', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : pendingOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 20px' }}>
                <div style={{ width: 44, height: 44, background: '#F0FDF4', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#16A34A' }}>
                  <IcCheck />
                </div>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', margin: '0 0 3px' }}>All clear</p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>No pending orders right now</p>
              </div>
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {pendingOrders.map((order, idx) => (
                  <div key={order.id} style={{ padding: '14px 20px', borderBottom: '1px solid #F8FAFC', background: idx === 0 ? '#FFFBEB' : '#fff', position: 'relative' }}>
                    {idx === 0 && (
                      <div style={{ position: 'absolute', top: 12, right: 14, background: '#DC2626', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4, letterSpacing: 0.5 }}>NEXT</div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 13, color: '#0F172A', margin: '0 0 2px' }}>
                          {order.customer_name || order.customer_phone}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'monospace' }}>{shortId(order.id)}</span>
                          <span style={{ fontSize: 9, color: '#CBD5E1' }}>·</span>
                          <span style={{ fontSize: 10, color: '#94A3B8' }}>{timeAgo(order.created_at)}</span>
                        </div>
                      </div>
                      <p style={{ fontWeight: 900, fontSize: 15, color: '#0F172A', margin: 0, letterSpacing: -0.3 }}>
                        {Rs(order.total_amount || 0)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {(order.items || []).map((item: any, i: number) => (
                        <span key={i} style={{ fontSize: 10, fontWeight: 600, color: '#374151', background: '#F1F5F9', borderRadius: 6, padding: '2px 7px' }}>
                          {item.qty}× {item.product_name}
                        </span>
                      ))}
                    </div>
                    {order.notes && (
                      <p style={{ fontSize: 10, color: '#D97706', margin: '0 0 8px', background: '#FFFBEB', borderRadius: 6, padding: '3px 7px' }}>
                        Note: {order.notes}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => updateOrderStatus(order.id, 'accepted')} disabled={updatingOrder === order.id} style={{ flex: 1, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 9, padding: '8px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: updatingOrder === order.id ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        <IcCheck /> Accept
                      </button>
                      <button onClick={() => updateOrderStatus(order.id, 'ready')} disabled={updatingOrder === order.id} style={{ flex: 1, background: '#EDE9FE', color: '#7C3AED', border: 'none', borderRadius: 9, padding: '8px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: updatingOrder === order.id ? 0.6 : 1 }}>
                        Mark Ready
                      </button>
                      <button onClick={() => updateOrderStatus(order.id, 'cancelled')} disabled={updatingOrder === order.id} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 9, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: updatingOrder === order.id ? 0.6 : 1 }}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pendingOrders.length > 0 && (
              <div style={{ padding: '10px 20px', borderTop: '1px solid #F1F5F9' }}>
                <Link href="/store-settings" style={{ fontSize: 12, color: '#2563EB', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  View all orders in My Store <IcChevron />
                </Link>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div>
            <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: '0 0 1px' }}>Recent Transactions</h2>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>Latest sales from your store</p>
              </div>
              <Link href="/history" style={{ fontSize: 12, color: '#2563EB', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                All <IcChevron />
              </Link>
            </div>

            {recentTx.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 20px' }}>
                <div style={{ width: 44, height: 44, background: '#F8FAFC', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#94A3B8' }}>
                  <IcHistory />
                </div>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', margin: '0 0 3px' }}>No sales yet</p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 14px' }}>Start your first sale to see it here</p>
                <Link href="/sale" style={{ background: isRest ? '#4F46E5' : '#16A34A', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 12, fontWeight: 700 }}>
                  {isRest ? 'New Order' : 'New Sale'}
                </Link>
              </div>
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {recentTx.map((tx) => {
                  const m = METHOD[tx.payment_method] || { label: tx.payment_method, color: '#64748B', bg: '#F8FAFC' };
                  const isPaid = tx.payment_status === 'paid';
                  return (
                    <div key={tx.id} className="tx-row" style={{ padding: '12px 20px', borderBottom: '1px solid #F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.1s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 8, fontWeight: 800, color: m.color, letterSpacing: 0.3 }}>{m.label.toUpperCase().slice(0, 4)}</span>
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', margin: '0 0 2px' }}>
                            {tx.customer_phone || tx.table_number ? `${tx.customer_phone || ''}${tx.table_number ? ` T${tx.table_number}` : ''}` : 'Walk-in'}
                          </p>
                          <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>{timeAgo(tx.created_at)}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: isPaid ? '#0F172A' : '#DC2626', margin: '0 0 2px', letterSpacing: -0.3 }}>
                          {Rs(tx.total_amount)}
                        </p>
                        <span style={{ fontSize: 10, fontWeight: 700, color: m.color, background: m.bg, padding: '2px 7px', borderRadius: 6 }}>
                          {m.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 20 }}
        className="mb-action-grid">
        {ACTIONS.map(a => <ActionCard key={a.href} {...a} />)}
      </div>

      {/* ── Today's snapshot ── */}
      <div className="mb-stat-grid" style={{ marginBottom: 20 }}>
        {[
          {
            label: isRest ? 'Orders Today' : 'Sales Today',
            value: loadingDash ? '—' : String(todayTx),
            sub: 'Completed',
            accent: '#2563EB', bg: '#EFF6FF',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
            extra: null,
          },
          {
            label: "Today's Revenue",
            value: loadingDash ? '—' : (hideRevenue ? '••••••' : Rs(todayTotal)),
            sub: hideRevenue ? 'Hidden' : `Cash ${Rs(dash?.today_cash ?? 0)}`,
            accent: '#16A34A', bg: '#F0FDF4',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
            extra: (
              <button onClick={() => setHideRevenue(h => !h)} title={hideRevenue ? 'Show revenue' : 'Hide revenue'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2, display: 'flex', alignItems: 'center' }}>
                {hideRevenue ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            ),
          },
          {
            label: 'Pending Orders',
            value: loadingOrders ? '—' : String(pendingOrders.length),
            sub: pendingOrders.length > 0 ? 'Need your attention' : 'All clear',
            accent: pendingOrders.length > 0 ? '#DC2626' : '#16A34A',
            bg: pendingOrders.length > 0 ? '#FEF2F2' : '#F0FDF4',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
            extra: null,
          },
          {
            label: 'Low Stock Items',
            value: String(lowStock.length),
            sub: lowStock.length > 0 ? 'Needs restocking' : 'Stock levels OK',
            accent: lowStock.length > 0 ? '#D97706' : '#16A34A',
            bg: lowStock.length > 0 ? '#FFFBEB' : '#F0FDF4',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
            extra: null,
          },
        ].map((c, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #E2E8F0', borderLeft: `4px solid ${c.accent}`, borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.accent, flexShrink: 0 }}>
              {c.icon}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 2px', fontWeight: 500 }}>{c.label}</p>
                {c.extra}
              </div>
              <p style={{ fontSize: 22, fontWeight: 900, color: c.accent, margin: '0 0 1px', letterSpacing: -0.5, lineHeight: 1 }}>{c.value}</p>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Low Stock Alerts ── */}
      {lowStock.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #FDE68A', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #FEF3C7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFBEB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#D97706', display: 'flex' }}><IcAlert /></span>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: '#92400E', margin: 0 }}>Low Stock Alert — {lowStock.length} item{lowStock.length !== 1 ? 's' : ''}</h2>
                <p style={{ fontSize: 11, color: '#B45309', margin: 0 }}>Restock before you run out</p>
              </div>
            </div>
            <Link href="/products" style={{ fontSize: 12, color: '#D97706', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              Manage <IcChevron />
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '14px 20px', flexWrap: 'wrap' }}>
            {lowStock.map((p: any) => (
              <div key={p.id} style={{ background: p.stock_qty === 0 ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${p.stock_qty === 0 ? '#FECACA' : '#FDE68A'}`, borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.stock_qty === 0 ? '#DC2626' : '#D97706', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{p.name}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: p.stock_qty === 0 ? '#DC2626' : '#D97706', background: p.stock_qty === 0 ? '#FEE2E2' : '#FEF3C7', padding: '2px 8px', borderRadius: 6 }}>
                  {p.stock_qty === 0 ? 'OUT' : `${p.stock_qty} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </MerchantShell>
  );
}
