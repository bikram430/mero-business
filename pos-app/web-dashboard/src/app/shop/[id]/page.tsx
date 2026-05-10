'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function formatRs(paisa: number) { return `Rs ${(paisa / 100).toLocaleString()}`; }

type CartItem = { product: any; qty: number };

// ── Icons ──────────────────────────────────────────────────────────────────────

function IcArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  );
}
function IcPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function IcStar({ filled, size = 20 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#D97706' : 'none'} stroke={filled ? '#D97706' : '#D1D5DB'} strokeWidth="1.5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}
function IcStore() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function IcFork() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
    </svg>
  );
}
function IcPackage() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}
function IcTag() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  );
}
function IcCheck() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}
function IcX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function IcMinus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IcPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IcCart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
    </svg>
  );
}

// ── Star picker ────────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
        >
          <IcStar filled={n <= (hovered || value)} size={32} />
        </button>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'products' | 'offers' | 'rate'>('products');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [phone, setPhone] = useState('');
  const [custName, setCustName] = useState('');
  const [notes, setNotes] = useState('');
  const [orderPlaced, setOrderPlaced] = useState<any>(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [ratingPhone, setRatingPhone] = useState('');
  const [ratingDone, setRatingDone] = useState(false);
  const [ratingError, setRatingError] = useState('');

  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    axios.get(`${BASE_URL}/stores/${id}`)
      .then(({ data }) => setStore(data))
      .catch(() => router.push('/shop'))
      .finally(() => setLoading(false));
    // Pre-fill from customer session
    const savedPhone = localStorage.getItem('customer_phone') || '';
    const savedName  = localStorage.getItem('customer_name')  || '';
    if (savedPhone) { setPhone(savedPhone); setRatingPhone(savedPhone); }
    if (savedName)  setCustName(savedName);
  }, [id]);

  function addToCart(product: any) {
    setCart(prev => {
      const ex = prev.find(c => c.product.id === product.id);
      if (ex) return prev.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { product, qty: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart(prev => {
      const ex = prev.find(c => c.product.id === productId);
      if (!ex) return prev;
      if (ex.qty === 1) return prev.filter(c => c.product.id !== productId);
      return prev.map(c => c.product.id === productId ? { ...c, qty: c.qty - 1 } : c);
    });
  }

  function cartQty(productId: string) {
    return cart.find(c => c.product.id === productId)?.qty ?? 0;
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.product.price * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  async function placeOrder() {
    if (!phone || phone.length < 10) { setOrderError('Please enter a valid phone number.'); return; }
    if (cart.length === 0) { setOrderError('Your cart is empty.'); return; }
    setPlacing(true); setOrderError('');
    try {
      const { data } = await axios.post(`${BASE_URL}/stores/${id}/collect`, {
        customer_phone: phone,
        customer_name: custName || undefined,
        notes: notes || undefined,
        items: cart.map(c => ({ product_id: c.product.id, qty: c.qty })),
      });
      const saved = JSON.parse(localStorage.getItem('my_collect_orders') || '[]');
      saved.unshift({ ...data, store_name: store?.name });
      localStorage.setItem('my_collect_orders', JSON.stringify(saved.slice(0, 50)));
      setOrderPlaced(data);
      setCart([]);
      setShowCheckout(false);
    } catch (e: any) {
      setOrderError(e.response?.data?.detail || 'Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  async function submitRating() {
    if (!ratingPhone || ratingPhone.length < 10) { setRatingError('Please enter a valid phone number.'); return; }
    if (rating === 0) { setRatingError('Please select a star rating.'); return; }
    setRatingError('');
    try {
      await axios.post(`${BASE_URL}/stores/${id}/rate`, {
        customer_phone: ratingPhone, rating, review: review || undefined,
      });
      setRatingDone(true);
    } catch (e: any) {
      setRatingError(e.response?.data?.detail || 'Could not submit rating. Please try again.');
    }
  }

  if (loading) {
    return (
      <div style={s.loadWrap}>
        <Logo size={40} />
        <p style={{ color: '#6B7280', marginTop: 16 }}>Loading store...</p>
      </div>
    );
  }
  if (!store) return null;

  const isRestaurant = store.type === 'restaurant';
  const categories = ['All', ...Array.from(new Set((store.products ?? []).map((p: any) => p.category).filter(Boolean))) as string[]];
  const filteredProducts = (store.products ?? []).filter((p: any) =>
    categoryFilter === 'All' || p.category === categoryFilter
  );
  const avgRating = store.avg_rating ?? 0;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <a href="/shop" style={s.headerLogo}><img src="/mero-business-logo.svg" alt="Mero Business" style={{ height: 26, width: 'auto' }} /></a>
          <button style={s.backBtn} onClick={() => router.push('/shop')}>
            <IcArrowLeft /> Back to Stores
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroIcon}>
            {isRestaurant ? <IcFork /> : <IcStore />}
          </div>
          <div style={s.heroContent}>
            <div style={s.typeBadge}>{isRestaurant ? 'Restaurant' : 'Retail Store'}</div>
            <h1 style={s.storeName}>{store.name}</h1>
            {store.address && (
              <div style={s.storeAddr}>
                <IcPin />
                <span>{store.address}</span>
              </div>
            )}
            {store.description && <p style={s.storeDesc}>{store.description}</p>}
            <div style={s.ratingRow}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <IcStar key={n} filled={n <= Math.round(avgRating)} size={16} />
                ))}
              </div>
              <span style={s.ratingText}>
                {avgRating > 0 ? avgRating.toFixed(1) : 'No ratings yet'}
                {store.rating_count > 0 && ` · ${store.rating_count} review${store.rating_count !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={s.main}>
        {/* Order success banner */}
        {orderPlaced && (
          <div style={s.successBanner}>
            <IcCheck />
            <div>
              <p style={{ fontWeight: 800, fontSize: 17, margin: '0 0 4px', color: '#065F46' }}>Order placed successfully!</p>
              <p style={{ color: '#047857', fontSize: 14, margin: 0 }}>
                Order #{String(orderPlaced.id).slice(0, 8).toUpperCase()} — visit the store to collect when ready.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={s.tabs}>
          {[
            { key: 'products', label: 'Products' },
            { key: 'offers', label: 'Offers' },
            { key: 'rate', label: 'Rate Store' },
          ].map(({ key, label }) => (
            <button
              key={key}
              style={{ ...s.tab, ...(tab === key ? s.tabActive : {}) }}
              onClick={() => setTab(key as any)}
            >
              {label}
              {key === 'offers' && store.active_offers?.length > 0 && (
                <span style={s.offerCount}>{store.active_offers.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Products tab */}
        {tab === 'products' && (
          <>
            {categories.length > 1 && (
              <div style={s.catRow}>
                {categories.map(c => (
                  <button
                    key={c}
                    style={{ ...s.catBtn, ...(categoryFilter === c ? s.catBtnActive : {}) }}
                    onClick={() => setCategoryFilter(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <div style={s.emptyState}>
                <IcPackage />
                <p style={{ color: '#9CA3AF', marginTop: 12 }}>No products available in this category.</p>
              </div>
            ) : (
              <div style={s.productGrid}>
                {filteredProducts.map((p: any) => {
                  const qty = cartQty(p.id);
                  const outOfStock = p.stock_qty !== null && p.stock_qty !== undefined && p.stock_qty === 0;
                  return (
                    <div key={p.id} style={{ ...s.productCard, opacity: outOfStock ? 0.55 : 1 }}>
                      <div style={s.productIconWrap}>
                        <IcPackage />
                      </div>
                      <p style={s.productName}>{p.name}</p>
                      {p.description && <p style={s.productDesc}>{p.description}</p>}
                      {p.category && <span style={s.productCat}>{p.category}</span>}
                      <p style={s.productPrice}>{formatRs(p.price)}</p>
                      {p.stock_qty !== null && p.stock_qty !== undefined && (
                        <p style={{ fontSize: 11, color: p.stock_qty < 5 ? '#DC2626' : '#9CA3AF', marginBottom: 10 }}>
                          {p.stock_qty === 0 ? 'Out of stock' : `${p.stock_qty} in stock`}
                        </p>
                      )}
                      {outOfStock ? (
                        <div style={s.soldOutBtn}>Sold Out</div>
                      ) : qty === 0 ? (
                        <button style={s.addBtn} onClick={() => addToCart(p)}>Add to Cart</button>
                      ) : (
                        <div style={s.qtyRow}>
                          <button style={s.qtyBtn} onClick={() => removeFromCart(p.id)}><IcMinus /></button>
                          <span style={s.qtyNum}>{qty}</span>
                          <button style={s.qtyBtn} onClick={() => addToCart(p)}><IcPlus /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Floating cart bar */}
            {cart.length > 0 && !showCheckout && (
              <div style={s.cartBar}>
                <div style={s.cartBarLeft}>
                  <IcCart />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
                  <span style={{ color: '#BFDBFE', fontSize: 14 }}>{formatRs(cartTotal)}</span>
                </div>
                <button style={s.checkoutBtn} onClick={() => setShowCheckout(true)}>
                  Click &amp; Collect
                </button>
              </div>
            )}

            {/* Checkout panel */}
            {showCheckout && (
              <div style={s.overlay}>
                <div style={s.checkoutPanel}>
                  <div style={s.panelHeader}>
                    <h2 style={s.panelTitle}>Click &amp; Collect Order</h2>
                    <button style={s.closeBtn} onClick={() => setShowCheckout(false)}><IcX /></button>
                  </div>

                  <div style={s.orderSummary}>
                    {cart.map(c => (
                      <div key={c.product.id} style={s.summaryRow}>
                        <span style={s.summaryName}>{c.product.name} <span style={s.summaryQty}>×{c.qty}</span></span>
                        <span style={s.summaryPrice}>{formatRs(c.product.price * c.qty)}</span>
                      </div>
                    ))}
                    <div style={s.summaryTotal}>
                      <span>Total</span>
                      <span style={{ color: '#4F46E5', fontWeight: 800 }}>{formatRs(cartTotal)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                    <input style={s.input} placeholder="Phone number *" value={phone}
                      onChange={e => setPhone(e.target.value)} type="tel" />
                    <input style={s.input} placeholder="Your name (optional)" value={custName}
                      onChange={e => setCustName(e.target.value)} />
                    <textarea style={{ ...s.input, height: 72, resize: 'none' }} placeholder="Notes to store (optional)"
                      value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>

                  {orderError && <p style={s.errorMsg}>{orderError}</p>}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button style={{ ...s.placeBtn, opacity: placing ? 0.7 : 1 }} onClick={placeOrder} disabled={placing}>
                      {placing ? 'Placing...' : 'Place Order'}
                    </button>
                    <button style={s.cancelBtn} onClick={() => setShowCheckout(false)}>Cancel</button>
                  </div>

                  <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12 }}>
                    Pay at the store when you collect your order.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Offers tab */}
        {tab === 'offers' && (
          <div>
            {(store.active_offers ?? []).length === 0 ? (
              <div style={s.emptyState}>
                <IcTag />
                <p style={{ color: '#9CA3AF', marginTop: 12 }}>No active offers at this time.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {store.active_offers.map((o: any) => (
                  <div key={o.id} style={s.offerCard}>
                    <div style={s.offerCardInner}>
                      <div>
                        <p style={s.offerTitle}>{o.title}</p>
                        {o.description && <p style={s.offerDesc}>{o.description}</p>}
                        {o.valid_until && (
                          <p style={s.offerExpiry}>
                            Valid until {new Date(o.valid_until).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        {o.discount_percent && (
                          <span style={s.discountBadge}>{o.discount_percent}% OFF</span>
                        )}
                        {o.discount_flat && (
                          <span style={s.discountBadge}>{formatRs(o.discount_flat)} OFF</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rate tab */}
        {tab === 'rate' && (
          <div style={s.rateSection}>
            {ratingDone ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <div style={s.successIcon}><IcCheck /></div>
                </div>
                <p style={{ fontWeight: 800, fontSize: 20, color: '#111827', margin: '0 0 8px' }}>Thank you for your review!</p>
                <p style={{ color: '#6B7280', margin: 0 }}>Your rating has been submitted for {store.name}.</p>
              </div>
            ) : (
              <>
                <h2 style={s.rateTitle}>Rate your experience</h2>
                <p style={s.rateSub}>Share your feedback for {store.name}</p>

                <div style={{ marginBottom: 20 }}>
                  <StarPicker value={rating} onChange={setRating} />
                  {rating > 0 && (
                    <p style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>
                      {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  <textarea style={{ ...s.input, height: 84, resize: 'none' }}
                    placeholder="Write your review (optional)..."
                    value={review} onChange={e => setReview(e.target.value)} />
                  <input style={s.input} placeholder="Your phone number *"
                    value={ratingPhone} onChange={e => setRatingPhone(e.target.value)} type="tel" />
                </div>

                {ratingError && <p style={s.errorMsg}>{ratingError}</p>}

                <button style={s.rateBtn} onClick={submitRating}>Submit Rating</button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={s.footer}>
        <img src="/mero-business-logo.svg" alt="Mero Business" style={{ height: 22, width: 'auto' }} />
      </footer>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' },
  loadWrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },

  // Header
  header: { position: 'sticky', top: 0, zIndex: 50, background: '#fff', borderBottom: '1px solid #E5E7EB' },
  headerInner: { maxWidth: 960, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headerLogo: { display: 'flex', alignItems: 'center', textDecoration: 'none' },
  backBtn: { display: 'flex', alignItems: 'center', gap: 6, background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' },

  // Hero
  hero: { background: 'linear-gradient(135deg, #1E3A8A 0%, #312E81 100%)', padding: '32px 24px 36px' },
  heroInner: { maxWidth: 960, margin: '0 auto', display: 'flex', gap: 20, alignItems: 'flex-start' },
  heroIcon: { width: 64, height: 64, background: 'rgba(255,255,255,0.12)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  heroContent: { flex: 1, color: '#fff' },
  typeBadge: { display: 'inline-block', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600, color: '#E0E7FF', marginBottom: 8, letterSpacing: '0.02em' },
  storeName: { fontSize: 26, fontWeight: 900, margin: '0 0 6px', color: '#fff', lineHeight: 1.2 },
  storeAddr: { display: 'flex', alignItems: 'center', gap: 5, color: '#BFDBFE', fontSize: 14, marginBottom: 6 },
  storeDesc: { fontSize: 14, color: '#BFDBFE', margin: '0 0 10px', lineHeight: 1.5 },
  ratingRow: { display: 'flex', alignItems: 'center', gap: 8 },
  ratingText: { color: '#BFDBFE', fontSize: 13 },

  // Main
  main: { maxWidth: 960, margin: '0 auto', padding: '24px', flex: 1, width: '100%', boxSizing: 'border-box' },

  // Success
  successBanner: { background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 },

  // Tabs
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: { padding: '10px 20px', borderRadius: 20, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 },
  tabActive: { background: '#4F46E5', color: '#fff', borderColor: '#4F46E5' },
  offerCount: { background: '#DC2626', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 800 },

  // Category filters
  catRow: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  catBtn: { padding: '6px 16px', borderRadius: 20, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6B7280' },
  catBtnActive: { background: '#4F46E5', color: '#fff', borderColor: '#4F46E5' },

  // Product grid
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14, marginBottom: 120 },
  productCard: { background: '#fff', borderRadius: 16, padding: '18px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  productIconWrap: { width: 52, height: 52, background: '#F3F4F6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  productName: { fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 4px', lineHeight: 1.3 },
  productDesc: { fontSize: 12, color: '#6B7280', margin: '0 0 6px', lineHeight: 1.4 },
  productCat: { fontSize: 11, color: '#6B7280', background: '#F3F4F6', borderRadius: 8, padding: '2px 8px', marginBottom: 8 },
  productPrice: { fontSize: 16, fontWeight: 800, color: '#4F46E5', margin: '0 0 10px' },

  addBtn: { background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13, width: '100%' },
  soldOutBtn: { background: '#F3F4F6', color: '#9CA3AF', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, width: '100%', textAlign: 'center' },
  qtyRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 },
  qtyBtn: { background: '#F3F4F6', border: 'none', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#374151' },
  qtyNum: { fontSize: 17, fontWeight: 800, color: '#4F46E5', minWidth: 24, textAlign: 'center' },

  // Cart bar
  cartBar: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,0.15)' },
  cartBarLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  checkoutBtn: { background: '#fff', color: '#4F46E5', border: 'none', borderRadius: 10, padding: '11px 24px', fontWeight: 800, fontSize: 14, cursor: 'pointer' },

  // Checkout overlay
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  checkoutPanel: { background: '#fff', borderRadius: '24px 24px 0 0', padding: '28px 24px 32px', width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  panelTitle: { fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 },
  closeBtn: { background: '#F3F4F6', border: 'none', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#374151' },

  orderSummary: { background: '#F9FAFB', borderRadius: 12, padding: '14px 16px', marginBottom: 16 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryName: { fontSize: 14, color: '#374151', fontWeight: 500 },
  summaryQty: { color: '#9CA3AF', fontWeight: 400 },
  summaryPrice: { fontSize: 14, color: '#374151', fontWeight: 600 },
  summaryTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: 10, marginTop: 4, fontSize: 15, fontWeight: 700, color: '#111827' },

  input: { border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '12px 14px', fontSize: 15, background: '#F9FAFB', width: '100%', boxSizing: 'border-box', color: '#111827', outline: 'none' },
  errorMsg: { color: '#DC2626', fontSize: 13, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 12px', marginBottom: 12 },
  placeBtn: { background: 'linear-gradient(135deg, #16A34A, #15803D)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer', flex: 1 },
  cancelBtn: { background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 10, padding: '13px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },

  // Offers
  offerCard: { background: '#FFFBEB', borderRadius: 14, padding: '16px 20px', border: '1.5px solid #FDE68A' },
  offerCardInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  offerTitle: { fontWeight: 800, fontSize: 16, margin: '0 0 4px', color: '#111827' },
  offerDesc: { fontSize: 14, color: '#6B7280', margin: '0 0 6px' },
  offerExpiry: { fontSize: 12, color: '#D97706', margin: 0 },
  discountBadge: { background: '#DC2626', color: '#fff', borderRadius: 8, padding: '4px 12px', fontWeight: 800, fontSize: 14, display: 'block' },

  // Rate
  rateSection: { background: '#fff', borderRadius: 20, padding: '28px', maxWidth: 520, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  rateTitle: { fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 4px' },
  rateSub: { color: '#6B7280', fontSize: 14, marginBottom: 20 },
  rateBtn: { background: 'linear-gradient(135deg, #D97706, #B45309)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  successIcon: { width: 64, height: 64, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Empty state
  emptyState: { textAlign: 'center', padding: '56px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' },

  // Footer
  footer: { borderTop: '1px solid #E5E7EB', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#fff' },
  footerText: { fontSize: 13, color: '#9CA3AF', fontWeight: 500 },
};
