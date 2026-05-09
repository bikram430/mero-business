'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export function getMerchantType(): 'retail' | 'restaurant' {
  if (typeof window === 'undefined') return 'retail';
  return (localStorage.getItem('merchant_type') as 'retail' | 'restaurant') || 'retail';
}

export function getMerchantName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('merchant_name') || '';
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="9" fill="url(#mbG)"/>
      <path d="M9 8h14v17l-2.33-1.75-2.34 1.75L16 23.25l-2.33 1.75-2.34-1.75L9 25V8z" fill="white"/>
      <path d="M12.5 13h7M12.5 16.5h5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
      <defs>
        <linearGradient id="mbG" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#2563EB"/>
          <stop offset="1" stopColor="#7C3AED"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

const NAV = [
  { href: '/dashboard',      label: 'Dashboard', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { href: '/analytics',      label: 'Analytics', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { href: '/products',       label: 'Products',  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> },
  { href: '/history',        label: 'History',   icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { href: '/khata',          label: 'Khata',     icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { href: '/store-settings', label: 'My Store',  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
];

// ── PIN constants ──────────────────────────────────────────────────────────────
const PIN_KEY = 'mb_pin';
const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes

// ── Shared PIN components ──────────────────────────────────────────────────────
function PinDots({ count, dark = false }: { count: number; dark?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', margin: '22px 0' }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          width: 15, height: 15, borderRadius: '50%', transition: 'all 0.15s',
          background: i < count ? (dark ? '#60A5FA' : '#2563EB') : 'transparent',
          border: `2px solid ${i < count ? (dark ? '#60A5FA' : '#2563EB') : (dark ? 'rgba(255,255,255,0.3)' : '#CBD5E1')}`,
        }} />
      ))}
    </div>
  );
}

function PinPad({ onDigit, onBack, dark = false }: { onDigit: (d: string) => void; onBack: () => void; dark?: boolean }) {
  const btnStyle = (active: boolean): React.CSSProperties => ({
    height: 56, borderRadius: 13, fontSize: 20, fontWeight: 600, cursor: 'pointer', transition: 'background 0.1s',
    background: dark ? 'rgba(255,255,255,0.08)' : '#fff',
    border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #E2E8F0',
    color: dark ? '#fff' : '#0F172A',
  });
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 248, margin: '0 auto' }}>
      {keys.map((k, i) =>
        k === '' ? <div key={i} /> :
        k === '⌫' ? (
          <button key={i} onClick={onBack} style={{ ...btnStyle(false), color: dark ? '#94A3B8' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => (e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.15)' : '#F1F5F9')}
            onMouseLeave={e => (e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : '#fff')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
          </button>
        ) : (
          <button key={i} onClick={() => onDigit(k)} style={btnStyle(false)}
            onMouseEnter={e => (e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.16)' : '#EFF6FF')}
            onMouseLeave={e => (e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : '#fff')}>
            {k}
          </button>
        )
      )}
    </div>
  );
}

// ── PIN Setup Modal ────────────────────────────────────────────────────────────
function PinSetupModal({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  function handleDigit(d: string) {
    setError('');
    if (step === 'create') {
      const next = first.length < 4 ? first + d : first;
      setFirst(next);
      if (next.length === 4) setTimeout(() => setStep('confirm'), 120);
    } else {
      if (second.length >= 4) return;
      const next = second + d;
      setSecond(next);
      if (next.length === 4) {
        if (next === first) {
          localStorage.setItem(PIN_KEY, next);
          onDone();
        } else {
          setShake(true);
          setTimeout(() => { setShake(false); setSecond(''); setError("PINs don't match — try again."); }, 380);
        }
      }
    }
  }

  function handleBack() {
    setError('');
    if (step === 'create') setFirst(f => f.slice(0, -1));
    else setSecond(s => s.slice(0, -1));
  }

  const current = step === 'create' ? first : second;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.82)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '40px 32px 32px', width: 340, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.28)' }}>
        <Logo size={40} />
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '16px 0 6px' }}>Set your security PIN</h2>
        <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
          {step === 'create'
            ? 'Choose a 4-digit PIN. Your screen will lock after 10 minutes of inactivity.'
            : 'Re-enter the same PIN to confirm.'}
        </p>
        {error && <p style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, margin: '10px 0 0' }}>{error}</p>}
        <div style={{ animation: shake ? 'mb-shake 0.38s ease' : 'none' }}>
          <PinDots count={current.length} />
        </div>
        <PinPad onDigit={handleDigit} onBack={handleBack} />
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 20, lineHeight: 1.5 }}>
          You can change your PIN anytime from store settings.
        </p>
      </div>
    </div>
  );
}

