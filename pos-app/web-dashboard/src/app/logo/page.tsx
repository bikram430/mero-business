'use client';
import { useState } from 'react';

const COLORS = [
  { name: 'Primary Green',  hex: '#16A34A', text: '#fff' },
  { name: 'Accent Mint',    hex: '#4ADE80', text: '#0A0D10' },
  { name: 'Deep Teal',      hex: '#0D9488', text: '#fff' },
  { name: 'Dark',           hex: '#0A0D10', text: '#fff' },
  { name: 'Off-White',      hex: '#F0F4F0', text: '#0A0D10' },
  { name: 'Muted',          hex: '#4B5563', text: '#fff' },
];

const DO = ['Use on approved backgrounds', 'Maintain clear space around the mark', 'Use official colour variants', 'Keep original proportions'];
const DONT = ['Stretch or distort the logo', 'Add drop-shadows or effects', 'Alter brand colours', 'Place on visually clashing backgrounds'];

export default function LogoPage() {
  const [hovered, setHovered]   = useState<string | null>(null);
  const [copied,  setCopied]    = useState<string | null>(null);
  const [dlFlash, setDlFlash]   = useState<string | null>(null);

  function download(file: string) {
    const a = document.createElement('a');
    a.href = `/${file}`;
    a.download = file;
    a.click();
    setDlFlash(file);
    setTimeout(() => setDlFlash(null), 1400);
  }

  function copyHex(hex: string) {
    navigator.clipboard.writeText(hex).catch(() => {});
    setCopied(hex);
    setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030B06', fontFamily: "system-ui,-apple-system,'Segoe UI',Helvetica,sans-serif", overflow: 'hidden', position: 'relative' }}>

      <style>{`
        @keyframes floatA { 0%,100%{transform:translateY(0) scale(1)}   50%{transform:translateY(-28px) scale(1.04)}}
        @keyframes floatB { 0%,100%{transform:translateY(0) scale(1)}   50%{transform:translateY(-20px) scale(1.06)}}
        @keyframes floatC { 0%,100%{transform:translateY(0) scale(1)}   50%{transform:translateY(-36px) scale(1.03)}}
        @keyframes waveX  { 0%{d:path("M0,40 C80,60 160,20 240,40 C320,60 400,20 480,40 L480,100 L0,100 Z")}
                            50%{d:path("M0,40 C80,20 160,60 240,40 C320,20 400,60 480,40 L480,100 L0,100 Z")}
                            100%{d:path("M0,40 C80,60 160,20 240,40 C320,60 400,20 480,40 L480,100 L0,100 Z")}}
        @keyframes barRise{ from{transform:scaleY(0)} to{transform:scaleY(1)} }
        @keyframes shimmer { 0%{background-position:-300% 0} 100%{background-position:300% 0} }
        @keyframes pulseRing { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.12);opacity:0.2} }
        .logo-card  { transition: transform 0.35s ease, box-shadow 0.35s ease; }
        .logo-card:hover { transform: translateY(-8px) !important; }
        .swatch     { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; }
        .swatch:hover { transform: translateY(-3px) scale(1.04); box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important; }
        .dl-btn     { transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease; }
        .dl-btn:hover { transform: translateY(-3px); }
        .nav-link   { transition: color 0.2s; }
        .nav-link:hover { color: #4ADE80 !important; }
      `}</style>

      {/* ── Background: floating radial orbs + grid ── */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '8%',  left: '12%', width: 460, height: 460, background: 'radial-gradient(circle, rgba(22,163,74,0.13) 0%, transparent 70%)', borderRadius: '50%', animation: 'floatA 14s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '45%', right: '8%',  width: 340, height: 340, background: 'radial-gradient(circle, rgba(74,222,128,0.09) 0%, transparent 70%)', borderRadius: '50%', animation: 'floatB 18s ease-in-out infinite 4s' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '35%', width: 380, height: 380, background: 'radial-gradient(circle, rgba(13,148,136,0.11) 0%, transparent 70%)', borderRadius: '50%', animation: 'floatC 12s ease-in-out infinite 2s' }} />
        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(74,222,128,0.07) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Animated wave at top */}
        <svg viewBox="0 0 1440 180" style={{ position: 'absolute', top: 0, left: 0, width: '100%', opacity: 0.06 }} preserveAspectRatio="none">
          <path d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,0 L0,0 Z" fill="#4ADE80">
            <animate attributeName="d" dur="8s" repeatCount="indefinite"
              values="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,0 L0,0 Z;
                      M0,60 C240,0 480,120 720,60 C960,0 1200,120 1440,60 L1440,0 L0,0 Z;
                      M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,0 L0,0 Z"/>
          </path>
        </svg>
      </div>

      {/* ── Navbar ── */}
      <nav style={{ position: 'relative', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 48px', borderBottom: '1px solid rgba(74,222,128,0.08)' }}>
        <img src="/mero-business-logo-white.svg" alt="Mero Business" style={{ height: 36 }} />
        <a href="/" className="nav-link" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textDecoration: 'none', padding: '7px 16px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
          ← Home
        </a>
      </nav>

      {/* ── Main content ── */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px 120px', gap: 72 }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', maxWidth: 620 }}>
          <span style={{ display: 'inline-block', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.22)', color: '#4ADE80', borderRadius: 20, padding: '5px 16px', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 22 }}>
            Brand Identity
          </span>
          <h1 style={{ color: '#fff', fontSize: 60, fontWeight: 900, lineHeight: 1.04, margin: '0 0 18px', letterSpacing: -2.5 }}>
            Our{' '}
            <span style={{ background: 'linear-gradient(135deg, #4ADE80 0%, #22D3EE 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Logo
            </span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 17, lineHeight: 1.65, margin: 0 }}>
            Official Mero Business brand assets — ready to download, embed, and build with.
          </p>
        </div>

        {/* ── Logo previews ── */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 980 }}>

          {/* Dark card */}
          <div className="logo-card" onMouseEnter={() => setHovered('dark')} onMouseLeave={() => setHovered(null)}
            style={{ flex: '1 1 260px', maxWidth: 320, background: '#0A0D10', borderRadius: 24, padding: '52px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, border: '1px solid rgba(74,222,128,0.14)', boxShadow: hovered === 'dark' ? '0 24px 64px rgba(22,163,74,0.22), 0 0 0 1px rgba(74,222,128,0.22)' : '0 6px 28px rgba(0,0,0,0.5)' }}>
            <img src="/mero-business-logo-white.svg" alt="Mero Business" style={{ width: 210, height: 'auto' }} />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: 600 }}>Dark Background</span>
          </div>

          {/* Light card */}
          <div className="logo-card" onMouseEnter={() => setHovered('light')} onMouseLeave={() => setHovered(null)}
            style={{ flex: '1 1 260px', maxWidth: 320, background: '#F0F4F0', borderRadius: 24, padding: '52px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, border: '1px solid rgba(0,0,0,0.05)', boxShadow: hovered === 'light' ? '0 24px 64px rgba(22,163,74,0.18)' : '0 6px 28px rgba(0,0,0,0.2)' }}>
            <img src="/mero-business-logo.svg" alt="Mero Business" style={{ width: 210, height: 'auto' }} />
            <span style={{ color: 'rgba(0,0,0,0.3)', fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: 600 }}>Light Background</span>
          </div>

          {/* Brand gradient card */}
          <div className="logo-card" onMouseEnter={() => setHovered('brand')} onMouseLeave={() => setHovered(null)}
            style={{ flex: '1 1 260px', maxWidth: 320, background: 'linear-gradient(135deg, #14532D 0%, #134E4A 100%)', borderRadius: 24, padding: '52px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, border: '1px solid rgba(74,222,128,0.15)', boxShadow: hovered === 'brand' ? '0 24px 64px rgba(22,163,74,0.35)' : '0 6px 28px rgba(0,0,0,0.4)' }}>
            <img src="/mero-business-logo-white.svg" alt="Mero Business" style={{ width: 210, height: 'auto' }} />
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: 600 }}>Brand Gradient</span>
          </div>
        </div>

        {/* ── Animated icon anatomy ── */}
        <div style={{ width: '100%', maxWidth: 860, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: '44px 48px', display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 6px', letterSpacing: -0.5 }}>The Mark</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>Five ascending bars forming an "M" — representing growth, mountains, and Mero.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72 }}>
            {[
              { h: 28, op: 0.5,  delay: '0s' },
              { h: 44, op: 0.72, delay: '0.1s' },
              { h: 66, op: 1.0,  delay: '0.2s' },
              { h: 44, op: 0.72, delay: '0.3s' },
              { h: 28, op: 0.5,  delay: '0.4s' },
            ].map((bar, i) => (
              <div key={i} style={{ width: 18, height: bar.h, borderRadius: 9, background: 'linear-gradient(to bottom, #4ADE80, #059669)', opacity: bar.op, transformOrigin: 'bottom', animation: `barRise 0.7s ${bar.delay} both cubic-bezier(0.34,1.56,0.64,1)` }} />
            ))}
            <div style={{ marginLeft: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 4 }}>
              <div style={{ color: '#4ADE80', fontSize: 38, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1 }}>mero</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 500, letterSpacing: 5, marginTop: 6 }}>BUSINESS</div>
            </div>
          </div>
        </div>

        {/* ── Brand colours ── */}
        <div style={{ width: '100%', maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: '0 0 6px', letterSpacing: -0.5 }}>Brand Colours</h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Click any swatch to copy the hex code</p>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            {COLORS.map((c) => (
              <div key={c.hex} className="swatch" onClick={() => copyHex(c.hex)}
                style={{ background: c.hex, borderRadius: 16, padding: '18px 22px', minWidth: 120, display: 'flex', flexDirection: 'column', gap: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}>
                <span style={{ color: c.text, fontSize: 14, fontWeight: 800, letterSpacing: -0.3 }}>
                  {copied === c.hex ? '✓ Copied' : c.hex}
                </span>
                <span style={{ color: c.text, fontSize: 11, opacity: 0.7, fontWeight: 500, letterSpacing: 0.3 }}>{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Typography ── */}
        <div style={{ width: '100%', maxWidth: 860, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: '44px 48px' }}>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 30px', letterSpacing: -0.5 }}>Typography</h2>
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <div style={{ color: '#4ADE80', fontSize: 52, fontWeight: 900, lineHeight: 1, letterSpacing: -2.5 }}>mero</div>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 8, letterSpacing: 1.5 }}>WEIGHT 800 · DISPLAY</div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 20, fontWeight: 500, letterSpacing: 6 }}>BUSINESS</div>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 8, letterSpacing: 1.5 }}>WEIGHT 500 · TRACKING +6PX</div>
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Body text regular</div>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 8, letterSpacing: 1.5 }}>SYSTEM UI · WEIGHT 400–700</div>
            </div>
          </div>
        </div>

        {/* ── Usage guidelines ── */}
        <div style={{ width: '100%', maxWidth: 860, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[
            { icon: '✅', title: 'Do', items: DO,   accent: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.18)' },
            { icon: '❌', title: "Don't", items: DONT, accent: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.18)' },
          ].map((g) => (
            <div key={g.title} style={{ background: g.accent, border: `1px solid ${g.border}`, borderRadius: 18, padding: '26px 30px' }}>
              <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 14 }}>{g.icon} {g.title}</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {g.items.map((item) => (
                  <li key={item} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.5 }}>— {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Download buttons ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>Download Assets</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="dl-btn" onClick={() => download('mero-business-logo.svg')}
              style={{ background: 'linear-gradient(135deg, #16A34A, #0D9488)', color: '#fff', border: 'none', borderRadius: 14, padding: '18px 38px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 6px 24px rgba(22,163,74,0.35)' }}>
              {dlFlash === 'mero-business-logo.svg' ? '✓ Downloaded!' : '⬇ SVG — Light Version'}
            </button>
            <button className="dl-btn" onClick={() => download('mero-business-logo-white.svg')}
              style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: '18px 38px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              {dlFlash === 'mero-business-logo-white.svg' ? '✓ Downloaded!' : '⬇ SVG — Dark Version'}
            </button>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: 0 }}>SVG · Scalable to any size · No quality loss</p>
        </div>

      </div>

      {/* ── Footer strip ── */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
        © 2025 Mero Business · Nepal's Digital POS Platform
      </div>
    </div>
  );
}
