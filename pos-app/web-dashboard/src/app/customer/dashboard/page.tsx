'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Logo } from '@/components/MerchantShell';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function formatRs(paisa: number) { return `Rs ${(paisa / 100).toLocaleString()}`; }

// ── Icons ──────────────────────────────────────────────────────────────────────
const IcCompass  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>;
const IcPackage  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IcReceipt  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></svg>;
const IcUser     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcSearch   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcLocate   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>;
const IcPin      = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IcStore    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IcFork     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
const IcStar     = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcTag      = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const IcChevron  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>;
const IcLogout   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IcCheck    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcShield   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcMail     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IcPhone    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.5 19.79 19.79 0 01.01 2.84 2 2 0 012 .67h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.55a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>;
const IcEdit     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

// ── Types ──────────────────────────────────────────────────────────────────────
type Profile = { id: string; phone: string; name: string | null; email: string | null; phone_verified: boolean; email_verified: boolean };

const STATUS: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#FEF3C7', color: '#D97706', label: 'Pending'   },
  accepted:  { bg: '#DBEAFE', color: '#2563EB', label: 'Accepted'  },
  ready:     { bg: '#EDE9FE', color: '#7C3AED', label: 'Ready'     },
  collected: { bg: '#D1FAE5', color: '#16A34A', label: 'Collected' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' },
};

