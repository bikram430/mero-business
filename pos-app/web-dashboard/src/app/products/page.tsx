'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api';
import { MerchantShell, PageHeader, Card, lx, getMerchantType } from '@/components/MerchantShell';
import { BarcodeScanner } from '@/components/BarcodeScanner';

interface Product {
  id: string; name: string; price: number; barcode?: string;
  stock_qty?: number; category?: string; description?: string; is_active: boolean;
}

const REST_CATS = ['Appetizer', 'Main Course', 'Drinks', 'Dessert'];
const RETAIL_CATS = ['General', 'Groceries', 'Beverages', 'Snacks', 'Dairy', 'Electronics', 'Stationery'];

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantType, setMerchantType] = useState<'retail' | 'restaurant'>('retail');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', priceRs: '', barcode: '', stock_qty: '', category: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.replace('/login'); return; }
    setMerchantType(getMerchantType());
    load();
  }, []);

  async function load() {
    try { const { data } = await productsApi.list(); setProducts(data); }
    catch { router.replace('/login'); }
    finally { setLoading(false); }
  }

  const isRest = merchantType === 'restaurant';
  const CATS = isRest ? REST_CATS : RETAIL_CATS;

  function openAdd(defaultCat?: string) {
    setEditing(null);
    setForm({ name: '', priceRs: '', barcode: '', stock_qty: '', category: defaultCat ?? '', description: '' });
    setError(''); setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      priceRs: String(p.price / 100),
      barcode: p.barcode ?? '',
      stock_qty: p.stock_qty != null ? String(p.stock_qty) : '',
      category: p.category ?? '',
      description: (p as any).description ?? '',
    });
    setError(''); setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Product name haalna'); return; }
    const price = Math.round(parseFloat(form.priceRs) * 100);
    if (!form.priceRs || isNaN(price) || price <= 0) { setError('Valid price haalna'); return; }
    setSaving(true); setError('');
    const payload: any = {
      name: form.name.trim(),
      price,
      category: form.category || undefined,
    };
    if (isRest) {
      payload.description = form.description.trim() || undefined;
    } else {
      payload.barcode = form.barcode.trim() || undefined;
      payload.stock_qty = form.stock_qty ? parseInt(form.stock_qty) : undefined;
    }
    try {
      editing ? await productsApi.update(editing.id, payload) : await productsApi.create(payload);
      setShowForm(false); load();
    } catch (e: any) { setError(e.response?.data?.detail || 'Save bhayena'); }
    finally { setSaving(false); }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`"${p.name}" delete garne?`)) return;
    try { await productsApi.delete(p.id); setProducts(prev => prev.filter(x => x.id !== p.id)); }
    catch { alert('Delete bhayena'); }
  }

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  // Filtered view
  const catList = ['All', ...CATS];
  const displayed = activeCat === 'All' ? products : products.filter(p => p.category === activeCat);

  return (
    <MerchantShell>
      <PageHeader
        title={isRest ? `Menu (${products.length} items)` : `Products (${products.length})`}
        subtitle={isRest ? 'Manage your restaurant menu by category' : 'Manage your product catalogue'}
        action={
          <button style={lx.btnPrimary} onClick={() => openAdd(activeCat !== 'All' ? activeCat : undefined)}>
            {isRest ? '+ Add Menu Item' : '+ Add Product'}
          </button>
        }
      />

      {/* Add / Edit form */}
      {showForm && (
        <Card style={{ marginBottom: 20 }}>
          {showScanner && (
            <BarcodeScanner
              onDetected={code => { set('barcode', code); setShowScanner(false); }}
              onClose={() => setShowScanner(false)}
              title="Scan Product Barcode"
              subtitle="Scan to fill the barcode field"
            />
          )}
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 20px' }}>
            {editing ? (isRest ? 'Edit Menu Item' : 'Edit Product') : (isRest ? 'New Menu Item' : 'New Product')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={lx.label}>{isRest ? 'Item Name *' : 'Product Name *'}</label>
              <input style={lx.input} type="text" placeholder={isRest ? 'e.g. Chicken Momo...' : 'e.g. Wai Wai, Biscuit...'} value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label style={lx.label}>Price (Rs) *</label>
              <input style={lx.input} type="number" placeholder="e.g. 250" value={form.priceRs} onChange={e => set('priceRs', e.target.value)} />
            </div>
            <div>
              <label style={lx.label}>Category</label>
              <select style={lx.input} value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select...</option>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {isRest ? (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lx.label}>Description (optional)</label>
                <input style={lx.input} type="text" placeholder="e.g. Steamed dumplings with tomato chutney..." value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
            ) : (
              <>
                <div>
                  <label style={lx.label}>Stock Qty</label>
                  <input style={lx.input} type="number" placeholder="e.g. 50" value={form.stock_qty} onChange={e => set('stock_qty', e.target.value)} />
                </div>
                <div>
                  <label style={lx.label}>Barcode / QR</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      style={{ ...lx.input, flex: 1 }}
                      type="text"
                      placeholder="Type or scan barcode"
                      value={form.barcode}
                      onChange={e => set('barcode', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowScanner(true)}
                      style={{ padding: '0 12px', borderRadius: 10, flexShrink: 0, border: '1.5px solid #CBD5E1', background: '#F8FAFC', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600 }}
                      title="Open camera scanner"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><rect x="15" y="15" width="6" height="6"/></svg>
                      Scan
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          {error && <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={lx.btnPrimary} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : isRest ? 'Add to Menu' : 'Add Product'}
            </button>
            <button style={lx.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </Card>
      )}

      {/* Category tabs */}
      {products.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {catList.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              style={{
                padding: '6px 16px', borderRadius: 20,
                border: activeCat === cat ? 'none' : '1px solid #E2E8F0',
                background: activeCat === cat ? (isRest ? '#2563EB' : '#16A34A') : '#fff',
                color: activeCat === cat ? '#fff' : '#475569',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                transition: 'all 0.15s',
              } as any}
            >
              {cat}
              {cat !== 'All' && (
                <span style={{ marginLeft: 5, opacity: 0.7, fontSize: 11 }}>
                  ({products.filter(p => p.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <Card><p style={{ textAlign: 'center', color: '#94A3B8', padding: '40px 0' }}>Loading...</p></Card>
      ) : products.length === 0 && !showForm ? (
        <Card style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ width: 56, height: 56, background: isRest ? '#EFF6FF' : '#F0FDF4', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isRest ? '#2563EB' : '#16A34A'} strokeWidth="1.5">
              {isRest
                ? <><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></>
                : <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></>
              }
            </svg>
          </div>
          <p style={{ color: '#0F172A', fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>
            {isRest ? 'Menu is empty' : 'No products yet'}
          </p>
          <p style={{ color: '#64748B', fontSize: 14, margin: '0 0 20px' }}>
            {isRest ? 'Add your first menu item to start taking orders' : 'Add your first product to start selling'}
          </p>
          <button style={lx.btnPrimary} onClick={() => openAdd()}>
            {isRest ? '+ Add First Menu Item' : '+ Add First Product'}
          </button>
        </Card>
      ) : isRest ? (
        /* Restaurant: grouped by category cards */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {(activeCat === 'All' ? REST_CATS : [activeCat]).map(cat => {
            const items = products.filter(p => p.category === cat);
            if (items.length === 0 && activeCat !== 'All') return null;
            return (
              <Card key={cat} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', margin: 0, letterSpacing: 0.5, textTransform: 'uppercase' }}>{cat} <span style={{ color: '#94A3B8', fontWeight: 500 }}>({items.length})</span></h3>
                  <button style={{ background: 'none', border: '1px dashed #CBD5E1', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: 12, color: '#64748B', fontWeight: 600 }} onClick={() => openAdd(cat)}>+ Add</button>
                </div>
                {items.length === 0 ? (
                  <div style={{ padding: '20px 24px', color: '#94A3B8', fontSize: 13 }}>No items yet</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 1, background: '#F1F5F9' }}>
                    {items.map(p => (
                      <div key={p.id} style={{ background: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14, marginBottom: 2 }}>{p.name}</div>
                          {(p as any).description && <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4, lineHeight: 1.4 }}>{(p as any).description}</div>}
                          <div style={{ color: '#2563EB', fontWeight: 800, fontSize: 15 }}>Rs {(p.price / 100).toFixed(0)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button onClick={() => openEdit(p)} style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Edit</button>
                          <button onClick={() => handleDelete(p)} style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
          {/* Uncategorized */}
          {(() => {
            const uncats = products.filter(p => !p.category || !REST_CATS.includes(p.category));
            if (uncats.length === 0 || (activeCat !== 'All')) return null;
            return (
              <Card key="uncat" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', margin: 0, letterSpacing: 0.5, textTransform: 'uppercase' }}>Uncategorized ({uncats.length})</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 1, background: '#F1F5F9' }}>
                  {uncats.map(p => (
                    <div key={p.id} style={{ background: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{p.name}</div>
                        <div style={{ color: '#2563EB', fontWeight: 800, fontSize: 14 }}>Rs {(p.price / 100).toFixed(0)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(p)} style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Edit</button>
                        <button onClick={() => handleDelete(p)} style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })()}
        </div>
      ) : (
        /* Retail: table view */
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                {['Product', 'Price', 'Category', 'Stock', 'Barcode', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{p.name}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: '#16A34A' }}>Rs {(p.price / 100).toFixed(0)}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748B' }}>{p.category ?? '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: p.stock_qty != null && p.stock_qty < 5 ? '#DC2626' : '#0F172A', fontWeight: p.stock_qty != null && p.stock_qty < 5 ? 700 : 400 }}>
                    {p.stock_qty != null ? p.stock_qty : '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#94A3B8', fontFamily: 'monospace' }}>{p.barcode ?? '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => openEdit(p)} style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, marginRight: 8, fontSize: 13 }}>Edit</button>
                    <button onClick={() => handleDelete(p)} style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      )}
    </MerchantShell>
  );
}
