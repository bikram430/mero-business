'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi, transactionsApi, khataApi } from '@/lib/api';
import { MerchantShell, lx, getMerchantType } from '@/components/MerchantShell';
import { BarcodeScanner } from '@/components/BarcodeScanner';

interface Product { id: string; name: string; price: number; category?: string; description?: string; barcode?: string; }
interface CartItem { product: Product; qty: number; note: string; }

const PAYMENT_METHODS = [
  { value: 'cash',    label: 'Cash',    color: '#16A34A', bg: '#F0FDF4' },
  { value: 'esewa',   label: 'eSewa',   color: '#7C3AED', bg: '#F5F3FF' },
  { value: 'fonepay', label: 'FonePay', color: '#DC2626', bg: '#FEF2F2' },
  { value: 'khalti',  label: 'Khalti',  color: '#6D28D9', bg: '#EDE9FE' },
  { value: 'khata',   label: 'Khata',   color: '#D97706', bg: '#FFFBEB' },
];

const REST_CATS = ['All', 'Appetizer', 'Main Course', 'Drinks', 'Dessert'];
const TABLE_COUNT = 12;

function formatRs(paisa: number) { return `Rs ${(paisa / 100).toFixed(0)}`; }

function PaymentSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
      {PAYMENT_METHODS.map((m) => {
        const active = value === m.value;
        return (
          <button key={m.value} onClick={() => onChange(m.value)} style={{
            padding: '8px 4px', borderRadius: 9,
            border: `1.5px solid ${active ? m.color : '#E2E8F0'}`,
            background: active ? m.bg : '#fff',
            color: active ? m.color : '#64748B',
            cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
          }}>
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Khata modal ────────────────────────────────────────────────────────────────
function KhataModal({ total, prefillPhone, onConfirm, onClose, submitting }: {
  total: number;
  prefillPhone: string;
  onConfirm: (phone: string, name: string, notes: string) => void;
  onClose: () => void;
  submitting: boolean;
}) {
  const [phone, setPhone] = useState(prefillPhone);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');

  function handleSubmit() {
    const cleaned = phone.replace(/\D/g, '');
    if (!/^(98|97)\d{8}$/.test(cleaned)) { setErr('Valid Nepal mobile number required (starts with 98 or 97)'); return; }
    if (!name.trim()) { setErr('Customer name is required for Khata'); return; }
    setErr('');
    onConfirm(cleaned, name.trim(), notes.trim());
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 22, padding: '28px 28px 24px', width: 380, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>Add to Khata (Credit)</h3>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Customer pays later — reminders via WhatsApp & SMS</p>
          </div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 16px', marginBottom: 18 }}>
          <p style={{ fontSize: 12, color: '#92400E', margin: '0 0 2px', fontWeight: 600 }}>Amount to be credited</p>
          <p style={{ fontSize: 26, fontWeight: 900, color: '#D97706', margin: 0 }}>{formatRs(total)}</p>
        </div>

        {err && <p style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, margin: '0 0 12px', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8 }}>{err}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          <input
            style={{ ...lx.input }}
            placeholder="Customer phone * (98XXXXXXXX)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            maxLength={10}
            type="tel"
          />
          <input
            style={{ ...lx.input }}
            placeholder="Customer name *"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            style={{ ...lx.input }}
            placeholder="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div style={{ background: '#EFF6FF', borderRadius: 10, padding: '10px 14px', marginBottom: 18 }}>
          <p style={{ fontSize: 11, color: '#1E40AF', margin: 0, lineHeight: 1.5 }}>
            <strong>Automatic reminders:</strong> Customer will receive proof of purchase + daily WhatsApp/SMS reminder until cleared.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: '#F1F5F9', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, color: '#64748B', fontSize: 13 }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ flex: 2, padding: '12px', background: submitting ? '#FDE68A' : 'linear-gradient(135deg,#D97706,#B45309)', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 800, color: '#fff', fontSize: 13, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Saving to Khata...' : 'Save to Khata'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast notification ─────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' | 'info' }) {
  const colors = {
    success: { bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D' },
    error:   { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' },
  }[type];
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 4000, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: '12px 20px', color: colors.color, fontWeight: 700, fontSize: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', whiteSpace: 'nowrap' }}>
      {msg}
    </div>
  );
}

export default function SalePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [merchantType, setMerchantType] = useState<'retail' | 'restaurant'>('retail');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerPhone, setCustomerPhone] = useState('');

  // Restaurant
  const [selectedTable, setSelectedTable] = useState(1);
  const [tableOrders, setTableOrders] = useState<Record<number, CartItem[]>>({});
  const [activeTab, setActiveTab] = useState('All');

  // Retail
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [discountRs, setDiscountRs] = useState('');

  // Scanner
  const [showScanner, setShowScanner] = useState(false);

  // Khata modal
  const [showKhata, setShowKhata] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Mobile panel toggle
  const [mobileView, setMobileView] = useState<'main'|'cart'>('main');

  function showToast(msg: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.replace('/login'); return; }
    setMerchantType(getMerchantType());
    productsApi.list()
      .then(({ data }) => setProducts(data))
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, []);

  const isRest = merchantType === 'restaurant';
  const currentOrder: CartItem[] = tableOrders[selectedTable] ?? [];

  // Restaurant helpers
  function addToTable(product: Product) {
    setTableOrders(prev => {
      const order = prev[selectedTable] ?? [];
      const ex = order.find(i => i.product.id === product.id);
      if (ex) return { ...prev, [selectedTable]: order.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i) };
      return { ...prev, [selectedTable]: [...order, { product, qty: 1, note: '' }] };
    });
  }
  function updateTableQty(id: string, delta: number) {
    setTableOrders(prev => {
      const order = (prev[selectedTable] ?? []).map(i => i.product.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0);
      return { ...prev, [selectedTable]: order };
    });
  }
  function updateTableNote(id: string, note: string) {
    setTableOrders(prev => ({ ...prev, [selectedTable]: (prev[selectedTable] ?? []).map(i => i.product.id === id ? { ...i, note } : i) }));
  }

  // Retail helpers
  function addToCart(product: Product) {
    setCart(prev => {
      const ex = prev.find(i => i.product.id === product.id);
      if (ex) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1, note: '' }];
    });
  }
  function updateCartQty(id: string, qty: number) {
    if (qty <= 0) setCart(prev => prev.filter(i => i.product.id !== id));
    else setCart(prev => prev.map(i => i.product.id === id ? { ...i, qty } : i));
  }

  // Camera barcode handler
  function handleBarcodeScan(code: string) {
    setShowScanner(false);
    const p = products.find((x: any) => x.barcode === code);
    if (p) {
      isRest ? addToTable(p) : addToCart(p);
      showToast(`${p.name} added to cart`, 'success');
    } else {
      setSearch(code);
      showToast(`Barcode "${code}" not matched — searching products`, 'info');
    }
  }

  // Totals
  const retailTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const discountPaisa = Math.round((parseFloat(discountRs) || 0) * 100);
  const retailFinal = Math.max(0, retailTotal - discountPaisa);
  const restTotal = currentOrder.reduce((s, i) => s + i.product.price * i.qty, 0);
  const activeTables = new Set(Object.entries(tableOrders).filter(([, items]) => items.length > 0).map(([t]) => Number(t)));

  const filteredMenu = isRest
    ? products.filter(p => activeTab === 'All' || p.category === activeTab)
    : products.filter(p => {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q);
      });

  function errMsg(e: any): string {
    const d = e?.response?.data?.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) return d.map((x: any) => x.msg || JSON.stringify(x)).join(', ');
    return 'Something went wrong — please try again';
  }

  async function handleRestCheckout() {
    if (currentOrder.length === 0) { showToast('Table empty — add items first', 'error'); return; }
    if (paymentMethod === 'khata') { setShowKhata(true); return; }
    setSubmitting(true);
    try {
      const { data } = await transactionsApi.create({
        items: currentOrder.map(i => ({ product_id: i.product.id, qty: i.qty, unit_price: i.product.price, note: i.note || undefined })),
        payment_method: paymentMethod,
        customer_phone: customerPhone || undefined,
        table_number: String(selectedTable),
        idempotency_key: `web-${Date.now()}`,
      });
      setSuccess(data);
      setTableOrders(prev => { const n = { ...prev }; delete n[selectedTable]; return n; });
      setPaymentMethod('cash'); setCustomerPhone('');
    } catch (e: any) {
      showToast(errMsg(e), 'error');
    } finally { setSubmitting(false); }
  }

  async function handleRetailCheckout() {
    if (cart.length === 0) { showToast('Cart is empty — add products first', 'error'); return; }
    if (paymentMethod === 'khata') { setShowKhata(true); return; }
    setSubmitting(true);
    try {
      const { data } = await transactionsApi.create({
        items: cart.map(i => ({ product_id: i.product.id, qty: i.qty, unit_price: i.product.price })),
        payment_method: paymentMethod,
        customer_phone: customerPhone || undefined,
        discount_amount: discountPaisa,
        idempotency_key: `web-${Date.now()}`,
      });
      setSuccess(data);
      setCart([]); setDiscountRs(''); setCustomerPhone(''); setPaymentMethod('cash');
    } catch (e: any) {
      showToast(errMsg(e), 'error');
    } finally { setSubmitting(false); }
  }

  async function handleKhataConfirm(phone: string, name: string, notes: string) {
    const items = isRest ? currentOrder : cart;
    const total = isRest ? restTotal : retailFinal;
    setSubmitting(true);
    try {
      // 1. Create transaction
      const { data: tx } = await transactionsApi.create({
        items: items.map(i => ({ product_id: i.product.id, qty: i.qty, unit_price: i.product.price })),
        payment_method: 'khata',
        customer_phone: phone,
        discount_amount: isRest ? 0 : discountPaisa,
        table_number: isRest ? String(selectedTable) : undefined,
        idempotency_key: `web-${Date.now()}`,
      });

      // 2. Create Khata entry
      await khataApi.create({
        customer_phone: phone,
        customer_name: name,
        amount_due: total,
        notes: notes || undefined,
        transaction_id: tx.id,
      }).catch(() => { /* khata entry creation is non-fatal */ });

      setShowKhata(false);
      setSuccess({ ...tx, isKhata: true, khataName: name });
      if (isRest) {
        setTableOrders(prev => { const n = { ...prev }; delete n[selectedTable]; return n; });
      } else {
        setCart([]); setDiscountRs(''); setCustomerPhone('');
      }
      setPaymentMethod('cash');
    } catch (e: any) {
      showToast(errMsg(e), 'error');
    } finally { setSubmitting(false); }
  }

  // ── Success screen ──
  if (success) {
    return (
      <MerchantShell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: '52px 48px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 400, width: '100%' }}>
            <div style={{ width: 72, height: 72, background: success.isKhata ? '#FFFBEB' : '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              {success.isKhata
                ? <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                : <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              }
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
              {success.isKhata ? 'Saved to Khata!' : isRest ? 'Order Confirmed!' : 'Payment Successful!'}
            </h2>
            {success.isKhata && (
              <p style={{ fontSize: 13, color: '#D97706', fontWeight: 600, margin: '0 0 6px' }}>
                {success.khataName} — WhatsApp & SMS reminders enabled
              </p>
            )}
            <p style={{ fontSize: 38, fontWeight: 800, color: success.isKhata ? '#D97706' : '#16A34A', margin: '12px 0 6px', letterSpacing: -1 }}>{formatRs(success.total_amount)}</p>
            <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 28 }}>Receipt #{(success.id ?? '').slice(0, 8).toUpperCase()}</p>
            <button style={{ ...lx.btnPrimary, width: '100%', fontSize: 15, padding: '14px', marginBottom: 10 }} onClick={() => setSuccess(null)}>
              {isRest ? 'New Order' : 'New Sale'}
            </button>
            <a href="/history" style={{ color: '#64748B', textDecoration: 'none', fontSize: 14 }}>View History</a>
          </div>
        </div>
      </MerchantShell>
    );
  }

  if (loading) {
    return (
      <MerchantShell>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #DBEAFE', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      </MerchantShell>
    );
  }

  // ── RESTAURANT UI ──
  if (isRest) {
    return (
      <MerchantShell maxWidth={1400}>
        <style>{`
          @keyframes spin{to{transform:rotate(360deg)}}
          .sale-tabs { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 2px solid #E2E8F0; z-index: 90; }
          @media (max-width: 768px) {
            .sale-layout { flex-direction: column !important; height: auto !important; gap: 0 !important; min-height: calc(100vh - 118px); }
            .sale-prd, .sale-cart, .sale-tables { width: 100% !important; flex-shrink: 0 !important; border-radius: 0 !important; }
            .sale-hide { display: none !important; }
            .sale-tabs { display: flex !important; }
            .sale-prd { flex: none !important; min-height: calc(100vh - 178px); }
            .sale-cart { height: calc(100vh - 178px); }
          }
        `}</style>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
        {showScanner && <BarcodeScanner onDetected={handleBarcodeScan} onClose={() => setShowScanner(false)} title="Scan to Add to Order" subtitle="Scan product barcode to add it to the table order" />}
        {showKhata && <KhataModal total={restTotal} prefillPhone={customerPhone} onConfirm={handleKhataConfirm} onClose={() => setShowKhata(false)} submitting={submitting} />}
        <div className="sale-layout" style={{ display: 'flex', gap: 16, height: 'calc(100vh - 124px)' }}>

          {/* Column 1: Table selector */}
          <div className={`sale-tables${mobileView !== 'main' ? ' sale-hide' : ''}`} style={{ width: 164, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: '14px 12px', border: '1px solid #E2E8F0', flex: 1, overflowY: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 12px' }}>Tables</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map(t => {
                  const isOccupied = activeTables.has(t);
                  const isSelected = selectedTable === t;
                  return (
                    <button key={t} onClick={() => setSelectedTable(t)} style={{ padding: '11px 4px', borderRadius: 10, border: isSelected ? '2px solid #2563EB' : isOccupied ? '2px solid #F59E0B' : '1.5px solid #E2E8F0', background: isSelected ? '#EFF6FF' : isOccupied ? '#FFFBEB' : '#F8FAFC', color: isSelected ? '#1E40AF' : isOccupied ? '#92400E' : '#64748B', cursor: 'pointer', fontWeight: 800, fontSize: 14, position: 'relative', transition: 'all 0.15s' }}>
                      T{t}
                      {isOccupied && <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', border: '2px solid #fff' }} />}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[['#CBD5E1','Free'],['#F59E0B','Occupied'],['#2563EB','Selected']].map(([c,l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Menu */}
          <div className={`sale-prd${mobileView !== 'main' ? ' sale-hide' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: '8px 10px', border: '1px solid #E2E8F0', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {REST_CATS.map(cat => (
                <button key={cat} onClick={() => setActiveTab(cat)} style={{ padding: '6px 16px', borderRadius: 20, border: 'none', background: activeTab === cat ? '#2563EB' : '#F1F5F9', color: activeTab === cat ? '#fff' : '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}>{cat}</button>
              ))}
              <button onClick={() => setShowScanner(true)} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 20, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><rect x="15" y="15" width="6" height="6"/></svg>
                Scan Barcode
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredMenu.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 14, padding: '48px 24px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                  <p style={{ color: '#94A3B8', fontSize: 14, margin: 0 }}>No items in this category — <a href="/products" style={{ color: '#2563EB', textDecoration: 'none' }}>add menu items</a></p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(158px,1fr))', gap: 10 }}>
                  {filteredMenu.map(p => {
                    const inOrder = currentOrder.find(i => i.product.id === p.id);
                    return (
                      <div key={p.id} onClick={() => addToTable(p)} style={{ background: '#fff', borderRadius: 12, padding: '14px 12px', cursor: 'pointer', border: inOrder ? '2px solid #2563EB' : '1px solid #E2E8F0', position: 'relative', transition: 'border-color 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        {inOrder && <div style={{ position: 'absolute', top: 8, right: 8, background: '#2563EB', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 800 }}>×{inOrder.qty}</div>}
                        {p.category && <div style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>{p.category}</div>}
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14, marginBottom: p.description ? 4 : 6, lineHeight: 1.3 }}>{p.name}</div>
                        {p.description && <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>{p.description}</div>}
                        <div style={{ color: '#2563EB', fontWeight: 800, fontSize: 15 }}>{formatRs(p.price)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Order panel */}
          <div className={`sale-cart${mobileView !== 'cart' ? ' sale-hide' : ''}`} style={{ width: 298, background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '16px 14px', display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)', borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 800, color: '#fff' }}>T{selectedTable}</div>
              <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 15 }}>Order</span>
              {currentOrder.length > 0 && <span style={{ marginLeft: 'auto', background: '#EFF6FF', color: '#2563EB', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{currentOrder.reduce((s, i) => s + i.qty, 0)} items</span>}
            </div>

            {currentOrder.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', gap: 10 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
                <p style={{ fontSize: 13, margin: 0, textAlign: 'center', color: '#94A3B8' }}>Select items from the menu for Table {selectedTable}</p>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {currentOrder.map(item => (
                    <div key={item.product.id} style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 10px 8px', border: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#0F172A', lineHeight: 1.3 }}>{item.product.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button onClick={() => updateTableQty(item.product.id, -1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <span style={{ fontSize: 13, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{item.qty}</span>
                          <button onClick={() => updateTableQty(item.product.id, 1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', minWidth: 44, textAlign: 'right' }}>{formatRs(item.product.price * item.qty)}</span>
                      </div>
                      <input placeholder="Special note (optional)" value={item.note} onChange={e => updateTableNote(item.product.id, e.target.value)} style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 7, padding: '5px 8px', fontSize: 11, background: '#fff', color: '#475569', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', margin: '0 0 7px' }}>Payment Method</p>
                  <PaymentSelector value={paymentMethod} onChange={setPaymentMethod} />
                </div>
                <input style={{ ...lx.input, marginBottom: 12, fontSize: 13 }} placeholder="Customer phone (optional)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} maxLength={10} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 19, marginBottom: 12, color: '#0F172A' }}>
                  <span>Total</span>
                  <span style={{ color: '#2563EB' }}>{formatRs(restTotal)}</span>
                </div>
                <button onClick={handleRestCheckout} disabled={submitting} style={{ background: paymentMethod === 'khata' ? 'linear-gradient(135deg,#D97706,#B45309)' : 'linear-gradient(135deg,#2563EB,#7C3AED)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 800, cursor: 'pointer', width: '100%', opacity: submitting ? 0.7 : 1, transition: 'opacity 0.15s' }}>
                  {submitting ? 'Processing...' : paymentMethod === 'khata' ? 'Add to Khata →' : `Confirm — ${PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}`}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile tab bar — restaurant */}
        <div className="sale-tabs" style={{ height: 58 }}>
          {[
            { view: 'main' as const, label: 'Menu', count: 0 },
            { view: 'cart' as const, label: 'Order', count: currentOrder.reduce((s,i)=>s+i.qty,0) },
          ].map(t => {
            const active = mobileView === t.view;
            return (
              <button key={t.view} onClick={() => setMobileView(t.view)} style={{ flex: 1, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: active ? '#4F46E5' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderTop: active ? '2px solid #4F46E5' : '2px solid transparent' }}>
                {t.label}
                {t.count > 0 && <span style={{ background: '#4F46E5', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 800 }}>{t.count}</span>}
              </button>
            );
          })}
        </div>
      </MerchantShell>
    );
  }

  // ── RETAIL UI ──
  return (
    <MerchantShell maxWidth={1400}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .sale-tabs { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 2px solid #E2E8F0; z-index: 90; }
        @media (max-width: 768px) {
          .sale-layout { flex-direction: column !important; height: auto !important; gap: 0 !important; }
          .sale-prd, .sale-cart { width: 100% !important; flex-shrink: 0 !important; border-radius: 0 !important; }
          .sale-hide { display: none !important; }
          .sale-tabs { display: flex !important; }
          .sale-prd { flex: none !important; min-height: calc(100vh - 178px); overflow-y: auto; }
          .sale-cart { height: calc(100vh - 178px); overflow-y: auto; }
        }
      `}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {showScanner && <BarcodeScanner onDetected={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
      {showKhata && <KhataModal total={retailFinal} prefillPhone={customerPhone} onConfirm={handleKhataConfirm} onClose={() => setShowKhata(false)} submitting={submitting} />}

      <div className="sale-layout" style={{ display: 'flex', gap: 20, height: 'calc(100vh - 124px)' }}>
        {/* Products panel */}
        <div className={`sale-prd${mobileView !== 'main' ? ' sale-hide' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input style={{ ...lx.input, paddingLeft: 42, fontSize: 15 }} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button
              onClick={() => setShowScanner(true)}
              style={{ padding: '0 18px', borderRadius: 10, flexShrink: 0, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#16A34A'; (e.currentTarget as HTMLElement).style.color = '#16A34A'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><rect x="15" y="15" width="6" height="6"/></svg>
              Scan Barcode
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredMenu.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 14, padding: '48px 24px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                <p style={{ color: '#94A3B8', fontSize: 14, margin: 0 }}>
                  {search ? `"${search}" not found` : <><a href="/products" style={{ color: '#16A34A', textDecoration: 'none', fontWeight: 600 }}>Add products</a> to start selling</>}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
                {filteredMenu.map(p => {
                  const inCart = cart.find(i => i.product.id === p.id);
                  return (
                    <div key={p.id} onClick={() => addToCart(p)} style={{ background: '#fff', borderRadius: 12, padding: '14px 12px', cursor: 'pointer', border: inCart ? '2px solid #16A34A' : '1px solid #E2E8F0', position: 'relative', transition: 'border-color 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      {inCart && <div style={{ position: 'absolute', top: 8, right: 8, background: '#16A34A', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 800 }}>×{inCart.qty}</div>}
                      {p.category && <div style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>{p.category}</div>}
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14, marginBottom: 6, lineHeight: 1.3 }}>{p.name}</div>
                      <div style={{ color: '#16A34A', fontWeight: 800, fontSize: 15 }}>{formatRs(p.price)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cart panel */}
        <div className={`sale-cart${mobileView !== 'cart' ? ' sale-hide' : ''}`} style={{ width: 320, background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '18px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>Cart</h2>
            {cart.length > 0 && <span style={{ marginLeft: 'auto', background: '#F0FDF4', color: '#16A34A', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{cart.reduce((s, i) => s + i.qty, 0)} items</span>}
          </div>

          {cart.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', gap: 10 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              <p style={{ fontSize: 13, margin: 0, color: '#94A3B8' }}>Click products or scan to add to cart</p>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cart.map(item => (
                  <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#0F172A', lineHeight: 1.3 }}>{item.product.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => updateCartQty(item.product.id, item.qty - 1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ fontSize: 13, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateCartQty(item.product.id, item.qty + 1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', minWidth: 52, textAlign: 'right' }}>{formatRs(item.product.price * item.qty)}</div>
                  </div>
                ))}
              </div>

              <input style={{ ...lx.input, marginBottom: 8, fontSize: 13 }} placeholder="Customer phone (optional)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} maxLength={10} />
              <input style={{ ...lx.input, marginBottom: 12, fontSize: 13 }} placeholder="Discount (Rs)" type="number" value={discountRs} onChange={e => setDiscountRs(e.target.value)} min="0" />

              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', margin: '0 0 7px' }}>Payment Method</p>
                <PaymentSelector value={paymentMethod} onChange={setPaymentMethod} />
              </div>

              {discountPaisa > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: 13, marginBottom: 4 }}>
                  <span>Subtotal</span><span>{formatRs(retailTotal)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 19, marginBottom: 12, color: '#0F172A' }}>
                <span>Total{discountPaisa > 0 ? ` (−${formatRs(discountPaisa)})` : ''}</span>
                <span style={{ color: paymentMethod === 'khata' ? '#D97706' : '#16A34A' }}>{formatRs(retailFinal)}</span>
              </div>

              <button
                onClick={handleRetailCheckout}
                disabled={submitting}
                style={{ background: paymentMethod === 'khata' ? 'linear-gradient(135deg,#D97706,#B45309)' : '#16A34A', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 800, cursor: 'pointer', width: '100%', opacity: submitting ? 0.7 : 1, transition: 'opacity 0.15s' }}
              >
                {submitting ? 'Processing...' : paymentMethod === 'khata' ? 'Add to Khata →' : `Confirm — ${PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile tab bar — retail */}
      {(() => {
        const cartCount = cart.reduce((s,i)=>s+i.qty,0);
        return (
          <div className="sale-tabs" style={{ height: 58 }}>
            {[
              { view: 'main' as const, label: 'Products', count: 0 },
              { view: 'cart' as const, label: 'Cart', count: cartCount },
            ].map(t => {
              const active = mobileView === t.view;
              return (
                <button key={t.view} onClick={() => setMobileView(t.view)} style={{ flex: 1, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: active ? '#16A34A' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderTop: active ? '2px solid #16A34A' : '2px solid transparent' }}>
                  {t.label}
                  {t.count > 0 && <span style={{ background: '#16A34A', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 800 }}>{t.count}</span>}
                </button>
              );
            })}
          </div>
        );
      })()}
    </MerchantShell>
  );
}
