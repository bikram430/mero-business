'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const registered = params.get('registered') === '1';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.login(phone, password);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      const { data: me } = await authApi.me();
      localStorage.setItem('merchant_type', me.type);
      localStorage.setItem('merchant_name', me.name);
      localStorage.setItem('merchant_id', me.id);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login bhayena — phone/password check garna');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      {/* Background glow blobs */}
      <div style={{ position: 'fixed', top: '15%', left: '20%', width: 480, height: 480, background: 'radial-gradient(circle,rgba(37,99,235,0.12) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '15%', width: 360, height: 360, background: 'radial-gradient(circle,rgba(124,58,237,0.10) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={s.wrap}>
        {/* Back link */}
        <a href="/" style={s.back}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to Home
        </a>

        <div style={s.card}>
          {/* Logo */}
          <div style={s.logoWrap}>
            <div style={s.logoDot} />
            <span style={s.logoText}>Mero Business</span>
          </div>
          <p style={s.sub}>Merchant Portal</p>

          {registered && (
            <div style={s.successBanner}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Merchant registered! Login garna.
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={s.fieldWrap}>
              <label style={s.label}>Phone Number</label>
              <div style={s.inputWrap}>
                <svg style={s.inputIcon} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.04 1.18 2 2 0 012 .04h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                <input
                  style={s.input}
                  type="tel"
                  placeholder="98XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div style={s.fieldWrap}>
              <label style={s.label}>Password</label>
              <div style={s.inputWrap}>
                <svg style={s.inputIcon} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <input
                  style={s.input}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div style={s.errorBanner}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {error}
              </div>
            )}

            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <span style={s.spinner} />
                  Logging in...
                </span>
              ) : 'Login to Dashboard'}
            </button>
          </form>

          <div style={s.divider}>
            <span style={s.dividerLine} />
            <span style={s.dividerText}>New merchant?</span>
            <span style={s.dividerLine} />
          </div>

          <a href="/register" style={s.registerBtn}>Create Merchant Account</a>
        </div>

        {/* Trust badges */}
        <div style={s.trust}>
          {[
            { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>, text: 'AES-256 Encrypted' },
            { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1.05 12a11 11 0 0021.9 0M1.05 12a11 11 0 0121.9 0M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>, text: 'IRD VAT Compliant' },
            { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>, text: 'Works Offline' },
          ].map((t, i) => (
            <div key={i} style={s.trustItem}>
              <span style={{ color: 'rgba(255,255,255,0.35)', display: 'flex' }}>{t.icon}</span>
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.25) !important; }
        input:focus { outline: none !important; border-color: #2563EB !important; background: rgba(37,99,235,0.06) !important; }
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg,#060B18 0%,#0D1224 60%,#0F172A 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    padding: '24px 16px',
    position: 'relative',
    overflow: 'hidden',
  },
  wrap: { width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1 },
  back: {
    display: 'flex', alignItems: 'center', gap: 6,
    color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none',
    alignSelf: 'flex-start',
    transition: 'color 0.2s',
  },
  card: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: '36px 32px',
    backdropFilter: 'blur(20px)',
  },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 6 },
  logoDot: { width: 10, height: 10, borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#7C3AED)' },
  logoText: { fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.5 },
  sub: { textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 28 },
  successBanner: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
    borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#4ADE80', marginBottom: 16,
  },
  errorBanner: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#F87171',
  },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.8, textTransform: 'uppercase' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 14, pointerEvents: 'none' },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1.5px solid rgba(255,255,255,0.10)',
    borderRadius: 12,
    padding: '14px 16px 14px 42px',
    fontSize: 15,
    color: '#fff',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, background 0.2s',
  },
  btn: {
    width: '100%',
    background: 'linear-gradient(135deg,#2563EB 0%,#7C3AED 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '16px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 6,
    letterSpacing: 0.3,
    transition: 'opacity 0.2s',
  },
  spinner: {
    display: 'inline-block',
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 16px' },
  dividerLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' },
  dividerText: { fontSize: 12, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' },
  registerBtn: {
    display: 'block',
    textAlign: 'center',
    width: '100%',
    boxSizing: 'border-box',
    padding: '14px',
    border: '1.5px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'border-color 0.2s, color 0.2s',
  },
  trust: { display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  trustItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.3 },
};
