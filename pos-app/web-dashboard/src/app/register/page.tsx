'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

const BUSINESS_TYPES = [
  { value: 'retail', label: 'Retail Shop', desc: 'General store, clothing, electronics…' },
  { value: 'restaurant', label: 'Restaurant / Cafe', desc: 'Food, drinks, delivery…' },
];

// ── Location autocomplete with map pin ──────────────────────────────────────
interface NominatimResult {
  place_id: number;
  display_name: string;
  name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
  };
  type: string;
}

function LocationInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [pinned, setPinned] = useState<{ lat: string; lon: string } | null>(null);
  const [gpsError, setGpsError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=np&format=json&limit=6&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleChange(v: string) {
    setQuery(v);
    onChange(v);
    setPinned(null);
    setGpsError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 380);
  }

  function select(item: NominatimResult) {
    const a = item.address;
    // Build a clean short address: Road/Neighbourhood, City/District
    const parts = [
      a.road || a.neighbourhood || a.suburb || item.name,
      a.city || a.district || a.state,
    ].filter(Boolean);
    const short = parts.length > 0 ? parts.join(', ') : item.display_name.split(',').slice(0, 2).join(',').trim();
    setQuery(short);
    onChange(short);
    setPinned({ lat: item.lat, lon: item.lon });
    setSuggestions([]);
    setOpen(false);
    setGpsError('');
  }

  async function useMyLocation() {
    if (!navigator.geolocation) { setGpsError('Geolocation not supported by your browser'); return; }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const a = data.address ?? {};
          const parts = [
            a.road || a.neighbourhood || a.suburb,
            a.city || a.district || a.state,
          ].filter(Boolean);
          const short = parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 2).join(',').trim();
          setQuery(short);
          onChange(short);
          setPinned({ lat: String(lat), lon: String(lon) });
          setSuggestions([]);
          setOpen(false);
        } catch {
          setGpsError('Could not fetch address for your location');
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) setGpsError('Location permission denied — please allow access');
        else setGpsError('Could not get your location — try typing instead');
      },
      { timeout: 8000 }
    );
  }

  const mapSrc = pinned
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${(+pinned.lon - 0.008).toFixed(5)},${(+pinned.lat - 0.006).toFixed(5)},${(+pinned.lon + 0.008).toFixed(5)},${(+pinned.lat + 0.006).toFixed(5)}&layer=mapnik&marker=${pinned.lat},${pinned.lon}`
    : null;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Input row */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Pin icon */}
        <svg style={{ position: 'absolute', left: 14, pointerEvents: 'none', zIndex: 1 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={pinned ? '#60A5FA' : 'rgba(255,255,255,0.3)'} strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <input
          style={{
            ...iS.input,
            paddingRight: 48,
            borderColor: pinned ? 'rgba(37,99,235,0.5)' : open ? 'rgba(37,99,235,0.4)' : 'rgba(255,255,255,0.10)',
            background: pinned ? 'rgba(37,99,235,0.06)' : 'rgba(255,255,255,0.05)',
          }}
          type="text"
          placeholder="e.g. Thamel, Kathmandu"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {/* GPS button */}
        <button
          type="button"
          onClick={useMyLocation}
          disabled={gpsLoading}
          title="Use my current location"
          style={{
            position: 'absolute', right: 10,
            background: gpsLoading ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 8, width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: gpsLoading ? 'default' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {gpsLoading ? (
            <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#60A5FA', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><path d="M12 9a3 3 0 100 6 3 3 0 000-6z" fill="rgba(96,165,250,0.2)"/>
            </svg>
          )}
        </button>

        {/* Searching spinner */}
        {searching && (
          <span style={{ position: 'absolute', right: 48, width: 13, height: 13, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'rgba(255,255,255,0.4)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
        )}
      </div>

      {/* GPS error */}
      {gpsError && (
        <p style={{ fontSize: 11, color: '#F87171', margin: '5px 0 0', paddingLeft: 2 }}>{gpsError}</p>
      )}

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <div style={iS.dropdown}>
          {suggestions.map((item, i) => {
            const a = item.address;
            const primary = a.road || a.neighbourhood || a.suburb || item.name || item.display_name.split(',')[0];
            const secondary = [a.city || a.district, a.state].filter(Boolean).join(', ');
            return (
              <div
                key={item.place_id}
                onMouseDown={() => select(item)}
                style={{
                  ...iS.suggestion,
                  borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{primary}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{secondary || item.display_name}</div>
                </div>
              </div>
            );
          })}
          <div style={{ padding: '6px 12px', fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'right' }}>
            © OpenStreetMap contributors
          </div>
        </div>
      )}

      {/* Map pin preview */}
      {pinned && mapSrc && (
        <div style={iS.mapWrap}>
          <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10, background: 'rgba(6,11,24,0.85)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 8, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ fontSize: 11, color: '#60A5FA', fontWeight: 600 }}>Location pinned</span>
          </div>
          <iframe
            src={mapSrc}
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
            title="Location map"
          />
        </div>
      )}
    </div>
  );
}

const iS: Record<string, React.CSSProperties> = {
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1.5px solid rgba(255,255,255,0.10)',
    borderRadius: 12,
    padding: '13px 16px 13px 42px',
    fontSize: 14, color: '#fff',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, background 0.2s',
    display: 'block',
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
    background: '#0D1224',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 14,
    zIndex: 100,
    overflow: 'hidden',
    boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
  },
  suggestion: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '11px 14px', cursor: 'pointer',
    transition: 'background 0.12s',
  },
  mapWrap: {
    position: 'relative',
    marginTop: 10,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid rgba(37,99,235,0.25)',
  },
};

// ── Main Register Page ──────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', password: '', address: '', type: 'retail' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.register({
        name: form.name,
        phone: form.phone,
        password: form.password,
        address: form.address || undefined,
        type: form.type,
      });
      router.replace('/login?registered=1');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg).join(', '));
      } else {
        setError(detail || 'Registration bhayena — fields check garnus');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        input::placeholder{color:rgba(255,255,255,0.22)!important}
        input:focus{outline:none!important;border-color:rgba(37,99,235,0.6)!important;background:rgba(37,99,235,0.06)!important}
        .type-card:hover{border-color:rgba(255,255,255,0.18)!important}
        .back-link:hover{color:rgba(255,255,255,0.7)!important}
        .suggestion-row:hover{background:rgba(37,99,235,0.08)!important}
      `}</style>

      <div style={{ position: 'fixed', top: '10%', right: '15%', width: 500, height: 500, background: 'radial-gradient(circle,rgba(37,99,235,0.10) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '5%', left: '10%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={s.wrap}>
        <a href="/" className="back-link" style={s.back}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to Home
        </a>

        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#7C3AED)' }} />
            <span style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>Mero Business</span>
          </div>
          <p style={s.sub}>Create Merchant Account</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Business Name */}
            <div style={s.field}>
              <label style={s.label}>Business Name</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <svg style={s.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <input style={iS.input} type="text" placeholder="e.g. Ram Pasal, Kathmandu" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
            </div>

            {/* Phone */}
            <div style={s.field}>
              <label style={s.label}>Phone Number</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <svg style={s.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.04 1.18 2 2 0 012 .04h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                <input style={iS.input} type="tel" placeholder="98XXXXXXXX" value={form.phone} onChange={(e) => set('phone', e.target.value)} maxLength={10} required />
              </div>
            </div>

            {/* Password */}
            <div style={s.field}>
              <label style={s.label}>Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <svg style={s.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <input style={iS.input} type="password" placeholder="Min 8 chars, must include a number" value={form.password} onChange={(e) => set('password', e.target.value)} required />
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '2px 0 0', paddingLeft: 2 }}>At least 8 characters with one number</p>
            </div>

            {/* Address — smart location input */}
            <div style={s.field}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={s.label}>Business Address <span style={{ color: 'rgba(255,255,255,0.22)', fontWeight: 400 }}>(optional)</span></label>
                <span style={{ fontSize: 10, color: 'rgba(96,165,250,0.7)', letterSpacing: 0.3 }}>Type to search or tap GPS</span>
              </div>
              <LocationInput value={form.address} onChange={(v) => set('address', v)} />
            </div>

            {/* Business Type */}
            <div style={s.field}>
              <label style={s.label}>Business Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {BUSINESS_TYPES.map((t) => (
                  <div
                    key={t.value}
                    className="type-card"
                    onClick={() => set('type', t.value)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      border: `1.5px solid ${form.type === t.value ? '#2563EB' : 'rgba(255,255,255,0.08)'}`,
                      background: form.type === t.value ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.03)',
                      borderRadius: 12, padding: '12px 14px',
                      cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: form.type === t.value ? '#2563EB' : 'rgba(255,255,255,0.2)', flexShrink: 0, marginTop: 3 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: form.type === t.value ? '#60A5FA' : 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#F87171' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {error}
              </div>
            )}

            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Creating account...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  Get Started — It&apos;s Free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              )}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
            <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Already have an account?</span>
            <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>
          <a href="/login" style={s.loginBtn}>Login to Dashboard</a>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>, text: 'AES-256 Encrypted' },
            { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>, text: 'Free to start' },
            { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, text: 'Live in 2 minutes' },
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.28)', letterSpacing: 0.3 }}>
              <span style={{ color: 'rgba(255,255,255,0.25)', display: 'flex' }}>{t.icon}</span>
              {t.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg,#060B18 0%,#0D1224 60%,#0F172A 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    padding: '24px 16px', position: 'relative', overflow: 'hidden',
  },
  wrap: { width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1 },
  back: { display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none', alignSelf: 'flex-start', transition: 'color 0.2s' },
  card: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '36px 32px', backdropFilter: 'blur(20px)' },
  sub: { textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 28 },
  field: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  icon: { position: 'absolute', left: 14, pointerEvents: 'none', flexShrink: 0 },
  btn: {
    width: '100%', background: 'linear-gradient(135deg,#2563EB 0%,#7C3AED 100%)',
    color: '#fff', border: 'none', borderRadius: 12, padding: '16px',
    fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.2, transition: 'opacity 0.2s',
  },
  loginBtn: {
    display: 'block', textAlign: 'center', width: '100%', boxSizing: 'border-box',
    padding: '13px', border: '1.5px solid rgba(255,255,255,0.10)', borderRadius: 12,
    color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, textDecoration: 'none',
  },
};