// ── PIN Lock Screen ────────────────────────────────────────────────────────────
function PinLockScreen({ onUnlock, storeName }: { onUnlock: () => void; storeName: string }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [time, setTime] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Keyboard support
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      if (e.key === 'Backspace') handleBack();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function handleDigit(d: string) {
    setError('');
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (next === localStorage.getItem(PIN_KEY)) {
        onUnlock();
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setPin(''); setError('Incorrect PIN'); }, 380);
      }
    }
  }

  function handleBack() { setError(''); setPin(p => p.slice(0, -1)); }

  function handleSignOut() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem(PIN_KEY);
    router.replace('/login');
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(145deg,#0F172A 0%,#1E1B4B 60%,#0F172A 100%)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Clock */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <p style={{ fontSize: 64, fontWeight: 200, color: '#fff', margin: 0, letterSpacing: -3, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {time.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </p>
        <p style={{ fontSize: 14, color: '#64748B', margin: '8px 0 0' }}>
          {time.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Lock card */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: '32px 28px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', textAlign: 'center', width: 308 }}>
        <Logo size={36} />
        <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '12px 0 2px' }}>
          {storeName || 'Mero Business'}
        </p>
        <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Enter your PIN to continue</p>
        {error && <p style={{ fontSize: 12, color: '#F87171', fontWeight: 600, margin: '8px 0 0' }}>{error}</p>}
        <div style={{ animation: shake ? 'mb-shake 0.38s ease' : 'none' }}>
          <PinDots count={pin.length} dark />
        </div>
        <PinPad onDigit={handleDigit} onBack={handleBack} dark />
        <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 12, cursor: 'pointer', marginTop: 22, textDecoration: 'underline', textUnderlineOffset: 3 }}>
          Forgot PIN? Sign out
        </button>
      </div>
    </div>
  );
}

// ── Notification sound ─────────────────────────────────────────────────────────
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [880, 1100];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.22);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.25);
    });
  } catch { /* AudioContext not available */ }
}

