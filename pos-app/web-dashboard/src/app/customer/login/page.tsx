'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { customerApi } from '@/lib/api';
import { Logo } from '@/components/MerchantShell';

function IcPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.5 19.79 19.79 0 01.01 2.84 2 2 0 012 .67h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.55a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  );
}

function IcLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}

function IcCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function CustomerLoginForm() {
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
      const { data } = await customerApi.login(phone, password);
      localStorage.setItem('customer_access_token', data.access_token);
      localStorage.setItem('customer_refresh_token', data.refresh_token);
      localStorage.setItem('customer_phone', phone);
      router.replace('/customer/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Incorrect phone or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <Logo size={48} />
          <p style={styles.tagline}>Welcome back</p>
        </div>

        {registered && (
          <div style={styles.successBanner}>
            <IcCheck />
            <span>Account created successfully! Please sign in.</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>Phone Number</label>
          <div style={styles.inputWrap}>
            <span style={styles.inputIcon}><IcPhone /></span>
            <input
              style={styles.input}
              type="tel"
              placeholder="98XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={10}
              required
            />
          </div>

          <label style={styles.label}>Password</label>
          <div style={styles.inputWrap}>
            <span style={styles.inputIcon}><IcLock /></span>
            <input
              style={styles.input}
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>New to Mero Business?</span>
          <span style={styles.dividerLine} />
        </div>

        <a href="/customer/register" style={styles.registerBtn}>
          Create an Account
        </a>

        <p style={styles.backLink}>
          <a href="/shop" style={styles.back}>Browse stores without signing in</a>
        </p>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <CustomerLoginForm />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #EEF2FF 0%, #F8FAFC 50%, #EFF6FF 100%)',
    padding: '24px 16px',
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
  },
  logoArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 28,
    gap: 8,
  },
  tagline: {
    color: '#374151',
    fontSize: 20,
    fontWeight: 600,
    margin: 0,
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: 10,
    padding: '12px 14px',
    color: '#15803D',
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 20,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
    display: 'block',
  },
  inputWrap: {
    position: 'relative',
    marginBottom: 16,
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    border: '1.5px solid #E5E7EB',
    borderRadius: 12,
    padding: '13px 16px 13px 44px',
    fontSize: 15,
    boxSizing: 'border-box',
    background: '#F9FAFB',
    color: '#111827',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  error: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 12,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 8,
    padding: '10px 12px',
  },
  btn: {
    width: '100%',
    background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '15px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
    transition: 'opacity 0.15s',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '24px 0 16px',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#E5E7EB',
  },
  dividerText: {
    color: '#6B7280',
    fontSize: 13,
    whiteSpace: 'nowrap',
  },
  registerBtn: {
    display: 'block',
    width: '100%',
    textAlign: 'center',
    border: '1.5px solid #E5E7EB',
    borderRadius: 12,
    padding: '14px',
    fontSize: 15,
    fontWeight: 600,
    color: '#374151',
    textDecoration: 'none',
    background: '#fff',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  backLink: {
    textAlign: 'center',
    marginTop: 20,
    margin: '20px 0 0',
  },
  back: {
    color: '#6B7280',
    fontSize: 13,
    textDecoration: 'none',
  },
};
