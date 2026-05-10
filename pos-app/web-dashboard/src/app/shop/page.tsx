'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const IcSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const IcPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const IcUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const IcStore = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);
const IcFork = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
);
const IcStar = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);
const IcTag = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
);
const IcChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
);
const IcLocate = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>
);
const IcAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);

function StarRating({ rating, count }: { rating?: number; count: number }) {
  const filled = Math.round(rating ?? 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ display: 'flex', gap: 1, color: '#F59E0B' }}>
        {[1,2,3,4,5].map(n => (
          <span key={n} style={{ color: n <= filled ? '#F59E0B' : '#E2E8F0' }}><IcStar /></span>
        ))}
      </div>
      <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
        {rating ? rating.toFixed(1) : 'No ratings'} <span style={{ color: '#CBD5E1' }}>·</span> {count} {count === 1 ? 'review' : 'reviews'}
      </span>
    </div>
  );
}

export default function ShopPage() {
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locStatus, setLocStatus] = useState<'idle' | 'loading' | 'ok' | 'denied'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'restaurant' | 'retail'>('all');

  useEffect(() => { loadStores(); }, []);

  async function loadStores(lat?: number, lng?: number) {
    setLoading(true);
    try {
      const params: any = {};
      if (lat !== undefined) { params.lat = lat; params.lng = lng; }
      const { data } = await axios.get(`${BASE_URL}/stores`, { params });
      setStores(data);
    } catch {
      setStores([]);
    } finally {
      setLoading(false);
    }
  }

  function requestLocation() {
    setLocStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setLocStatus('ok');
        loadStores(c.lat, c.lng);
      },
      () => setLocStatus('denied'),
      { timeout: 10000 },
    );
  }

  const filtered = stores.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.address ?? '').toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || s.type === typeFilter || (typeFilter === 'retail' && s.type !== 'restaurant');
    return matchSearch && matchType;
  });

  const restaurants = filtered.filter(s => s.type === 'restaurant');
  const retailers = filtered.filter(s => s.type !== 'restaurant');

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .sc:hover { transform: translateY(-3px) !important; box-shadow: 0 10px 32px rgba(0,0,0,0.11) !important; }
        .sc { transition: transform 0.18s, box-shadow 0.18s; }
        input::placeholder { color: #94A3B8; }
        input:focus { outline: none; }
        .shop-nav-label { display: inline; }
        @media (max-width: 640px) {
          .shop-search { display: none !important; }
          .shop-nav-label { display: none !important; }
        }
        @media (max-width: 480px) {
          .shop-near-text { display: none !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 16px', height: 58, display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Brand logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <img src="/mero-business-logo.svg" alt="Mero Business" style={{ height: 32, width: 'auto' }} />
          </Link>

          {/* Search — hidden on mobile */}
          <div className="shop-search" style={{ flex: 1, position: 'relative', maxWidth: 440, marginLeft: 8 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none', display: 'flex' }}><IcSearch /></span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search stores or areas..."
              style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 9, border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#0F172A', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Near Me */}
          <button
            onClick={locStatus === 'ok' ? undefined : requestLocation}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              padding: '7px 13px', borderRadius: 9, cursor: locStatus === 'ok' ? 'default' : 'pointer',
              background: locStatus === 'ok' ? '#F0FDF4' : '#EFF6FF',
              border: `1.5px solid ${locStatus === 'ok' ? '#BBF7D0' : '#BFDBFE'}`,
              color: locStatus === 'ok' ? '#16A34A' : '#2563EB',
              fontSize: 13, fontWeight: 600,
            }}
          >
            {locStatus === 'loading' ? (
              <div style={{ width: 13, height: 13, border: '2px solid #BFDBFE', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <span style={{ display: 'flex' }}><IcLocate /></span>
            )}
            <span className="shop-near-text">{locStatus === 'ok' ? 'Nearby' : locStatus === 'loading' ? '...' : 'Near Me'}</span>
          </button>

          {/* Sign In */}
          <Link href="/customer/login" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#475569', fontSize: 13, textDecoration: 'none', padding: '7px 13px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontWeight: 600, flexShrink: 0, background: '#fff' }}>
            <IcUser />
            <span className="shop-nav-label">Sign In</span>
          </Link>
        </div>

        {/* Mobile search bar — visible only on small screens */}
        <div style={{ display: 'none' }} className="shop-mobile-search">
          <div style={{ padding: '0 16px 10px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 27, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none', display: 'flex' }}><IcSearch /></span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search stores..."
              style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 9, border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#0F172A', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <style>{`
          @media (max-width: 640px) {
            .shop-mobile-search { display: block !important; }
          }
        `}</style>
      </header>

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(135deg,#1E3A8A 0%,#312E81 100%)', padding: '44px 24px 52px', position: 'relative', overflow: 'hidden' }}>
        {/* subtle grid pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1140, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 20, padding: '5px 14px', marginBottom: 18 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: 0.5 }}>Browse local stores · Click &amp; Collect</span>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: -1.2, lineHeight: 1.1 }}>
            Order from stores near you
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', margin: '0 auto 30px', maxWidth: 520, lineHeight: 1.6 }}>
            Browse restaurants and shops, see their menu, place orders online and collect in-store.
          </p>

          {/* Type filter pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {[
              { key: 'all',        label: 'All Stores' },
              { key: 'restaurant', label: 'Restaurants' },
              { key: 'retail',     label: 'Retail Shops' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key as any)}
                style={{
                  padding: '9px 22px', borderRadius: 24, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  background: typeFilter === t.key ? '#fff' : 'rgba(255,255,255,0.1)',
                  color: typeFilter === t.key ? '#1E3A8A' : 'rgba(255,255,255,0.75)',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, maxWidth: 1140, width: '100%', margin: '0 auto', padding: '32px 24px 48px', boxSizing: 'border-box' }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
            <div style={{ width: 36, height: 36, border: '3px solid #DBEAFE', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#94A3B8', fontSize: 14, margin: 0 }}>Loading stores...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: '#fff', borderRadius: 20, border: '1px solid #E2E8F0' }}>
            <div style={{ width: 56, height: 56, background: '#F1F5F9', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#94A3B8' }}>
              <IcStore />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
              {search ? `No results for "${search}"` : 'No stores available yet'}
            </h2>
            <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>
              {search ? 'Try a different search term' : 'Stores will appear here once merchants go live in your area'}
            </p>
          </div>
        ) : (
          <>
            {/* Location denied notice */}
            {locStatus === 'denied' && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '11px 16px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#92400E' }}>
                <span style={{ display: 'flex', flexShrink: 0, color: '#D97706' }}><IcAlert /></span>
                Location access was denied. Enable it in your browser to sort stores by distance.
              </div>
            )}

            {/* Results bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
                <strong style={{ color: '#0F172A' }}>{filtered.length}</strong> store{filtered.length !== 1 ? 's' : ''} found
                {locStatus === 'ok' && <span style={{ color: '#94A3B8' }}> · sorted by distance</span>}
              </p>
              {locStatus !== 'ok' && locStatus !== 'loading' && (
                <button onClick={requestLocation} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
                  <IcLocate /> Sort by distance
                </button>
              )}
            </div>

            {typeFilter === 'all' ? (
              <>
                {restaurants.length > 0 && (
                  <Section title="Restaurants" count={restaurants.length} stores={restaurants} onNavigate={id => router.push(`/shop/${id}`)} />
                )}
                {retailers.length > 0 && (
                  <Section title="Retail Shops" count={retailers.length} stores={retailers} onNavigate={id => router.push(`/shop/${id}`)} topMargin={restaurants.length > 0} />
                )}
              </>
            ) : (
              <StoreGrid stores={filtered} onNavigate={id => router.push(`/shop/${id}`)} />
            )}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <footer style={{ background: '#fff', borderTop: '1px solid #E2E8F0', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <img src="/mero-business-logo.svg" alt="Mero Business" style={{ height: 24, width: 'auto' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, color: '#CBD5E1' }}>©2025</span>
            <Link href="/register" style={{ fontSize: 13, color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>Register your store</Link>
            <Link href="/login" style={{ fontSize: 13, color: '#94A3B8', textDecoration: 'none' }}>Merchant login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, count, stores, onNavigate, topMargin }: { title: string; count: number; stores: any[]; onNavigate: (id: string) => void; topMargin?: boolean }) {
  return (
    <section style={{ marginTop: topMargin ? 40 : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>{title}</h2>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '2px 9px', borderRadius: 20 }}>{count}</span>
      </div>
      <StoreGrid stores={stores} onNavigate={onNavigate} />
    </section>
  );
}

function StoreGrid({ stores, onNavigate }: { stores: any[]; onNavigate: (id: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
      {stores.map(store => (
        <StoreCard key={store.id} store={store} onClick={() => onNavigate(store.id)} />
      ))}
    </div>
  );
}

function StoreCard({ store, onClick }: { store: any; onClick: () => void }) {
  const isRest = store.type === 'restaurant';
  const hasOffers = (store.active_offers ?? []).length > 0;
  const topOffer = store.active_offers?.[0];

  return (
    <div
      className="sc"
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 16, overflow: 'hidden',
        border: '1px solid #E2E8F0', cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Top strip */}
      <div style={{
        height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 18px',
        background: isRest
          ? 'linear-gradient(135deg,#EFF6FF 0%,#F5F3FF 100%)'
          : 'linear-gradient(135deg,#F0FDF4 0%,#ECFDF5 100%)',
        borderBottom: `2px solid ${isRest ? '#BFDBFE' : '#BBF7D0'}`,
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', color: isRest ? '#2563EB' : '#16A34A' }}>
            {isRest ? <IcFork /> : <IcStore />}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: isRest ? '#7C3AED' : '#16A34A', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              {isRest ? 'Restaurant' : 'Retail'}
            </div>
            {store.distance_km != null && (
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                <IcPin /> {store.distance_km} km away
              </div>
            )}
          </div>
        </div>

        {hasOffers && (
          <div style={{ background: '#DC2626', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, letterSpacing: 0.3 }}>
            {store.active_offers.length} OFFER{store.active_offers.length > 1 ? 'S' : ''}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '14px 18px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>{store.name}</h3>

        {store.address && (
          <div style={{ fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ flexShrink: 0 }}><IcPin /></span>
            <span>{store.address}</span>
          </div>
        )}

        {store.description && (
          <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>
            {store.description}
          </p>
        )}

        <StarRating rating={store.avg_rating} count={store.rating_count} />

        {topOffer && (
          <div style={{ marginTop: 4, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#D97706' }}>
              <IcTag />
              <span style={{ fontWeight: 600 }}>{topOffer.title}</span>
            </div>
            {topOffer.discount_percent && <span style={{ color: '#DC2626', fontWeight: 800, fontSize: 13 }}>{topOffer.discount_percent}% OFF</span>}
            {topOffer.discount_flat && <span style={{ color: '#DC2626', fontWeight: 800, fontSize: 13 }}>Rs {topOffer.discount_flat / 100} OFF</span>}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: '#2563EB' }}>
          <span style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
            View store <IcChevron />
          </span>
        </div>
      </div>
    </div>
  );
}
