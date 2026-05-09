'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  onDetected: (code: string) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export function BarcodeScanner({ onDetected, onClose, title = 'Scan Barcode', subtitle = 'Point camera at barcode or QR code' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCodeRef = useRef('');
  const [status, setStatus] = useState<'loading' | 'active' | 'error'>('loading');
  const [errMsg, setErrMsg] = useState('');
  const [flash, setFlash] = useState('');

  useEffect(() => {
    startCamera();
    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    if (!('BarcodeDetector' in window)) {
      setStatus('error');
      setErrMsg('Camera barcode scanning requires Chrome or Edge. Please use Firefox with a USB/Bluetooth scanner instead, or type the barcode manually.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current!.play();
          setStatus('active');
          startScanning();
        };
      }
    } catch (err: any) {
      setStatus('error');
      setErrMsg(err.name === 'NotAllowedError'
        ? 'Camera access denied. Please click Allow when prompted, or check your browser settings.'
        : 'Could not start camera. Please check that a camera is connected and try again.');
    }
  }

  function startScanning() {
    const detector = new (window as any).BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e', 'code_39', 'code_93', 'qr_code'],
    });
    timerRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes.length > 0) {
          const code = codes[0].rawValue;
          if (code && code !== lastCodeRef.current) {
            lastCodeRef.current = code;
            playBeep();
            setFlash(code);
            setTimeout(() => {
              onDetected(code);
              lastCodeRef.current = '';
              setFlash('');
            }, 500);
          }
        }
      } catch { /* ignore frame errors */ }
    }, 150);
  }

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }

  function handleClose() { cleanup(); onClose(); }

  function playBeep() {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 1800; osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(); osc.stop(ctx.currentTime + 0.12);
    } catch { /* no audio context */ }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <style>{`
        @keyframes sc-spin { to { transform: rotate(360deg); } }
        @keyframes sc-line { 0%,100% { transform: translateY(-36px); } 50% { transform: translateY(36px); } }
      `}</style>
      <div style={{ background: '#0F172A', borderRadius: 22, overflow: 'hidden', width: 400, maxWidth: '95vw', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 2px', fontSize: 15 }}>{title}</p>
            <p style={{ color: '#64748B', fontSize: 11, margin: 0 }}>{subtitle}</p>
          </div>
          <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Video */}
        <div style={{ position: 'relative', background: '#000', aspectRatio: '4/3', overflow: 'hidden' }}>
          <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: status === 'active' ? 'block' : 'none' }} />

          {/* Corner viewfinder */}
          {status === 'active' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ width: '62%', height: '45%', position: 'relative' }}>
                {[['top:0,left:0', 'borderTop,borderLeft'], ['top:0,right:0', 'borderTop,borderRight'], ['bottom:0,left:0', 'borderBottom,borderLeft'], ['bottom:0,right:0', 'borderBottom,borderRight']].map(([pos, borders], idx) => {
                  const p = Object.fromEntries(pos.split(',').map(s => s.split(':')));
                  const b = borders.split(',').reduce((acc: any, k) => { acc[k] = `2.5px solid ${flash ? '#22C55E' : 'rgba(34,197,94,0.9)'}`;  return acc; }, {});
                  return <div key={idx} style={{ position: 'absolute', ...p, width: 22, height: 22, ...b, borderRadius: 2, transition: 'border-color 0.15s' }} />;
                })}
                {/* Scan line */}
                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: flash ? '#22C55E' : 'rgba(34,197,94,0.7)', boxShadow: `0 0 ${flash ? 14 : 8}px rgba(34,197,94,0.7)`, animation: flash ? 'none' : 'sc-line 1.8s ease-in-out infinite', transition: 'all 0.15s' }} />
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#60A5FA', borderRadius: '50%', animation: 'sc-spin 0.8s linear infinite' }} />
            </div>
          )}

          {status === 'error' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center' }}>
              <div>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="1.5" style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <p style={{ color: '#F87171', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{errMsg}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '13px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {flash ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '9px 14px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ color: '#22C55E', fontWeight: 700, fontSize: 13 }}>Detected: {flash}</span>
            </div>
          ) : (
            <p style={{ color: '#475569', fontSize: 12, margin: 0, textAlign: 'center' }}>
              {status === 'active' ? 'Hold the barcode steady inside the frame' : status === 'loading' ? 'Starting camera…' : 'Scanner unavailable'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
