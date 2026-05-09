'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { MerchantShell, PageHeader, Card, lx } from '@/components/MerchantShell';

function formatRs(paisa: number) { return `Rs ${(paisa / 100).toLocaleString()}`; }

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  pending:   { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  accepted:  { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  ready:     { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  collected: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  cancelled: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
};

export default function StoreSettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'location' | 'offers' | 'orders'>('location');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [desc, setDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [locStatus, setLocStatus] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [offerForm, setOfferForm] = useState({ title: '', description: '', discount_percent: '', discount_flat: '', valid_until: '' });
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerSaving, setOfferSaving] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState('pending');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.replace('/login'); return; }
    loadOrders();
  }, []);

  useEffect(() => { loadOrders(); }, [orderFilter]);

  async function loadOrders() {
    try {
      const url = orderFilter === 'all' ? '/stores/me/collect-orders' : `/stores/me/collect-orders?status_filter=${orderFilter}`;
      const { data } = await api.get(url);
      setOrders(data);
    } catch (e: any) { if (e?.response?.status === 401) router.replace('/login'); }
  }

  function detectLocation() {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6)); setDetecting(false); },
      () => { setLocStatus('Location access denied'); setDetecting(false); },
      { timeout: 10000 },
    );
  }

  async function saveLocation() {
    if (!lat || !lng) { setLocStatus('Lat/lng chahincha'); return; }
    setLocStatus('');
    try {
      await api.put('/stores/me/location', { latitude: parseFloat(lat), longitude: parseFloat(lng), description: desc || undefined, is_public: isPublic });
      setLocStatus('success');
    } catch (e: any) { setLocStatus('error:' + (e.response?.data?.detail || 'Save bhayena')); }
  }

  async function saveOffer() {
    if (!offerForm.title) return;
    setOfferSaving(true);
    try {
      const payload: any = { title: offerForm.title, description: offerForm.description || undefined, valid_until: offerForm.valid_until || undefined };
      if (offerForm.discount_percent) payload.discount_percent = parseInt(offerForm.discount_percent);
      if (offerForm.discount_flat) payload.discount_flat = Math.round(parseFloat(offerForm.discount_flat) * 100);
      await api.post('/stores/me/offers', payload);
      setOfferForm({ title: '', description: '', discount_percent: '', discount_flat: '', valid_until: '' });
      setShowOfferForm(false);
    } catch { } finally { setOfferSaving(false); }
  }

  async function updateOrderStatus(id: string, newStatus: string) {
    try { await api.put(`/stores/me/collect-orders/${id}/status?new_status=${newStatus}`); loadOrders(); } catch { }
  }

  const setOff = (k: string, v: string) => setOfferForm(f => ({ ...f, [k]: v }));

  const TABS = [
    { key: 'location', label: 'Location', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> },
    { key: 'offers', label: 'Offers', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> },
    { key: 'orders', label: 'Click & Collect', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> },
  ] as const;

  return (
    <MerchantShell maxWidth={960}>
      <PageHeader title="My Store" subtitle="Manage visibility, offers, and click & collect orders" />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: tab === t.key ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
            background: tab === t.key ? '#EFF6FF' : '#fff',
            color: tab === t.key ? '#2563EB' : '#64748B',
            transition: 'all 0.15s',
          }}>
            <span style={{ opacity: tab === t.key ? 1 : 0.5 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Location tab */}
      {tab === 'location' && (
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>Store Location & Visibility</h2>
          <p style={{ color: '#64748B', fontSize: 14, margin: '0 0 20px' }}>Set your location to appear on Mero Pasal for nearby customers</p>

          <button onClick={detectLocation} disabled={detecting} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EFF6FF', color: '#2563EB', border: '1.5px solid #BFDBFE', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: detecting ? 'default' : 'pointer', fontSize: 14, marginBottom: 20 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
            {detecting ? 'Detecting...' : 'Auto-detect my location'}
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><label style={lx.label}>Latitude</label><input style={lx.input} value={lat} onChange={e => setLat(e.target.value)} placeholder="27.7172" /></div>
            <div><label style={lx.label}>Longitude</label><input style={lx.input} value={lng} onChange={e => setLng(e.target.value)} placeholder="85.3240" /></div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lx.label}>Store Description</label>
              <textarea style={{ ...lx.input, height: 70, resize: 'vertical' }} value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Fresh Nepali food, open 7am–9pm" />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, cursor: 'pointer' }}>
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#2563EB' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Show my store on Mero Pasal</span>
          </label>

          {locStatus === 'success' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', color: '#16A34A', fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Location saved — store is now discoverable on Mero Pasal!
            </div>
          )}
          {locStatus.startsWith('error:') && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', color: '#DC2626', fontSize: 14, marginBottom: 14 }}>
              {locStatus.replace('error:', '')}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button style={lx.btnPrimary} onClick={saveLocation}>Save Location</button>
            <a href="/shop" target="_blank" style={{ fontSize: 13, color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>View public store page →</a>
          </div>
        </Card>
      )}

      {/* Offers tab */}
      {tab === 'offers' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Active Offers</h2>
            <button style={{ ...lx.btnPrimary, background: '#16A34A' }} onClick={() => setShowOfferForm(!showOfferForm)}>+ New Offer</button>
          </div>

          {showOfferForm && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                {[['title', 'Offer Title *', 'text', 'e.g. 20% off on all items'],
                  ['description', 'Description', 'text', 'Details...'],
                  ['discount_percent', 'Discount %', 'number', 'e.g. 20'],
                  ['discount_flat', 'Flat discount (Rs)', 'number', 'e.g. 50'],
                  ['valid_until', 'Valid Until', 'datetime-local', '']].map(([k, label, type, ph]) => (
                  <div key={k}>
                    <label style={lx.label}>{label}</label>
                    <input style={lx.input} type={type} placeholder={ph} value={(offerForm as any)[k]} onChange={e => setOff(k, e.target.value)} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ ...lx.btnPrimary, background: '#16A34A' }} onClick={saveOffer} disabled={offerSaving}>{offerSaving ? 'Saving...' : 'Save Offer'}</button>
                <button style={lx.btnGhost} onClick={() => setShowOfferForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
            <div style={{ width: 48, height: 48, background: '#F0FDF4', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: '0 0 4px' }}>No active offers</p>
            <p style={{ fontSize: 13, margin: 0 }}>Create offers to attract customers to your store</p>
          </div>
        </Card>
      )}

      {/* Orders tab */}
      {tab === 'orders' && (
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>Click & Collect Orders</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {['pending', 'accepted', 'ready', 'collected', 'cancelled', 'all'].map(f => (
              <button key={f} onClick={() => setOrderFilter(f)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: orderFilter === f ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
                background: orderFilter === f ? '#EFF6FF' : '#fff',
                color: orderFilter === f ? '#2563EB' : '#64748B',
              }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
              <div style={{ width: 48, height: 48, background: '#F1F5F9', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
              </div>
              <p style={{ fontSize: 14, margin: 0 }}>{orderFilter === 'pending' ? 'Koi pending orders chaina' : 'Koi orders chaina'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orders.map((o: any) => {
                const st = STATUS_STYLE[o.status] ?? STATUS_STYLE.cancelled;
                return (
                  <div key={o.id} style={{ background: '#F8FAFC', borderRadius: 12, padding: '16px 18px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 15, margin: '0 0 2px', color: '#0F172A' }}>{o.customer_name || 'Customer'} — {o.customer_phone}</p>
                        <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, fontFamily: 'monospace' }}>#{String(o.id).slice(0, 8).toUpperCase()} · {o.created_at ? new Date(o.created_at).toLocaleString() : ''}</p>
                        {o.notes && <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{o.notes}</p>}
                      </div>
                      <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: 11 }}>{o.status.toUpperCase()}</span>
                    </div>
                    {o.items?.map((item: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', marginBottom: 4 }}>
                        <span>{item.product_name} ×{item.qty}</span><span style={{ fontWeight: 600 }}>{formatRs(item.unit_price * item.qty)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid #E2E8F0', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 16, color: '#2563EB' }}>{formatRs(o.total_amount)}</strong>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {o.status === 'pending' && (<>
                          <button style={{ ...lx.btnPrimary, padding: '7px 14px', fontSize: 12, background: '#16A34A' }} onClick={() => updateOrderStatus(o.id, 'accepted')}>Accept</button>
                          <button style={{ ...lx.btnPrimary, padding: '7px 14px', fontSize: 12, background: '#DC2626' }} onClick={() => updateOrderStatus(o.id, 'cancelled')}>Cancel</button>
                        </>)}
                        {o.status === 'accepted' && <button style={{ ...lx.btnPrimary, padding: '7px 14px', fontSize: 12, background: '#7C3AED' }} onClick={() => updateOrderStatus(o.id, 'ready')}>Mark Ready</button>}
                        {o.status === 'ready' && <button style={{ ...lx.btnPrimary, padding: '7px 14px', fontSize: 12, background: '#16A34A' }} onClick={() => updateOrderStatus(o.id, 'collected')}>Collected</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </MerchantShell>
  );
}
