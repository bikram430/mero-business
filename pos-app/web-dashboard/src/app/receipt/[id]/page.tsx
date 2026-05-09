'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.merobusiness.com.np';

function formatRs(paisa: number) {
  return `Rs ${(paisa / 100).toLocaleString('ne-NP')}`;
}
function formatDate(s: string) {
  return new Date(s).toLocaleString('ne-NP', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function PublicReceiptPage() {
  const params = useParams();
  const id = params?.id as string;
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    axios.get(`${BASE_URL}/receipts/public/${id}`)
      .then(({ data }) => setReceipt(data))
      .catch(() => setError('Receipt felauna sakiena — ID galat cha ya expire bhayo'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={s.page}>
      <div style={s.card}>
        <p style={{ textAlign: 'center', color: '#6B7280' }}>Loading receipt...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={s.page}>
      <div style={s.card}>
        <p style={{ textAlign: 'center', color: '#DC2626', fontSize: 16 }}>{error}</p>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Header */}
        <div style={s.header}>
          <p style={s.logo}>Mero Business</p>
          <p style={s.merchantName}>{receipt.merchant_name}</p>
          {receipt.merchant_address && <p style={s.merchantAddr}>{receipt.merchant_address}</p>}
        </div>

        <div style={s.divider} />

        {/* Receipt meta */}
        <div style={s.metaRow}>
          <span style={s.metaLabel}>Receipt #</span>
          <span style={s.metaVal}>{String(id).slice(0, 8).toUpperCase()}</span>
        </div>
        {receipt.created_at && (
          <div style={s.metaRow}>
            <span style={s.metaLabel}>Date</span>
            <span style={s.metaVal}>{formatDate(receipt.created_at)}</span>
          </div>
        )}
        {receipt.table_number && (
          <div style={s.metaRow}>
            <span style={s.metaLabel}>Table</span>
            <span style={s.metaVal}>{receipt.table_number}</span>
          </div>
        )}
        <div style={s.metaRow}>
          <span style={s.metaLabel}>Payment</span>
          <span style={s.metaVal}>{receipt.payment_method?.toUpperCase()}</span>
        </div>

        <div style={s.divider} />

        {/* Items */}
        <div style={s.itemsSection}>
          {(receipt.items ?? []).map((item: any, i: number) => (
            <div key={i} style={s.itemRow}>
              <div style={{ flex: 1 }}>
                <span style={s.itemName}>{item.product_name}</span>
                <span style={s.itemQty}> × {item.qty}</span>
              </div>
              <span style={s.itemPrice}>{formatRs(item.unit_price * item.qty)}</span>
            </div>
          ))}
        </div>

        <div style={s.divider} />

        {/* Totals */}
        {receipt.discount_amount > 0 && (
          <div style={s.totalRow}>
            <span style={{ color: '#6B7280' }}>Subtotal</span>
            <span style={{ color: '#6B7280' }}>{formatRs(receipt.total_amount + receipt.discount_amount)}</span>
          </div>
        )}
        {receipt.discount_amount > 0 && (
          <div style={s.totalRow}>
            <span style={{ color: '#DC2626' }}>Discount</span>
            <span style={{ color: '#DC2626' }}>−{formatRs(receipt.discount_amount)}</span>
          </div>
        )}
        <div style={{ ...s.totalRow, ...s.grandTotal }}>
          <span>Total</span>
          <span style={{ color: '#16A34A' }}>{formatRs(receipt.total_amount)}</span>
        </div>

        <div style={s.divider} />

        {/* Status */}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <span style={{
            background: receipt.payment_status === 'paid' ? '#DCFCE7' : '#FEF3C7',
            color: receipt.payment_status === 'paid' ? '#16A34A' : '#D97706',
            padding: '6px 18px', borderRadius: 20, fontWeight: 700, fontSize: 14,
          }}>
            {receipt.payment_status?.toUpperCase()}
          </span>
        </div>

        {/* QR code */}
        <div style={{ textAlign: 'center', margin: '20px 0 8px' }}>
          <QRCodeSVG value={`https://merobusiness.com.np/receipt/${id}`} size={100} />
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>Scan for digital copy</p>
        </div>

        {/* PDF download */}
        <a
          href={`${BASE_URL}/receipts/${id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          style={s.pdfBtn}
        >
          ⬇ Download PDF Receipt
        </a>

        <p style={s.footer}>Dhanyabad! Mero Business le powered gareko digital receipt.</p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { background: '#fff', borderRadius: 20, padding: '32px 28px', maxWidth: 420, width: '100%', boxShadow: '0 4px 24px #00000012' },
  header: { textAlign: 'center', marginBottom: 16 },
  logo: { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },
  merchantName: { fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 },
  merchantAddr: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  divider: { borderTop: '1px dashed #E5E7EB', margin: '16px 0' },
  metaRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  metaLabel: { fontSize: 13, color: '#9CA3AF' },
  metaVal: { fontSize: 13, fontWeight: 600, color: '#374151' },
  itemsSection: { marginBottom: 4 },
  itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemName: { fontSize: 15, color: '#111827', fontWeight: 600 },
  itemQty: { fontSize: 13, color: '#9CA3AF' },
  itemPrice: { fontSize: 15, fontWeight: 600, color: '#374151' },
  totalRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 15 },
  grandTotal: { fontWeight: 800, fontSize: 20, marginTop: 8 },
  pdfBtn: {
    display: 'block', textAlign: 'center', background: '#2563EB', color: '#fff',
    textDecoration: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 700,
    fontSize: 15, marginBottom: 16,
  },
  footer: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 8 },
};