// ── Verification card sub-component ───────────────────────────────────────────
function VerifyCard({
  icon, title, subtitle, verified, value, placeholder, inputType,
  onSend, onConfirm, sending, confirming, devOtp, error,
}: {
  icon: React.ReactNode; title: string; subtitle: string; verified: boolean;
  value: string; placeholder: string; inputType: string;
  onSend: () => void; onConfirm: (otp: string) => void;
  sending: boolean; confirming: boolean; devOtp?: string; error?: string;
}) {
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  async function handleSend() {
    await onSend();
    setOtpSent(true);
    setOtp('');
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: `1.5px solid ${verified ? '#BBF7D0' : '#E2E8F0'}`, padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: verified ? '#F0FDF4' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: verified ? '#16A34A' : '#64748B' }}>
            {icon}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', margin: 0 }}>{title}</p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>{value || subtitle}</p>
          </div>
        </div>
        {verified ? (
          <span style={{ background: '#D1FAE5', color: '#16A34A', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
            <IcCheck /> Verified
          </span>
        ) : (
          <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
            Unverified
          </span>
        )}
      </div>

      {!verified && value && (
        <>
          {!otpSent ? (
            <button
              onClick={handleSend}
              disabled={sending}
              style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: sending ? 0.7 : 1 }}
            >
              {sending ? 'Sending...' : `Send verification code`}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {devOtp && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#92400E' }}>
                  Dev mode — OTP: <strong style={{ fontFamily: 'monospace', letterSpacing: 2 }}>{devOtp}</strong>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  style={{ flex: 1, border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 15, fontFamily: 'monospace', letterSpacing: 3, background: '#F8FAFC', outline: 'none' }}
                />
                <button
                  onClick={() => onConfirm(otp)}
                  disabled={confirming || otp.length !== 6}
                  style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (confirming || otp.length !== 6) ? 0.6 : 1 }}
                >
                  {confirming ? 'Verifying...' : 'Confirm'}
                </button>
              </div>
              <button onClick={handleSend} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                Resend code
              </button>
            </div>
          )}
        </>
      )}

      {!verified && !value && (
        <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>{subtitle}</p>
      )}

      {error && <p style={{ color: '#DC2626', fontSize: 12, marginTop: 8 }}>{error}</p>}
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────
export default function CustomerDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'discover' | 'orders' | 'receipts' | 'profile'>('discover');
  const [profile, setProfile] = useState<Profile | null>(null);

  // Discover
  const [stores, setStores]             = useState<any[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [locStatus, setLocStatus]       = useState<'idle' | 'loading' | 'ok' | 'denied'>('idle');
  const [search, setSearch]             = useState('');
  const [typeFilter, setTypeFilter]     = useState<'all' | 'restaurant' | 'retail'>('all');

  // Orders
  const [orders, setOrders]             = useState<any[]>([]);

  // Receipts
  const [receipts, setReceipts]         = useState<any[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

  // Profile editing
  const [editName, setEditName]         = useState('');
  const [editEmail, setEditEmail]       = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg]     = useState('');

  // Verification state
  const [phoneOtpState, setPhoneOtpState] = useState<{ sending: boolean; confirming: boolean; devOtp?: string; error?: string }>({ sending: false, confirming: false });
  const [emailOtpState, setEmailOtpState] = useState<{ sending: boolean; confirming: boolean; devOtp?: string; error?: string }>({ sending: false, confirming: false });

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Location & radius
  const [userCoords,    setUserCoords]    = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius,  setSearchRadius]  = useState(1); // km, default 1
  const [locPrompted,   setLocPrompted]   = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('customer_access_token');
    if (!token) { router.replace('/customer/login'); return; }
    loadProfile(token);
    loadAllStores();
    loadReceipts(token);
    loadOrders(token);
    // Restore saved radius
    const savedR = parseFloat(localStorage.getItem('search_radius_km') || '1');
    if (!isNaN(savedR)) setSearchRadius(savedR);
    // Auto-request location on first visit
    const locAsked = localStorage.getItem('loc_asked');
    if (!locAsked) { requestLocation(); localStorage.setItem('loc_asked', '1'); }
  }, []);

  // Poll orders every 30s
  useEffect(() => {
    const token = localStorage.getItem('customer_access_token');
    if (!token) return;
    const id = setInterval(() => loadOrders(token), 30000);
    return () => clearInterval(id);
  }, []);

  async function loadOrders(token: string) {
    try {
      const { data } = await axios.get(`${BASE_URL}/customer/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(Array.isArray(data) ? data : []);
    } catch { /* keep existing */ }
  }

  async function loadProfile(token: string) {
    try {
      const { data } = await axios.get(`${BASE_URL}/customer/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(data);
      setEditName(data.name || '');
      setEditEmail(data.email || '');
      if (data.name) localStorage.setItem('customer_name', data.name);
    } catch {
      router.replace('/customer/login');
    }
  }

  async function loadAllStores(lat?: number, lng?: number) {
    setLoadingStores(true);
    try {
      const params: any = {};
      if (lat !== undefined) { params.lat = lat; params.lng = lng; }
      const { data } = await axios.get(`${BASE_URL}/stores`, { params });
      setStores(data);
    } catch { setStores([]); }
    finally { setLoadingStores(false); }
  }

  async function loadReceipts(token: string) {
    setLoadingReceipts(true);
    try {
      const res = await fetch(`${BASE_URL}/customer/receipts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : [];
      setReceipts(Array.isArray(data) ? data : []);
    } catch { setReceipts([]); }
    finally { setLoadingReceipts(false); }
  }

  function requestLocation() {
    setLocStatus('loading');
    setLocPrompted(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocStatus('ok');
        setUserCoords(coords);
        loadAllStores(coords.lat, coords.lng);
      },
      () => setLocStatus('denied'),
      { timeout: 10000 },
    );
  }

  function logout() {
    ['customer_access_token', 'customer_refresh_token', 'customer_phone'].forEach(k => localStorage.removeItem(k));
    router.replace('/customer/login');
  }

  async function saveProfile() {
    const token = localStorage.getItem('customer_access_token');
    setSavingProfile(true); setProfileMsg('');
    try {
      const { data } = await axios.put(`${BASE_URL}/customer/me`,
        { name: editName || null, email: editEmail || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(data);
      setProfileMsg('Profile updated successfully.');
    } catch (e: any) {
      setProfileMsg(e.response?.data?.detail || 'Could not save changes.');
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg(''), 4000);
    }
  }

  async function sendPhoneOtp() {
    const token = localStorage.getItem('customer_access_token');
    setPhoneOtpState(s => ({ ...s, sending: true, error: undefined }));
    try {
      const { data } = await axios.post(`${BASE_URL}/customer/me/verify-phone/send`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setPhoneOtpState(s => ({ ...s, sending: false, devOtp: data.dev_otp }));
    } catch (e: any) {
      setPhoneOtpState(s => ({ ...s, sending: false, error: e.response?.data?.detail || 'Could not send OTP.' }));
    }
  }

  async function confirmPhoneOtp(otp: string) {
    const token = localStorage.getItem('customer_access_token');
    setPhoneOtpState(s => ({ ...s, confirming: true, error: undefined }));
    try {
      await axios.post(`${BASE_URL}/customer/me/verify-phone/confirm`, { otp }, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(p => p ? { ...p, phone_verified: true } : p);
      setPhoneOtpState({ sending: false, confirming: false });
    } catch (e: any) {
      setPhoneOtpState(s => ({ ...s, confirming: false, error: e.response?.data?.detail || 'Invalid OTP.' }));
    }
  }

  async function sendEmailOtp() {
    const token = localStorage.getItem('customer_access_token');
    setEmailOtpState(s => ({ ...s, sending: true, error: undefined }));
    try {
      const { data } = await axios.post(`${BASE_URL}/customer/me/verify-email/send`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setEmailOtpState(s => ({ ...s, sending: false, devOtp: data.dev_otp }));
    } catch (e: any) {
      setEmailOtpState(s => ({ ...s, sending: false, error: e.response?.data?.detail || 'Could not send OTP.' }));
    }
  }

  async function confirmEmailOtp(otp: string) {
    const token = localStorage.getItem('customer_access_token');
    setEmailOtpState(s => ({ ...s, confirming: true, error: undefined }));
    try {
      await axios.post(`${BASE_URL}/customer/me/verify-email/confirm`, { otp }, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(p => p ? { ...p, email_verified: true } : p);
      setEmailOtpState({ sending: false, confirming: false });
    } catch (e: any) {
      setEmailOtpState(s => ({ ...s, confirming: false, error: e.response?.data?.detail || 'Invalid OTP.' }));
    }
  }

  function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371, r = (d: number) => d * Math.PI / 180;
    const dLat = r(lat2 - lat1), dLon = r(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(r(lat1))*Math.cos(r(lat2))*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function distKm(s: any): number | null {
    if (!userCoords || s.lat == null || s.lng == null) return null;
    return haversineKm(userCoords.lat, userCoords.lng, s.lat, s.lng);
  }

  // Stores with distance attached (sorted nearest first when location available)
  const storesWithDist = stores
    .map(s => ({ ...s, _km: distKm(s) }))
    .sort((a, b) => (a._km ?? 9999) - (b._km ?? 9999));

  // Radius filtering: if location known, apply radius; auto-expand if empty
  function getRadiusFiltered(list: any[]) {
    if (!userCoords) return list;
    const inRadius = list.filter(s => s._km == null || s._km <= searchRadius);
    if (inRadius.length > 0) return inRadius;
    // Auto-expand: 3km → 5km → all
    const expand3 = list.filter(s => s._km == null || s._km <= 3);
    if (expand3.length > 0) return expand3;
    const expand5 = list.filter(s => s._km == null || s._km <= 5);
    if (expand5.length > 0) return expand5;
    return list;
  }

  const filtered = getRadiusFiltered(storesWithDist).filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.address ?? '').toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || s.type === typeFilter || (typeFilter === 'retail' && s.type !== 'restaurant');
    return matchSearch && matchType;
  });

  const restaurants = filtered.filter(s => s.type === 'restaurant');
  const retailers   = filtered.filter(s => s.type !== 'restaurant');

  const displayName = profile?.name || profile?.phone || '';
  const shortId = profile ? `MB-${profile.id.slice(0, 8).toUpperCase()}` : '';
  const isVerified = profile?.phone_verified || profile?.email_verified;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .sc:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.10) !important; }
        .sc { transition: transform 0.15s, box-shadow 0.15s; }
        .tab-btn:hover { color: #1E40AF !important; background: #EFF6FF !important; }
        .sign-out-btn:hover { background: #FEE2E2 !important; }
        input::placeholder { color: #94A3B8; }
        input:focus, textarea:focus { outline: none; border-color: #93C5FD !important; }
        @media (max-width: 700px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
          .hide-mobile { display: none !important; }
          .mobile-spacer { display: block !important; }
        }
        @media (min-width: 701px) {
          .hamburger { display: none !important; }
          .mobile-spacer { display: none !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 0 }}>

          {/* Brand */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0, marginRight: 32 }}>
            <Logo size={32} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', letterSpacing: -0.5, lineHeight: 1.1 }}>Mero Business</div>
              <div style={{ fontSize: 10, color: '#7C3AED', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, lineHeight: 1.2 }}>Customer</div>
            </div>
          </Link>

          {/* Desktop tabs */}
          <nav style={{ display: 'flex', gap: 4, flex: 1, alignItems: 'center' }} className="desktop-nav">
            {([
              { key: 'discover',  label: 'Discover',   Icon: IcCompass },
              { key: 'orders',    label: 'My Orders',  Icon: IcPackage },
              { key: 'receipts',  label: 'Receipts',   Icon: IcReceipt },
              { key: 'profile',   label: 'Profile',    Icon: IcUser    },
            ] as const).map(({ key, label, Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  className="tab-btn"
                  onClick={() => setTab(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 16px 6px', borderRadius: 0, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: active ? 700 : 500,
                    background: 'transparent',
                    color: active ? '#1E40AF' : '#64748B',
                    position: 'relative',
                    borderBottom: active ? '2px solid #2563EB' : '2px solid transparent',
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.65, display: 'flex' }}><Icon /></span>
                  {label}
                  {key === 'orders' && orders.filter(o => o.status === 'pending' || o.status === 'ready').length > 0 && (
                    <span style={{ background: '#2563EB', color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>
                      {orders.filter(o => o.status === 'pending' || o.status === 'ready').length}
                    </span>
                  )}
                  {key === 'profile' && !isVerified && profile && (
                    <span style={{ width: 7, height: 7, background: '#F59E0B', borderRadius: '50%', flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </nav>

          <div style={{ flex: 1 }} className="mobile-spacer" />

          {/* Right: ID + sign out */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {shortId && (
              <div style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#475569', fontFamily: 'monospace', letterSpacing: 0.5 }} className="hide-mobile">
                {shortId}
              </div>
            )}
            <button onClick={logout} className="sign-out-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFF5F5', border: '1.5px solid #FECACA', borderRadius: 9, padding: '7px 14px', cursor: 'pointer', fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
              <IcLogout /> <span className="hide-mobile">Sign out</span>
            </button>

            {/* Hamburger (mobile) */}
            <button
              className="hamburger"
              onClick={() => setMobileMenuOpen(v => !v)}
              style={{ display: 'none', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 9, padding: '8px 10px', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round">
                {mobileMenuOpen
                  ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                  : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div style={{ background: '#fff', borderTop: '1px solid #E2E8F0', padding: '8px 16px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
            {([
              { key: 'discover',  label: 'Discover',   Icon: IcCompass },
              { key: 'orders',    label: 'My Orders',  Icon: IcPackage },
              { key: 'receipts',  label: 'Receipts',   Icon: IcReceipt },
              { key: 'profile',   label: 'Profile',    Icon: IcUser    },
            ] as const).map(({ key, label, Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => { setTab(key); setMobileMenuOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    padding: '12px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: active ? 700 : 500,
                    background: active ? '#EFF6FF' : 'transparent',
                    color: active ? '#1E40AF' : '#374151',
                    marginTop: 4,
                  }}
                >
                  <span style={{ color: active ? '#2563EB' : '#94A3B8', display: 'flex' }}><Icon /></span>
                  {label}
                  {key === 'orders' && orders.filter(o => o.status === 'pending' || o.status === 'ready').length > 0 && (
                    <span style={{ background: '#2563EB', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10, marginLeft: 4 }}>
                      {orders.filter(o => o.status === 'pending' || o.status === 'ready').length}
                    </span>
                  )}
                </button>
              );
            })}
            {shortId && (
              <div style={{ margin: '12px 14px 0', padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#475569', fontFamily: 'monospace', letterSpacing: 0.5, borderTop: '1px solid #E2E8F0' }}>
                Customer ID: {shortId}
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── DISCOVER TAB ── */}
      {tab === 'discover' && (
        <>
          <div style={{ background: 'linear-gradient(135deg,#1E3A8A 0%,#312E81 100%)', padding: '36px 24px 44px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
            <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: -0.8 }}>
                Welcome back{displayName ? `, ${displayName}` : ''}
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: '0 0 22px' }}>
                Browse stores, place orders, collect in-store
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', display: 'flex', pointerEvents: 'none' }}><IcSearch /></span>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search stores or areas..."
                    style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                {[{ key: 'all', label: 'All' }, { key: 'restaurant', label: 'Restaurants' }, { key: 'retail', label: 'Retail' }].map(t => (
                  <button key={t.key} onClick={() => setTypeFilter(t.key as any)}
                    style={{ padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: typeFilter === t.key ? '#fff' : 'rgba(255,255,255,0.1)', color: typeFilter === t.key ? '#1E3A8A' : 'rgba(255,255,255,0.75)' }}
                  >{t.label}</button>
                ))}
                <button onClick={locStatus === 'ok' ? undefined : requestLocation}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.2)', cursor: locStatus === 'ok' ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, background: locStatus === 'ok' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.08)', color: locStatus === 'ok' ? '#4ADE80' : 'rgba(255,255,255,0.75)' }}
                >
                  {locStatus === 'loading' ? <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : <span style={{ display: 'flex' }}><IcLocate /></span>}
                  {locStatus === 'ok' ? 'By distance' : locStatus === 'loading' ? 'Locating...' : 'Near Me'}
                </button>
              </div>
            </div>
          </div>

          {/* Location prompt banner */}
          {locStatus === 'idle' && !locPrompted && (
            <div style={{ background: '#EFF6FF', borderBottom: '1px solid #BFDBFE', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#2563EB', display: 'flex', flexShrink: 0 }}><IcLocate /></span>
                <span style={{ fontSize: 13, color: '#1E40AF', fontWeight: 500 }}>Enable location to see stores near you and get distance estimates.</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={requestLocation} style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Enable Location</button>
                <button onClick={() => setLocPrompted(true)} style={{ background: 'transparent', color: '#64748B', border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 12px', fontSize: 13, cursor: 'pointer' }}>Not now</button>
              </div>
            </div>
          )}
          {locStatus === 'denied' && (
            <div style={{ background: '#FFF7ED', borderBottom: '1px solid #FED7AA', padding: '10px 24px', fontSize: 13, color: '#92400E' }}>
              Location access denied — showing all stores. Enable location in your browser settings to see nearby stores first.
            </div>
          )}

          {/* Radius controls */}
          {locStatus === 'ok' && (
            <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>Search radius:</span>
              {[1, 3, 5, 0].map(km => (
                <button
                  key={km}
                  onClick={() => { setSearchRadius(km); localStorage.setItem('search_radius_km', String(km)); }}
                  style={{ padding: '5px 14px', borderRadius: 20, border: '1.5px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    borderColor: searchRadius === km ? '#2563EB' : '#E2E8F0',
                    background: searchRadius === km ? '#EFF6FF' : '#fff',
                    color: searchRadius === km ? '#1E40AF' : '#64748B',
                  }}
                >
                  {km === 0 ? 'All' : `${km} km`}
                </button>
              ))}
              <span style={{ fontSize: 12, color: '#94A3B8' }}>
                {searchRadius > 0 && filtered.length > 0 && `${filtered.length} store${filtered.length !== 1 ? 's' : ''} nearby`}
              </span>
            </div>
          )}

          <div style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: '28px 24px 48px', boxSizing: 'border-box' }}>
            {loadingStores ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 14 }}>
                <div style={{ width: 34, height: 34, border: '3px solid #DBEAFE', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: '#94A3B8', fontSize: 14, margin: 0 }}>Loading stores...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 24px', background: '#fff', borderRadius: 18, border: '1px solid #E2E8F0' }}>
                <div style={{ width: 52, height: 52, background: '#F1F5F9', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#94A3B8' }}><IcStore /></div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
                  {search ? `No results for "${search}"` : userCoords && searchRadius > 0 ? `No stores within ${searchRadius} km` : 'No stores available yet'}
                </h2>
                <p style={{ color: '#64748B', fontSize: 14, margin: '0 0 16px' }}>
                  {search ? 'Try a different search' : userCoords && searchRadius > 0 ? 'Try expanding your search radius above' : 'Stores will appear here once merchants go live'}
                </p>
                {userCoords && searchRadius > 0 && (
                  <button onClick={() => { setSearchRadius(0); localStorage.setItem('search_radius_km', '0'); }} style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Show all stores</button>
                )}
              </div>
            ) : typeFilter === 'all' ? (
              <>
                {restaurants.length > 0 && <StoreSection title="Restaurants" stores={restaurants} onGo={id => router.push(`/shop/${id}`)} />}
                {retailers.length > 0 && <StoreSection title="Retail Shops" stores={retailers} onGo={id => router.push(`/shop/${id}`)} top={restaurants.length > 0} />}
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 18 }}><strong style={{ color: '#0F172A' }}>{filtered.length}</strong> stores found</p>
                <StoreGrid stores={filtered} onGo={id => router.push(`/shop/${id}`)} />
              </>
            )}
          </div>
        </>
      )}

      {/* ── ORDERS TAB ── */}
      {tab === 'orders' && (
        <div style={{ flex: 1, maxWidth: 760, width: '100%', margin: '0 auto', padding: '32px 24px 48px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>My Orders</h1>
            <span style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
              Live · refreshes every 30s
            </span>
          </div>
          <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px' }}>Click &amp; Collect orders placed from local stores</p>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', background: '#fff', borderRadius: 18, border: '1px solid #E2E8F0' }}>
              <div style={{ width: 52, height: 52, background: '#F1F5F9', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#94A3B8' }}><IcPackage /></div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>No orders yet</h2>
              <p style={{ color: '#64748B', fontSize: 14, margin: '0 0 20px' }}>Browse stores and place your first Click &amp; Collect order</p>
              <button onClick={() => setTab('discover')} style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Browse Stores</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {orders.map((o: any) => {
                const st = STATUS[o.status] || { bg: '#F1F5F9', color: '#64748B', label: o.status };
                const steps = [
                  { key: 'pending',   label: 'Order Placed',      eta: 'Waiting for store confirmation' },
                  { key: 'accepted',  label: 'Accepted by Store',  eta: 'Being prepared (~10–20 min)'    },
                  { key: 'ready',     label: 'Ready to Collect',   eta: 'Come collect your order!'       },
                  { key: 'collected', label: 'Collected',           eta: 'Order complete'                },
                ];
                const stepIdx = steps.findIndex(s => s.key === o.status);
                const isCancelled = o.status === 'cancelled';
                return (
                  <div key={o.id} style={{ background: '#fff', borderRadius: 16, border: `1.5px solid ${o.status === 'ready' ? '#BBF7D0' : '#E2E8F0'}`, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 17, color: '#0F172A', margin: '0 0 3px' }}>{o.store_name || 'Store'}</p>
                        <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, fontFamily: 'monospace' }}>#{String(o.id).slice(-8).toUpperCase()}</p>
                        {o.created_at && <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{new Date(o.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
                      </div>
                      <span style={{ background: st.bg, color: st.color, padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', flexShrink: 0 }}>{st.label}</span>
                    </div>

                    {/* Status timeline */}
                    {!isCancelled && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 0, position: 'relative' }}>
                          {steps.map((step, i) => {
                            const done    = i < stepIdx || o.status === 'collected';
                            const current = i === stepIdx && o.status !== 'collected';
                            const future  = i > stepIdx && o.status !== 'collected';
                            return (
                              <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                {i > 0 && (
                                  <div style={{ position: 'absolute', top: 10, left: '-50%', right: '50%', height: 2, background: done ? '#16A34A' : '#E2E8F0', zIndex: 0 }} />
                                )}
                                <div style={{ width: 20, height: 20, borderRadius: '50%', zIndex: 1, background: done ? '#16A34A' : current ? '#2563EB' : '#E2E8F0', border: current ? '3px solid #BFDBFE' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                  {current && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }} />}
                                </div>
                                <p style={{ fontSize: 10, fontWeight: current ? 700 : 500, color: done ? '#16A34A' : current ? '#1E40AF' : '#94A3B8', textAlign: 'center', margin: '4px 0 0', lineHeight: 1.3, maxWidth: 68 }}>{step.label}</p>
                              </div>
                            );
                          })}
                        </div>
                        {stepIdx >= 0 && stepIdx < steps.length && o.status !== 'collected' && (
                          <p style={{ fontSize: 12, color: '#64748B', textAlign: 'center', margin: '10px 0 0' }}>
                            {steps[stepIdx].eta}
                          </p>
                        )}
                      </div>
                    )}

                    {isCancelled && (
                      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
                        Order cancelled
                      </div>
                    )}

                    {/* Ready banner */}
                    {o.status === 'ready' && (
                      <div style={{ background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: 14, color: '#15803D', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Your order is ready — come collect it from the store!
                      </div>
                    )}

                    {/* Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, background: '#F8FAFC', borderRadius: 10, padding: '10px 14px' }}>
                      {(o.items ?? []).map((item: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569' }}>
                          <span>{item.product_name} ×{item.qty}</span>
                          <span style={{ fontWeight: 600 }}>{item.unit_price ? formatRs(item.unit_price * item.qty) : ''}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#94A3B8' }}>Total</span>
                      <strong style={{ fontSize: 18, color: '#2563EB' }}>{o.total != null ? formatRs(o.total) : o.total_amount != null ? formatRs(o.total_amount) : ''}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── RECEIPTS TAB ── */}
      {tab === 'receipts' && (
        <div style={{ flex: 1, maxWidth: 760, width: '100%', margin: '0 auto', padding: '32px 24px 48px', boxSizing: 'border-box' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>My Receipts</h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px' }}>Digital receipts from merchants using Mero Business</p>
          {loadingReceipts ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <div style={{ width: 32, height: 32, border: '3px solid #DBEAFE', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : receipts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', background: '#fff', borderRadius: 18, border: '1px solid #E2E8F0' }}>
              <div style={{ width: 52, height: 52, background: '#F1F5F9', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#94A3B8' }}><IcReceipt /></div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>No receipts yet</h2>
              <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>When a merchant sends you a digital receipt, it will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {receipts.map((r: any) => (
                <Link key={r.id} href={`/receipt/${r.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontWeight: 700, color: '#0F172A', fontSize: 15, margin: '0 0 4px' }}>{r.merchant_name}</p>
                      <p style={{ color: '#94A3B8', fontSize: 12, margin: 0 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <strong style={{ color: '#16A34A', fontSize: 17 }}>{r.total_amount ? formatRs(r.total_amount) : `Rs ${r.total}`}</strong>
                      <span style={{ color: '#CBD5E1', display: 'flex' }}><IcChevron /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PROFILE TAB ── */}
      {tab === 'profile' && profile && (
        <div style={{ flex: 1, maxWidth: 680, width: '100%', margin: '0 auto', padding: '32px 24px 48px', boxSizing: 'border-box' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>My Profile</h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 28px' }}>Manage your account details and verification</p>

          {/* Customer ID card */}
          <div style={{ background: 'linear-gradient(135deg,#1E3A8A,#312E81)', borderRadius: 16, padding: '20px 24px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '0 0 4px', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Customer ID</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0, fontFamily: 'monospace', letterSpacing: 1 }}>{shortId}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '6px 0 0', fontFamily: 'monospace' }}>{profile.id}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              {isVerified ? (
                <span style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ADE80', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <IcShield /> Verified
                </span>
              ) : (
                <span style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#FCD34D', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20 }}>
                  Unverified
                </span>
              )}
            </div>
          </div>

          {/* Click & Collect notice */}
          {!isVerified && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <IcShield />
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#92400E', margin: '0 0 2px' }}>Verify to use Click &amp; Collect</p>
                <p style={{ fontSize: 12, color: '#B45309', margin: 0 }}>Phone or email verification is required to place Click &amp; Collect orders. Browsing stores is always free.</p>
              </div>
            </div>
          )}

          {/* Edit name & email */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '22px 24px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}><IcEdit /> Account Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Full Name</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Your full name"
                  style={{ width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '11px 14px', fontSize: 14, boxSizing: 'border-box', background: '#F8FAFC', color: '#111827' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email Address</label>
                <input
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  placeholder="your@email.com"
                  type="email"
                  style={{ width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '11px 14px', fontSize: 14, boxSizing: 'border-box', background: '#F8FAFC', color: '#111827' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: savingProfile ? 0.7 : 1 }}
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                {profileMsg && (
                  <p style={{ fontSize: 13, color: profileMsg.includes('success') ? '#16A34A' : '#DC2626', margin: 0 }}>{profileMsg}</p>
                )}
              </div>
            </div>
          </div>

          {/* Search radius setting */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px 24px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <IcLocate /> Store Discovery Radius
            </h2>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 14px' }}>Default search radius when browsing stores near you. Auto-expands if no stores are found.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[1, 3, 5, 0].map(km => (
                <button
                  key={km}
                  onClick={() => { setSearchRadius(km); localStorage.setItem('search_radius_km', String(km)); }}
                  style={{ padding: '8px 18px', borderRadius: 20, border: '1.5px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    borderColor: searchRadius === km ? '#2563EB' : '#E2E8F0',
                    background: searchRadius === km ? '#EFF6FF' : '#fff',
                    color: searchRadius === km ? '#1E40AF' : '#64748B',
                  }}
                >
                  {km === 0 ? 'Show all' : `${km} km`}
                </button>
              ))}
            </div>
            {locStatus !== 'ok' && (
              <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 10 }}>
                Enable location in the Discover tab to activate proximity filtering.
              </p>
            )}
          </div>

          {/* Verification section */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '22px 24px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}><IcShield /> Identity Verification</h2>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 18px' }}>Verify at least one contact method to unlock Click &amp; Collect ordering.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <VerifyCard
                icon={<IcPhone />}
                title="Phone Number"
                subtitle="Verify your registered phone number"
                verified={profile.phone_verified}
                value={profile.phone}
                placeholder="Phone"
                inputType="tel"
                onSend={sendPhoneOtp}
                onConfirm={confirmPhoneOtp}
                sending={phoneOtpState.sending}
                confirming={phoneOtpState.confirming}
                devOtp={phoneOtpState.devOtp}
                error={phoneOtpState.error}
              />
              <VerifyCard
                icon={<IcMail />}
                title="Email Address"
                subtitle={profile.email ? 'Verify your email address' : 'Add an email address above, then verify it'}
                verified={profile.email_verified}
                value={profile.email || ''}
                placeholder="Email"
                inputType="email"
                onSend={sendEmailOtp}
                onConfirm={confirmEmailOtp}
                sending={emailOtpState.sending}
                confirming={emailOtpState.confirming}
                devOtp={emailOtpState.devOtp}
                error={emailOtpState.error}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer style={{ background: '#fff', borderTop: '1px solid #E2E8F0', padding: '22px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Logo size={20} />
          <span style={{ fontSize: 12, color: '#94A3B8' }}>© 2025 Mero Business · Nepal&apos;s Digital POS Platform</span>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
const IcPin2      = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IcStar2     = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcTag2      = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const IcChevron2  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>;
const IcStore2    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IcFork2     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;

function StarRow({ rating, count }: { rating?: number; count: number }) {
  const filled = Math.round(rating ?? 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ display: 'flex', gap: 1 }}>
        {[1,2,3,4,5].map(n => (
          <span key={n} style={{ color: n <= filled ? '#F59E0B' : '#E2E8F0', display: 'flex' }}><IcStar2 /></span>
        ))}
      </div>
      <span style={{ fontSize: 11, color: '#94A3B8' }}>
        {rating ? rating.toFixed(1) : 'No ratings'} · {count} {count === 1 ? 'review' : 'reviews'}
      </span>
    </div>
  );
}

function StoreSection({ title, stores, onGo, top }: { title: string; stores: any[]; onGo: (id: string) => void; top?: boolean }) {
  return (
    <section style={{ marginTop: top ? 36 : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>{title}</h2>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '2px 9px', borderRadius: 20 }}>{stores.length}</span>
      </div>
      <StoreGrid stores={stores} onGo={onGo} />
    </section>
  );
}

function StoreGrid({ stores, onGo }: { stores: any[]; onGo: (id: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 14 }}>
      {stores.map(s => <StoreCard key={s.id} store={s} onClick={() => onGo(s.id)} />)}
    </div>
  );
}

function StoreCard({ store, onClick }: { store: any; onClick: () => void }) {
  const isRest = store.type === 'restaurant';
  const topOffer = store.active_offers?.[0];

  return (
    <div className="sc" onClick={onClick}
      style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #E2E8F0', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ height: 68, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, background: isRest ? 'linear-gradient(135deg,#EFF6FF,#F5F3FF)' : 'linear-gradient(135deg,#F0FDF4,#ECFDF5)', borderBottom: `2px solid ${isRest ? '#BFDBFE' : '#BBF7D0'}`, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', color: isRest ? '#2563EB' : '#16A34A' }}>
            {isRest ? <IcFork2 /> : <IcStore2 />}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: isRest ? '#7C3AED' : '#16A34A', letterSpacing: 0.7, textTransform: 'uppercase' }}>{isRest ? 'Restaurant' : 'Retail'}</div>
            {store.distance_km != null && (
              <div style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}><IcPin2 /> {store.distance_km} km</div>
            )}
          </div>
        </div>
        {store.active_offers?.length > 0 && (
          <div style={{ background: '#DC2626', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20 }}>{store.active_offers.length} OFFER{store.active_offers.length > 1 ? 'S' : ''}</div>
        )}
      </div>
      <div style={{ padding: '13px 16px 15px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>{store.name}</h3>
        {store.address && <div style={{ fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 3 }}><IcPin2 /> {store.address}</div>}
        {store.description && <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>{store.description}</p>}
        <StarRow rating={store.avg_rating} count={store.rating_count} />
        {topOffer && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 7, padding: '5px 9px', fontSize: 11, color: '#92400E', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#D97706' }}><IcTag2 /> <span style={{ fontWeight: 600 }}>{topOffer.title}</span></div>
            {topOffer.discount_percent && <span style={{ color: '#DC2626', fontWeight: 800 }}>{topOffer.discount_percent}% OFF</span>}
            {topOffer.discount_flat && <span style={{ color: '#DC2626', fontWeight: 800 }}>Rs {topOffer.discount_flat / 100} OFF</span>}
          </div>
        )}
        <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', justifyContent: 'flex-end', color: '#2563EB' }}>
          <span style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>View store <IcChevron2 /></span>
        </div>
      </div>
    </div>
  );
}