// ── Notification Bell ──────────────────────────────────────────────────────────
function NotificationBell({ token }: { token: string }) {
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const isFirstRef = useRef(true);
  const dropRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const saved: string[] = JSON.parse(localStorage.getItem('mb_seen_orders') || '[]');
    seenRef.current = new Set(saved);

    async function poll() {
      try {
        const { data } = await axios.get(`${BASE_URL}/stores/me/collect-orders`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { status_filter: 'pending' },
        });
        const orders: any[] = Array.isArray(data) ? data : [];

        if (!isFirstRef.current) {
          const fresh = orders.filter(o => !seenRef.current.has(o.id));
          if (fresh.length > 0) {
            playNotificationSound();
            setNewCount(c => c + fresh.length);
          }
        }
        isFirstRef.current = false;
        setPendingOrders(orders);
      } catch { /* silently ignore poll errors */ }
    }

    poll();
    const iv = setInterval(poll, 15000);
    return () => clearInterval(iv);
  }, [token]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function openBell() {
    // Mark all currently visible as seen
    const ids = pendingOrders.map(o => o.id);
    ids.forEach(id => seenRef.current.add(id));
    localStorage.setItem('mb_seen_orders', JSON.stringify([...seenRef.current].slice(-200)));
    setNewCount(0);
    setOpen(v => !v);
  }

  async function updateStatus(orderId: string, status: string) {
    setUpdating(orderId);
    try {
      await axios.put(`${BASE_URL}/stores/me/collect-orders/${orderId}/status`,
        null,
        { headers: { Authorization: `Bearer ${token}` }, params: { new_status: status } }
      );
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    } catch { /* show nothing — order stays */ }
    finally { setUpdating(null); }
  }

  const totalPending = pendingOrders.length;

  return (
    <div style={{ position: 'relative' }} ref={dropRef}>
      <button
        onClick={openBell}
        style={{
          position: 'relative', background: 'transparent', border: '1.5px solid #E2E8F0',
          borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: '#475569', transition: 'all 0.15s',
        }}
      >
        {/* Bell SVG */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {/* Badge */}
        {(newCount > 0 || totalPending > 0) && (
          <span style={{
            position: 'absolute', top: -5, right: -5, background: newCount > 0 ? '#DC2626' : '#64748B',
            color: '#fff', fontSize: 10, fontWeight: 800, minWidth: 18, height: 18,
            borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1, border: '2px solid #fff',
            animation: newCount > 0 ? 'mb-pulse 1s ease infinite' : 'none',
          }}>
            {newCount > 0 ? newCount : totalPending}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'fixed', top: 64, right: 8, width: 'min(360px, calc(100vw - 16px))', background: '#fff',
          borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.14)', border: '1px solid #E2E8F0',
          zIndex: 200, overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', margin: 0 }}>Pending Orders</p>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>First-come, first-served</p>
            </div>
            <span style={{ background: '#EFF6FF', color: '#2563EB', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{totalPending} pending</span>
          </div>

          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {totalPending === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 16px' }}>
                <div style={{ width: 44, height: 44, background: '#F1F5F9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#94A3B8' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                </div>
                <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>No pending orders right now</p>
              </div>
            ) : (
              pendingOrders.map((order, idx) => (
                <div key={order.id} style={{ padding: '14px 18px', borderBottom: '1px solid #F8FAFC', background: idx === 0 ? '#FEFCE8' : '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {idx === 0 && <span style={{ background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>NEXT</span>}
                        <p style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', margin: 0 }}>
                          {order.customer_name || order.customer_phone}
                        </p>
                      </div>
                      <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0', fontFamily: 'monospace' }}>
                        #{String(order.id).slice(0, 8).toUpperCase()} · {order.created_at ? new Date(order.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                    <p style={{ fontWeight: 800, fontSize: 14, color: '#2563EB', margin: 0 }}>
                      Rs {((order.total_amount || 0) / 100).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    {(order.items || []).map((item: any, i: number) => (
                      <span key={i} style={{ fontSize: 11, color: '#475569', display: 'inline-block', background: '#F1F5F9', borderRadius: 5, padding: '2px 7px', marginRight: 4, marginBottom: 3 }}>
                        {item.qty}× {item.product_name}
                      </span>
                    ))}
                    {order.notes && <p style={{ fontSize: 11, color: '#D97706', margin: '4px 0 0', fontStyle: 'italic' }}>Note: {order.notes}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => updateStatus(order.id, 'accepted')}
                      disabled={updating === order.id}
                      style={{ flex: 1, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: updating === order.id ? 0.6 : 1 }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, 'cancelled')}
                      disabled={updating === order.id}
                      style={{ flex: 1, background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: updating === order.id ? 0.6 : 1 }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPending > 0 && (
            <div style={{ padding: '10px 18px', borderTop: '1px solid #F1F5F9' }}>
              <button
                onClick={() => { setOpen(false); router.push('/store-settings'); }}
                style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                View all orders in My Store
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shell ──────────────────────────────────────────────────────────────────────
export function MerchantShell({ children, maxWidth = 1200 }: { children: React.ReactNode; maxWidth?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [needsPinSetup, setNeedsPinSetup] = useState(false);
  const [locked, setLocked] = useState(false);
  const [storeName, setStoreName] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('access_token') || '');
    setStoreName(getMerchantName());

    const hasPin = !!localStorage.getItem(PIN_KEY);
    if (!hasPin) setNeedsPinSetup(true);

    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (localStorage.getItem(PIN_KEY)) setLocked(true);
      }, INACTIVITY_MS);
    }

    const EVENTS = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'] as const;
    EVENTS.forEach(ev => document.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      EVENTS.forEach(ev => document.removeEventListener(ev, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.replace('/login');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      {needsPinSetup && <PinSetupModal onDone={() => setNeedsPinSetup(false)} />}
      {locked && <PinLockScreen onUnlock={() => setLocked(false)} storeName={storeName} />}
      <style>{`
        .mb-nav-link { transition: background 0.15s, color 0.15s; white-space: nowrap; }
        .mb-nav-link:hover { background: #EFF6FF !important; color: #1D4ED8 !important; }
        .mb-logout:hover { background: #FEE2E2 !important; color: #DC2626 !important; border-color: #FECACA !important; }
        .mb-bell:hover { background: #F1F5F9 !important; }
        @keyframes mb-fade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .mb-fade { animation: mb-fade 0.25s ease both; }
        @keyframes mb-pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.2); } }
        @keyframes mb-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-9px)} 40%{transform:translateX(9px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }

        /* Mobile menu */
        .mb-nav-links { display: flex; gap: 2px; flex: 1; }
        .mb-hamburger { display: none; }
        .mb-mobile-menu { display: none; }

        /* Responsive grid utilities */
        .mb-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .mb-pnl-grid  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .mb-two-col   { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .mb-hero-row  { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
        .mb-hero-btn  { display: flex; align-items: center; gap: 10px; }

        @media (max-width: 900px) {
          .mb-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .mb-pnl-grid  { grid-template-columns: repeat(2, 1fr) !important; }
          .mb-two-col   { grid-template-columns: 1fr !important; }
          .mb-nav-links { display: none !important; }
          .mb-hamburger { display: flex !important; }
          .mb-mobile-menu { display: flex; flex-direction: column; gap: 4px; padding: 12px 16px; background: #fff; border-bottom: 1px solid #E2E8F0; }
        }

        @media (max-width: 600px) {
          .mb-stat-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .mb-pnl-grid  { grid-template-columns: 1fr !important; }
          .mb-hero-row  { flex-direction: column !important; gap: 16px !important; }
          .mb-hero-btn  { width: 100% !important; justify-content: center !important; }
          .mb-main-pad  { padding: 16px 12px !important; }
          .mb-logout-label { display: none !important; }
        }

        @media (max-width: 400px) {
          .mb-stat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Logo */}
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', marginRight: 12, flexShrink: 0 }}>
            <Logo size={28} />
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: -0.3 }}>Mero Business</span>
          </Link>

          {/* Desktop nav links */}
          <div className="mb-nav-links">
            {NAV.map((l) => {
              const active = pathname === l.href;
              return (
                <Link key={l.href} href={l.href} className="mb-nav-link" style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: active ? '#DBEAFE' : 'transparent',
                  color: active ? '#1E40AF' : '#475569',
                  textDecoration: 'none',
                  padding: '6px 11px', borderRadius: 8, fontSize: 13, fontWeight: active ? 700 : 500,
                }}>
                  <span style={{ opacity: active ? 1 : 0.6, display: 'flex', flexShrink: 0 }}>{l.icon}</span>
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div style={{ flex: 1 }} />

          {/* Bell + Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {token && <NotificationBell token={token} />}
            <button className="mb-logout" onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', color: '#94A3B8',
              border: '1px solid #E2E8F0', borderRadius: 8,
              padding: '7px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              transition: 'all 0.15s', flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span className="mb-logout-label">Logout</span>
            </button>

            {/* Hamburger */}
            <button className="mb-hamburger" onClick={() => setMenuOpen(v => !v)} style={{ background: 'transparent', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: '#475569', display: 'none', alignItems: 'center' }}>
              {menuOpen
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              }
            </button>
          </div>
        </div>

        {/* Mobile nav menu */}
        {menuOpen && (
          <div className="mb-mobile-menu">
            {NAV.map((l) => {
              const active = pathname === l.href;
              return (
                <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: active ? '#DBEAFE' : 'transparent',
                  color: active ? '#1E40AF' : '#475569',
                  textDecoration: 'none', padding: '10px 12px', borderRadius: 8, fontSize: 14, fontWeight: active ? 700 : 500,
                }}>
                  <span style={{ opacity: active ? 1 : 0.7, display: 'flex' }}>{l.icon}</span>
                  {l.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Page content */}
      <main className="mb-fade mb-main-pad" style={{ maxWidth, margin: '0 auto', padding: '28px 24px' }}>
        {children}
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-hero-row">
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '0 0 3px', letterSpacing: -0.4 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...style }}>
      {children}
    </div>
  );
}

export const lx = {
  input: {
    width: '100%', border: '1.5px solid #CBD5E1', borderRadius: 10, padding: '11px 14px',
    fontSize: 14, background: '#F8FAFC', color: '#0F172A', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  } as React.CSSProperties,
  label: { fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5, display: 'block' } as React.CSSProperties,
  btnPrimary: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' } as React.CSSProperties,
  btnDanger: { background: '#DC2626', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' } as React.CSSProperties,
  btnGhost: { background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
};
