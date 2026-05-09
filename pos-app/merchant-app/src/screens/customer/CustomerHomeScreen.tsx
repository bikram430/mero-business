import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, RefreshControl,
  TextInput, StatusBar, Platform, Linking, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polyline, Line, Polygon } from 'react-native-svg';
import * as Location from 'expo-location';

import { storesApi, customerApi } from '../../api/client';
import { useStore } from '../../store/useStore';
import { t } from '../../i18n/strings';

type Tab = 'discover' | 'orders' | 'receipts' | 'profile';

function fmtRs(paisa: number) {
  return `Rs ${(paisa / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
function fmtDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── SVG icons ─────────────────────────────────────────────────────────────
const IcCompass = ({ color = '#374151' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={10} />
    <Polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </Svg>
);
const IcPackage = ({ color = '#374151' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <Polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <Line x1={12} y1={22.08} x2={12} y2={12} />
  </Svg>
);
const IcReceipt = ({ color = '#374151' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
    <Path d="M9 5a2 2 0 002 2h2a2 2 0 002-2 2 2 0 00-2-2h-2a2 2 0 00-2 2z" />
    <Line x1={9} y1={12} x2={15} y2={12} /><Line x1={9} y1={16} x2={13} y2={16} />
  </Svg>
);
const IcUser = ({ color = '#374151' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><Circle cx={12} cy={7} r={4} />
  </Svg>
);
const IcStar = ({ filled, size = 20 }: { filled?: boolean; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? '#FBBF24' : 'none'} stroke="#FBBF24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Svg>
);
const IcSearch = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round">
    <Circle cx={11} cy={11} r={8} /><Line x1={21} y1={21} x2={16.65} y2={16.65} />
  </Svg>
);
const IcPlus = ({ color = '#16A34A' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
    <Line x1={12} y1={5} x2={12} y2={19} /><Line x1={5} y1={12} x2={19} y2={12} />
  </Svg>
);
const IcMinus = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2.5} strokeLinecap="round">
    <Line x1={5} y1={12} x2={19} y2={12} />
  </Svg>
);
const IcCart = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={9} cy={21} r={1} /><Circle cx={20} cy={21} r={1} />
    <Path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
  </Svg>
);
const IcLogout = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <Polyline points="16 17 21 12 16 7" /><Line x1={21} y1={12} x2={9} y2={12} />
  </Svg>
);
const IcX = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2.5} strokeLinecap="round">
    <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
  </Svg>
);

// ── Cart item type ────────────────────────────────────────────────────────
interface CartItem { product_id: string; product_name: string; unit_price: number; qty: number; }

// ── OTP state type ────────────────────────────────────────────────────────
type OtpState = { sending: boolean; sent: boolean; confirming: boolean; error?: string; devOtp?: string };

// ── VerifyCard ─────────────────────────────────────────────────────────────
function VerifyCard({ label, subtitle, verified, value, onSend, onConfirm, state, otp, setOtp }: {
  label: string; subtitle: string; verified: boolean; value?: string;
  onSend: () => void; onConfirm: () => void;
  state: OtpState; otp: string; setOtp: (v: string) => void;
}) {
  return (
    <View style={vS.card}>
      <View style={vS.row}>
        <View style={{ flex: 1 }}>
          <Text style={vS.label}>{label}</Text>
          <Text style={vS.sub}>{subtitle}</Text>
        </View>
        <View style={[vS.badge, verified ? vS.badgeGreen : vS.badgeGray]}>
          <Text style={[vS.badgeText, { color: verified ? '#16A34A' : '#6B7280' }]}>
            {verified ? 'Verified' : 'Unverified'}
          </Text>
        </View>
      </View>
      {!verified && value ? (
        state.sent ? (
          <View style={vS.otpRow}>
            <TextInput
              style={[vS.otpInput, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}
              value={otp} onChangeText={setOtp} placeholder="000000"
              keyboardType="number-pad" maxLength={6} placeholderTextColor="#9CA3AF" />
            <TouchableOpacity style={vS.confirmBtn} onPress={onConfirm} disabled={state.confirming}>
              {state.confirming ? <ActivityIndicator size="small" color="#fff" /> : <Text style={vS.confirmText}>Confirm</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={vS.sendBtn} onPress={onSend} disabled={state.sending}>
            {state.sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={vS.sendText}>Send verification code</Text>}
          </TouchableOpacity>
        )
      ) : null}
      {!!state.error && <Text style={vS.errorText}>{state.error}</Text>}
    </View>
  );
}

// ── StoreMenuModal ─────────────────────────────────────────────────────────
function StoreMenuModal({ store, lang, visible, onClose, onOrderPlaced }: {
  store: any; lang: string; visible: boolean;
  onClose: () => void;
  onOrderPlaced: (storeId: string, storeName: string) => void;
}) {
  const customer = useStore((s) => s.customer);
  const [products, setProducts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [cart,     setCart]     = useState<CartItem[]>([]);
  const [placing,  setPlacing]  = useState(false);

  useEffect(() => {
    if (!visible || !store) return;
    setCart([]);
    setLoading(true);
    storesApi.getStore(store.id)
      .then(({ data }: { data: any }) => setProducts(Array.isArray(data?.products) ? data.products : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [visible, store]);

  function addItem(p: any) {
    setCart(prev => {
      const ex = prev.find(i => i.product_id === p.id);
      if (ex) return prev.map(i => i.product_id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product_id: p.id, product_name: p.name, unit_price: p.price, qty: 1 }];
    });
  }
  function removeItem(pid: string) {
    setCart(prev => {
      const ex = prev.find(i => i.product_id === pid);
      if (!ex) return prev;
      if (ex.qty === 1) return prev.filter(i => i.product_id !== pid);
      return prev.map(i => i.product_id === pid ? { ...i, qty: i.qty - 1 } : i);
    });
  }
  const getQty = (pid: string) => cart.find(i => i.product_id === pid)?.qty ?? 0;
  const cartTotal = cart.reduce((s, i) => s + i.qty * i.unit_price, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  async function placeOrder() {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      await storesApi.placeCollectOrder(store.id, {
        customer_phone: customer?.phone ?? '',
        items: cart.map(i => ({ product_id: i.product_id, qty: i.qty })),
      });
      onOrderPlaced(store.id, store.name);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Could not place order');
    } finally { setPlacing(false); }
  }

  const grouped = products.reduce((acc: Record<string, any[]>, p) => {
    const cat = p.category || 'Menu';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={mS.safe} edges={['top', 'bottom']}>
        <View style={mS.header}>
          <View style={{ flex: 1 }}>
            <Text style={mS.storeName}>{store?.name}</Text>
            <Text style={mS.storeAddr}>{[store?.address, store?.city].filter(Boolean).join(', ')}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={mS.closeBtn}><IcX /></TouchableOpacity>
        </View>

        {loading ? (
          <View style={mS.center}><ActivityIndicator size="large" color="#16A34A" /></View>
        ) : products.length === 0 ? (
          <View style={mS.center}><Text style={mS.emptyText}>No products available</Text></View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: cartCount > 0 ? 110 : 32 }}>
            {Object.entries(grouped).map(([cat, items]) => (
              <View key={cat} style={mS.section}>
                <Text style={mS.catLabel}>{cat.toUpperCase()}</Text>
                {items.map((p: any) => {
                  const qty = getQty(p.id);
                  return (
                    <View key={p.id} style={mS.productRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={mS.productName}>{p.name}</Text>
                        <Text style={mS.productPrice}>{fmtRs(p.price)}</Text>
                      </View>
                      {qty === 0 ? (
                        <TouchableOpacity style={mS.addBtn} onPress={() => addItem(p)}>
                          <IcPlus /><Text style={mS.addBtnText}>Add</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={mS.qtyRow}>
                          <TouchableOpacity style={mS.qtyBtn} onPress={() => removeItem(p.id)}><IcMinus /></TouchableOpacity>
                          <Text style={mS.qtyNum}>{qty}</Text>
                          <TouchableOpacity style={[mS.qtyBtn, mS.qtyBtnGreen]} onPress={() => addItem(p)}><IcPlus color="#fff" /></TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        )}

        {cartCount > 0 && (
          <View style={mS.cartBar}>
            <IcCart />
            <Text style={mS.cartCount}>{cartCount} items</Text>
            <Text style={mS.cartTotal}>{fmtRs(cartTotal)}</Text>
            <TouchableOpacity style={mS.orderBtn} onPress={placeOrder} disabled={placing}>
              {placing ? <ActivityIndicator size="small" color="#16A34A" /> : <Text style={mS.orderBtnText}>Place Order</Text>}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ── RatingModal ────────────────────────────────────────────────────────────
function RatingModal({ visible, storeName, storeId, lang, onDone }: {
  visible: boolean; storeName: string; storeId: string; lang: string; onDone: () => void;
}) {
  const [rating,    setRating]    = useState(0);
  const [submitting,setSubmitting]= useState(false);

  async function submit() {
    if (rating === 0) { onDone(); return; }
    setSubmitting(true);
    try { await storesApi.rateStore(storeId, rating); Alert.alert('', t(lang as any, 'thankYouRating')); }
    catch { }
    finally { setSubmitting(false); onDone(); }
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={rS.overlay}>
        <View style={rS.box}>
          <Text style={rS.title}>{t(lang as any, 'rateStore')}</Text>
          <Text style={rS.sub}>{t(lang as any, 'rateStoreDesc')} {storeName}?</Text>
          <View style={rS.stars}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity key={n} onPress={() => setRating(n)} style={{ padding: 6 }}>
                <IcStar filled={n <= rating} size={34} />
              </TouchableOpacity>
            ))}
          </View>
          <View style={rS.btns}>
            <TouchableOpacity style={rS.skipBtn} onPress={onDone}>
              <Text style={rS.skipText}>{t(lang as any, 'skipRating')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={rS.submitBtn} onPress={submit} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={rS.submitText}>{t(lang as any, 'submitRating')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── StoreCard ─────────────────────────────────────────────────────────────
function StoreCard({ store, lang, onMenu }: { store: any; lang: string; onMenu: () => void }) {
  const isRetail = store.type === 'retail';
  const rating   = store.average_rating ?? 0;
  return (
    <View style={dS.card}>
      <View style={[dS.banner, { backgroundColor: isRetail ? '#DCFCE7' : '#DBEAFE' }]}>
        <Text style={[dS.typeLabel, { color: isRetail ? '#16A34A' : '#2563EB' }]}>
          {isRetail ? t(lang as any, 'retailLabel') : t(lang as any, 'restaurantLabel')}
        </Text>
        {(store.offer_count ?? 0) > 0 && (
          <View style={dS.offerBadge}><Text style={dS.offerBadgeText}>{store.offer_count} offers</Text></View>
        )}
      </View>
      <View style={dS.body}>
        <Text style={dS.name}>{store.name}</Text>
        <Text style={dS.addr} numberOfLines={1}>{[store.address, store.city].filter(Boolean).join(', ')}</Text>
        {store.description ? <Text style={dS.desc} numberOfLines={2}>{store.description}</Text> : null}
        <View style={dS.footer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            {[1,2,3,4,5].map(n => <IcStar key={n} filled={n <= Math.round(rating)} size={13} />)}
            <Text style={dS.ratingTxt}>{rating > 0 ? rating.toFixed(1) : t(lang as any, 'noRatings')}</Text>
          </View>
          <TouchableOpacity style={dS.menuBtn} onPress={onMenu} activeOpacity={0.8}>
            <Text style={dS.menuBtnText}>{t(lang as any, 'viewMenu')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function CustomerHomeScreen() {
  const lang     = useStore((s) => s.lang);
  const customer = useStore((s) => s.customer);
  const logout   = useStore((s) => s.logout);
  const insets   = useSafeAreaInsets();

  const [tab,        setTab]        = useState<Tab>('discover');
  const [stores,     setStores]     = useState<any[]>([]);
  const [orders,     setOrders]     = useState<any[]>([]);
  const [receipts,   setReceipts]   = useState<any[]>([]);
  const [profile,    setProfile]    = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'restaurant' | 'retail'>('all');

  const [menuStore,     setMenuStore]     = useState<any>(null);
  const [menuVisible,   setMenuVisible]   = useState(false);
  const [ratingVisible, setRatingVisible] = useState(false);
  const [ratingStore,   setRatingStore]   = useState<{ id: string; name: string } | null>(null);

  // Location & radius
  const [userCoords,   setUserCoords]   = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(1); // km
  const [locStatus,    setLocStatus]    = useState<'idle' | 'loading' | 'ok' | 'denied'>('idle');

  const [pName,      setPName]      = useState('');
  const [pEmail,     setPEmail]     = useState('');
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');
  const [phoneOtp,   setPhoneOtp]   = useState('');
  const [emailOtp,   setEmailOtp]   = useState('');
  const [phoneState, setPhoneState] = useState<OtpState>({ sending: false, sent: false, confirming: false });
  const [emailState, setEmailState] = useState<OtpState>({ sending: false, sent: false, confirming: false });

  const loadStores   = useCallback(async () => { try { const { data } = await storesApi.list(); setStores(Array.isArray(data) ? data : []); } catch { setStores([]); } }, []);
  const loadOrders   = useCallback(async () => { try { const { data } = await customerApi.orders(); setOrders(Array.isArray(data) ? data : []); } catch { setOrders([]); } }, []);
  const loadReceipts = useCallback(async () => { try { const { data } = await customerApi.receipts(); setReceipts(Array.isArray(data) ? data : []); } catch { setReceipts([]); } }, []);
  const loadProfile  = useCallback(async () => {
    try {
      const { data } = await customerApi.me();
      setProfile(data); setPName(data.name ?? ''); setPEmail(data.email ?? '');
    } catch { }
  }, []);

  function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371, r = (d: number) => d * Math.PI / 180;
    const dLat = r(lat2 - lat1), dLon = r(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(r(lat1))*Math.cos(r(lat2))*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  async function requestLocation() {
    setLocStatus('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocStatus('denied'); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLocStatus('ok');
    } catch { setLocStatus('denied'); }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadStores(), loadOrders(), loadReceipts(), loadProfile()]);
      setLoading(false);
      // Auto-request location on first mount
      requestLocation();
    };
    init();
  }, []);

  // Poll orders every 30s
  useEffect(() => {
    const id = setInterval(() => loadOrders(), 30000);
    return () => clearInterval(id);
  }, [loadOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStores(), loadOrders(), loadReceipts(), loadProfile()]);
    setRefreshing(false);
  };

  function distKm(s: any) {
    if (!userCoords || s.lat == null || s.lng == null) return null;
    return haversineKm(userCoords.lat, userCoords.lng, s.lat, s.lng);
  }

  const storesWithDist = stores
    .map((s: any) => ({ ...s, _km: distKm(s) }))
    .sort((a: any, b: any) => (a._km ?? 9999) - (b._km ?? 9999));

  function getRadiusFiltered(list: any[]) {
    if (!userCoords || searchRadius === 0) return list;
    const inR = list.filter((s: any) => s._km == null || s._km <= searchRadius);
    if (inR.length > 0) return inR;
    const exp3 = list.filter((s: any) => s._km == null || s._km <= 3);
    if (exp3.length > 0) return exp3;
    return list;
  }

  const filtered = getRadiusFiltered(storesWithDist).filter((s: any) => {
    const matchType = typeFilter === 'all' || s.type === typeFilter;
    const matchSrc  = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.city?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSrc;
  });

  const topRated   = [...storesWithDist].filter((s: any) => (s.average_rating ?? 0) > 0).sort((a: any, b: any) => (b.average_rating ?? 0) - (a.average_rating ?? 0)).slice(0, 6);
  const withOffers = storesWithDist.filter((s: any) => (s.offer_count ?? 0) > 0).slice(0, 8);

  async function saveProfile() {
    setSaving(true); setSaveMsg('');
    try { await customerApi.updateProfile({ name: pName || null, email: pEmail || null }); setSaveMsg(t(lang, 'profileSaved')); await loadProfile(); }
    catch { setSaveMsg(t(lang, 'networkError')); }
    finally { setSaving(false); }
  }

  async function sendPhoneOtp() {
    setPhoneState(s => ({ ...s, sending: true, error: undefined }));
    try { const { data } = await customerApi.sendPhoneOtp(); setPhoneState(s => ({ ...s, sending: false, sent: true, devOtp: data?.otp })); }
    catch { setPhoneState(s => ({ ...s, sending: false, error: t(lang, 'networkError') })); }
  }
  async function confirmPhoneOtp() {
    setPhoneState(s => ({ ...s, confirming: true, error: undefined }));
    try { await customerApi.confirmPhoneOtp(phoneOtp); setPhoneState(s => ({ ...s, confirming: false, sent: false })); await loadProfile(); }
    catch { setPhoneState(s => ({ ...s, confirming: false, error: 'Incorrect code' })); }
  }
  async function sendEmailOtp() {
    setEmailState(s => ({ ...s, sending: true, error: undefined }));
    try { const { data } = await customerApi.sendEmailOtp(); setEmailState(s => ({ ...s, sending: false, sent: true, devOtp: data?.otp })); }
    catch { setEmailState(s => ({ ...s, sending: false, error: t(lang, 'networkError') })); }
  }
  async function confirmEmailOtp() {
    setEmailState(s => ({ ...s, confirming: true, error: undefined }));
    try { await customerApi.confirmEmailOtp(emailOtp); setEmailState(s => ({ ...s, confirming: false, sent: false })); await loadProfile(); }
    catch { setEmailState(s => ({ ...s, confirming: false, error: 'Incorrect code' })); }
  }

  function handleOrderPlaced(storeId: string, storeName: string) {
    loadOrders();
    setRatingStore({ id: storeId, name: storeName });
    setRatingVisible(true);
  }

  function handleSignOut() {
    Alert.alert(t(lang, 'logout'), t(lang, 'confirmLogout'), [
      { text: t(lang, 'cancel'), style: 'cancel' },
      { text: t(lang, 'yes'), style: 'destructive', onPress: () => logout() },
    ]);
  }

  const customerId = 'MB-' + (profile?.id ?? customer?.phone ?? '--------').slice(-8).toUpperCase();

  const ORDER_ST: Record<string, { bg: string; color: string }> = {
    pending:   { bg: '#FEF3C7', color: '#D97706' },
    accepted:  { bg: '#DBEAFE', color: '#2563EB' },
    ready:     { bg: '#EDE9FE', color: '#7C3AED' },
    collected: { bg: '#DCFCE7', color: '#16A34A' },
    cancelled: { bg: '#F3F4F6', color: '#6B7280' },
  };

  // Distance-aware store list
  const TABS = [
    { id: 'discover'  as Tab, label: t(lang, 'discover'),    Icon: IcCompass },
    { id: 'orders'    as Tab, label: t(lang, 'myOrders'),    Icon: IcPackage },
    { id: 'receipts'  as Tab, label: t(lang, 'receiptsTab'), Icon: IcReceipt },
    { id: 'profile'   as Tab, label: t(lang, 'profileTab'),  Icon: IcUser },
  ];

  const tabBarHeight = 56 + Math.max(insets.bottom, 8);

  // ── Discover ─────────────────────────────────────────────────────────
  function renderDiscover() {
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />}>
        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.heroTitle}>{t(lang, 'welcome')}, {profile?.name ?? customer?.phone ?? ''}</Text>
          <Text style={s.heroSub}>Browse stores, place orders, collect in-store</Text>
          <View style={s.searchBar}>
            <IcSearch />
            <TextInput style={s.searchInput} placeholder={t(lang, 'searchStores')} placeholderTextColor="#93C5FD" value={search} onChangeText={setSearch} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 12 }}>
            {(['all', 'restaurant', 'retail'] as const).map(f => (
              <TouchableOpacity key={f} style={[s.pill, typeFilter === f && s.pillActive]} onPress={() => setTypeFilter(f)}>
                <Text style={[s.pillText, typeFilter === f && s.pillTextActive]}>
                  {f === 'all' ? t(lang, 'allTypes') : f === 'restaurant' ? t(lang, 'restaurantLabel') : t(lang, 'retailLabel')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Location prompt */}
        {locStatus === 'idle' && (
          <TouchableOpacity style={s.locBanner} onPress={requestLocation} activeOpacity={0.8}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2} strokeLinecap="round">
              <Circle cx={12} cy={12} r={3} />
              <Path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            </Svg>
            <Text style={s.locBannerText}>Tap to enable location for nearby stores</Text>
          </TouchableOpacity>
        )}
        {locStatus === 'loading' && (
          <View style={[s.locBanner, { backgroundColor: '#F1F5F9' }]}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={[s.locBannerText, { color: '#64748B' }]}>Getting your location...</Text>
          </View>
        )}

        {/* Radius controls */}
        {locStatus === 'ok' && (
          <View style={s.radiusBar}>
            <Text style={s.radiusLabel}>Radius:</Text>
            {([1, 3, 5, 0] as const).map(km => (
              <TouchableOpacity
                key={km}
                style={[s.radiusPill, searchRadius === km && s.radiusPillActive]}
                onPress={() => setSearchRadius(km)}
                activeOpacity={0.7}
              >
                <Text style={[s.radiusPillText, searchRadius === km && s.radiusPillTextActive]}>
                  {km === 0 ? 'All' : `${km}km`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Featured Offers */}
        {withOffers.length > 0 && (
          <View style={s.section}>
            <Text style={s.secTitle}>{t(lang, 'featuredOffers')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
              {withOffers.map(store => (
                <TouchableOpacity key={store.id} style={s.offerCard} onPress={() => { setMenuStore(store); setMenuVisible(true); }}>
                  <View style={[s.offerBand, { backgroundColor: store.type === 'retail' ? '#DCFCE7' : '#DBEAFE' }]}>
                    <Text style={s.offerBandText}>{store.type === 'retail' ? t(lang, 'retailLabel') : t(lang, 'restaurantLabel')}</Text>
                  </View>
                  <View style={s.offerBody}>
                    <Text style={s.offerName} numberOfLines={1}>{store.name}</Text>
                    <Text style={s.offerCount}>{store.offer_count} {store.offer_count === 1 ? 'offer' : 'offers'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Top Rated */}
        {topRated.length > 0 && (
          <View style={s.section}>
            <Text style={s.secTitle}>{t(lang, 'topRated')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
              {topRated.map(store => (
                <TouchableOpacity key={store.id} style={s.topCard} onPress={() => { setMenuStore(store); setMenuVisible(true); }}>
                  <View style={s.topAvatar}><Text style={s.topAvatarTxt}>{store.name[0].toUpperCase()}</Text></View>
                  <Text style={s.topName} numberOfLines={2}>{store.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 }}>
                    <IcStar filled size={12} />
                    <Text style={s.topRating}>{(store.average_rating ?? 0).toFixed(1)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All stores */}
        <View style={s.section}>
          <Text style={s.secTitle}>
            {typeFilter === 'all' ? 'All Stores' : typeFilter === 'restaurant' ? t(lang, 'restaurantLabel') : t(lang, 'retailLabel')}
            {filtered.length > 0 && <Text style={s.secCount}> ({filtered.length})</Text>}
          </Text>
          {loading
            ? <ActivityIndicator size="small" color="#16A34A" style={{ marginTop: 16 }} />
            : filtered.length === 0
              ? <Text style={s.emptyText}>{t(lang, 'noStores')}</Text>
              : filtered.map(store => (
                  <StoreCard key={store.id} store={store} lang={lang} onMenu={() => { setMenuStore(store); setMenuVisible(true); }} />
                ))}
        </View>
      </ScrollView>
    );
  }

  // ── Orders ────────────────────────────────────────────────────────────
  const ORDER_STEPS = [
    { key: 'pending',   label: 'Placed',    eta: 'Waiting for store' },
    { key: 'accepted',  label: 'Accepted',  eta: 'Being prepared' },
    { key: 'ready',     label: 'Ready',     eta: 'Come collect now!' },
    { key: 'collected', label: 'Collected', eta: 'Complete' },
  ];

  function renderOrders() {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: tabBarHeight + 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={s.pageTitle}>{t(lang, 'myOrdersTitle')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' }} />
            <Text style={{ fontSize: 11, color: '#94A3B8' }}>Live</Text>
          </View>
        </View>
        {orders.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>{t(lang, 'noOrders')}</Text>
            <Text style={s.emptySub}>{t(lang, 'noOrdersDesc')}</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => setTab('discover')}>
              <Text style={s.emptyBtnText}>{t(lang, 'browseStores')}</Text>
            </TouchableOpacity>
          </View>
        ) : orders.map((o: any) => {
          const st       = ORDER_ST[o.status] ?? ORDER_ST.cancelled;
          const stepIdx  = ORDER_STEPS.findIndex(step => step.key === o.status);
          const cancelled = o.status === 'cancelled';
          return (
            <View key={o.id} style={[s.orderCard, o.status === 'ready' && { borderColor: '#86EFAC', borderWidth: 1.5 }]}>
              <View style={s.orderHead}>
                <View style={{ flex: 1 }}>
                  <Text style={s.orderStore}>{o.store_name ?? 'Store'}</Text>
                  <Text style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', marginTop: 1 }}>#{String(o.id ?? '').slice(-8).toUpperCase()}</Text>
                </View>
                <View style={[s.orderBadge, { backgroundColor: st.bg }]}>
                  <Text style={[s.orderBadgeTxt, { color: st.color }]}>{o.status?.toUpperCase()}</Text>
                </View>
              </View>

              {/* Status timeline */}
              {!cancelled && (
                <View style={{ marginVertical: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    {ORDER_STEPS.map((step, i) => {
                      const done    = i < stepIdx || o.status === 'collected';
                      const current = i === stepIdx && o.status !== 'collected';
                      return (
                        <View key={step.key} style={{ flex: 1, alignItems: 'center', position: 'relative' }}>
                          {i > 0 && (
                            <View style={{ position: 'absolute', top: 9, left: '-50%', right: '50%', height: 2, backgroundColor: done ? '#16A34A' : '#E2E8F0' }} />
                          )}
                          <View style={{ width: 20, height: 20, borderRadius: 10, zIndex: 1, backgroundColor: done ? '#16A34A' : current ? '#2563EB' : '#E2E8F0', justifyContent: 'center', alignItems: 'center' }}>
                            {done && <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><Polyline points="20 6 9 17 4 12" /></Svg>}
                            {current && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
                          </View>
                          <Text style={{ fontSize: 9, fontWeight: current ? '700' : '500', color: done ? '#16A34A' : current ? '#1E40AF' : '#94A3B8', textAlign: 'center', marginTop: 4, lineHeight: 12 }}>{step.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                  {stepIdx >= 0 && o.status !== 'collected' && (
                    <Text style={{ fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 6 }}>
                      {ORDER_STEPS[stepIdx]?.eta}
                    </Text>
                  )}
                </View>
              )}

              {o.status === 'ready' && (
                <View style={[s.readyBanner, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC', borderWidth: 1 }]}>
                  <Text style={[s.readyBannerTxt, { color: '#15803D' }]}>{t(lang, 'orderReady')}</Text>
                </View>
              )}
              {(o.items ?? []).map((item: any, i: number) => (
                <Text key={i} style={s.orderItem}>{item.product_name} ×{item.qty}{item.unit_price ? `  ${fmtRs(item.unit_price * item.qty)}` : ''}</Text>
              ))}
              <View style={s.orderFoot}>
                <Text style={s.orderDate}>{fmtDate(o.created_at)}</Text>
                {(o.total ?? o.total_amount) != null && <Text style={s.orderTot}>{fmtRs(o.total ?? o.total_amount)}</Text>}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  }

  // ── Receipts ──────────────────────────────────────────────────────────
  function renderReceipts() {
    return (
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: tabBarHeight + 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />}>
        <Text style={s.pageTitle}>{t(lang, 'myReceiptsTitle')}</Text>
        {receipts.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>{t(lang, 'noReceipts')}</Text>
            <Text style={s.emptySub}>{t(lang, 'noReceiptsDesc')}</Text>
          </View>
        ) : receipts.map((r: any) => (
          <TouchableOpacity key={r.id} style={s.receiptCard} onPress={() => r.receipt_url && Linking.openURL(r.receipt_url)}>
            <View style={{ flex: 1 }}>
              <Text style={s.receiptAmt}>{fmtRs(r.total_amount ?? 0)}</Text>
              <Text style={s.receiptMeta}>{r.merchant_name ?? 'Merchant'}  ·  {fmtDate(r.created_at)}</Text>
            </View>
            <Text style={s.receiptView}>View</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  // ── Profile ───────────────────────────────────────────────────────────
  function renderProfile() {
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}>
        <View style={s.idCard}>
          <Text style={s.idTitle}>{t(lang, 'myProfile')}</Text>
          <Text style={s.idLbl}>{t(lang, 'customerIdLabel')}</Text>
          <Text style={s.idVal}>{customerId}</Text>
          {!profile?.phone_verified && !profile?.email_verified && (
            <View style={s.unverBanner}><Text style={s.unverText}>{t(lang, 'clickCollectNote')}</Text></View>
          )}
        </View>

        <Text style={s.sec}>{t(lang, 'accountDetails')}</Text>
        <View style={s.formCard}>
          <Text style={s.fLabel}>{t(lang, 'fullName')}</Text>
          <TextInput style={s.fInput} value={pName} onChangeText={setPName} placeholder={t(lang, 'fullNamePlaceholder')} placeholderTextColor="#9CA3AF" />
          <Text style={s.fLabel}>{t(lang, 'emailAddress')}</Text>
          <TextInput style={s.fInput} value={pEmail} onChangeText={setPEmail} placeholder={t(lang, 'emailPlaceholder')} placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" />
          <TouchableOpacity style={s.saveBtn} onPress={saveProfile} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnTxt}>{t(lang, 'saveChanges')}</Text>}
          </TouchableOpacity>
          {!!saveMsg && <Text style={s.saveMsg}>{saveMsg}</Text>}
        </View>

        <Text style={s.sec}>{t(lang, 'identityVerification')}</Text>
        <VerifyCard label={t(lang, 'verifyPhone')} subtitle={customer?.phone ?? ''} verified={!!profile?.phone_verified} value={customer?.phone} onSend={sendPhoneOtp} onConfirm={confirmPhoneOtp} state={phoneState} otp={phoneOtp} setOtp={setPhoneOtp} />
        <VerifyCard label={t(lang, 'verifyEmail')} subtitle={pEmail || t(lang, 'noEmailAdded')} verified={!!profile?.email_verified} value={pEmail} onSend={sendEmailOtp} onConfirm={confirmEmailOtp} state={emailState} otp={emailOtp} setOtp={setEmailOtp} />

        <TouchableOpacity style={s.signOut} onPress={handleSignOut}>
          <IcLogout /><Text style={s.signOutTxt}>{t(lang, 'logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ flex: 1 }}>
          {tab === 'discover'  && renderDiscover()}
          {tab === 'orders'    && renderOrders()}
          {tab === 'receipts'  && renderReceipts()}
          {tab === 'profile'   && renderProfile()}
        </View>
      </SafeAreaView>

      {/* Fixed bottom tab bar */}
      <View style={[s.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {TABS.map(tb => {
          const active = tab === tb.id;
          return (
            <TouchableOpacity key={tb.id} style={s.tabItem} onPress={() => setTab(tb.id)} activeOpacity={0.7}>
              <tb.Icon color={active ? '#16A34A' : '#94A3B8'} />
              <Text style={[s.tabLbl, active && s.tabLblActive]}>{tb.label}</Text>
              {active && <View style={s.tabDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {menuStore && (
        <StoreMenuModal store={menuStore} lang={lang} visible={menuVisible}
          onClose={() => { setMenuVisible(false); setMenuStore(null); }}
          onOrderPlaced={handleOrderPlaced} />
      )}
      {ratingStore && (
        <RatingModal visible={ratingVisible} storeName={ratingStore.name} storeId={ratingStore.id} lang={lang}
          onDone={() => { setRatingVisible(false); setRatingStore(null); }} />
      )}
    </View>
  );
}

// ── StoreCard styles ──────────────────────────────────────────────────────
const dS = StyleSheet.create({
  card:       { backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 20, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  banner:     { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeLabel:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  offerBadge: { backgroundColor: '#D97706', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  offerBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  body:       { padding: 14 },
  name:       { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  addr:       { fontSize: 12, color: '#6B7280', marginTop: 3 },
  desc:       { fontSize: 13, color: '#374151', marginTop: 6, lineHeight: 18 },
  footer:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  ratingTxt:  { fontSize: 12, color: '#94A3B8', marginLeft: 4 },
  menuBtn:    { backgroundColor: '#16A34A', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  menuBtnText:{ fontSize: 13, fontWeight: '700', color: '#fff' },
});

// ── Menu modal styles ─────────────────────────────────────────────────────
const mS = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#fff' },
  header:     { flexDirection: 'row', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  storeName:  { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  storeAddr:  { fontSize: 13, color: '#64748B', marginTop: 2 },
  closeBtn:   { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:  { color: '#9CA3AF', fontSize: 15 },
  section:    { paddingHorizontal: 20, paddingTop: 16 },
  catLabel:   { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1, marginBottom: 10 },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  productName:{ fontSize: 15, fontWeight: '600', color: '#0F172A' },
  productPrice:{ fontSize: 13, color: '#16A34A', fontWeight: '700', marginTop: 2 },
  addBtn:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#16A34A' },
  qtyRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn:     { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  qtyBtnGreen:{ backgroundColor: '#16A34A' },
  qtyNum:     { fontSize: 16, fontWeight: '700', color: '#0F172A', minWidth: 24, textAlign: 'center' },
  cartBar:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#16A34A', flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 24, gap: 8 },
  cartCount:  { fontSize: 13, fontWeight: '600', color: '#fff' },
  cartTotal:  { fontSize: 16, fontWeight: '800', color: '#fff', flex: 1, textAlign: 'right', marginRight: 8 },
  orderBtn:   { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  orderBtnText: { fontSize: 14, fontWeight: '800', color: '#16A34A' },
});

// ── Rating modal styles ───────────────────────────────────────────────────
const rS = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  box:       { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' },
  title:     { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  sub:       { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 20 },
  stars:     { flexDirection: 'row', gap: 4, marginBottom: 16 },
  btns:      { flexDirection: 'row', gap: 12, width: '100%' },
  skipBtn:   { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  skipText:  { fontSize: 14, fontWeight: '600', color: '#64748B' },
  submitBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#16A34A', alignItems: 'center' },
  submitText:{ fontSize: 14, fontWeight: '700', color: '#fff' },
});

// ── VerifyCard styles ─────────────────────────────────────────────────────
const vS = StyleSheet.create({
  card:       { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  row:        { flexDirection: 'row', alignItems: 'center' },
  label:      { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  sub:        { fontSize: 12, color: '#6B7280', marginTop: 1 },
  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeGreen: { backgroundColor: '#DCFCE7' },
  badgeGray:  { backgroundColor: '#F3F4F6' },
  badgeText:  { fontSize: 11, fontWeight: '700' },
  sendBtn:    { backgroundColor: '#2563EB', borderRadius: 8, paddingVertical: 9, alignItems: 'center', marginTop: 10 },
  sendText:   { color: '#fff', fontWeight: '700', fontSize: 13 },
  otpRow:     { flexDirection: 'row', gap: 8, marginTop: 10 },
  otpInput:   { flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, fontSize: 18, letterSpacing: 6, textAlign: 'center' },
  confirmBtn: { backgroundColor: '#16A34A', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  confirmText:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  errorText:  { color: '#DC2626', fontSize: 12, marginTop: 6 },
});

// ── Main styles ───────────────────────────────────────────────────────────
const s = StyleSheet.create({
  tabBar:      { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 8 },
  tabItem:     { flex: 1, alignItems: 'center', paddingVertical: 4, position: 'relative' },
  tabLbl:      { fontSize: 10, fontWeight: '600', color: '#94A3B8', marginTop: 3 },
  tabLblActive:{ color: '#16A34A', fontWeight: '700' },
  tabDot:      { position: 'absolute', top: 0, left: '30%', right: '30%', height: 2, backgroundColor: '#16A34A', borderRadius: 2 },

  hero:            { backgroundColor: '#1E3A8A', padding: 20, paddingBottom: 24 },
  heroTitle:       { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSub:         { fontSize: 13, color: '#93C5FD', marginBottom: 14 },
  searchBar:       { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  searchInput:     { flex: 1, fontSize: 14, color: '#fff' },
  pill:            { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  pillActive:      { backgroundColor: '#fff' },
  pillText:        { fontSize: 13, fontWeight: '600', color: '#fff' },
  pillTextActive:  { color: '#1E3A8A' },
  section:         { paddingHorizontal: 20, paddingTop: 20 },
  secTitle:        { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  secCount:        { fontSize: 14, fontWeight: '400', color: '#94A3B8' },
  emptyText:       { color: '#9CA3AF', fontSize: 14, marginTop: 8 },

  offerCard:       { width: 140, borderRadius: 14, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  offerBand:       { height: 50, justifyContent: 'flex-end', padding: 8 },
  offerBandText:   { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: '#374151' },
  offerBody:       { padding: 10 },
  offerName:       { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  offerCount:      { fontSize: 11, color: '#D97706', fontWeight: '600', marginTop: 3 },

  topCard:         { width: 100, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  topAvatar:       { width: 48, height: 48, borderRadius: 14, backgroundColor: '#16A34A', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  topAvatarTxt:    { fontSize: 20, fontWeight: '800', color: '#fff' },
  topName:         { fontSize: 12, fontWeight: '600', color: '#0F172A', textAlign: 'center' },
  topRating:       { fontSize: 12, fontWeight: '700', color: '#D97706' },

  pageTitle:       { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  orderCard:       { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9', elevation: 1 },
  orderHead:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  orderStore:      { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  orderBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  orderBadgeTxt:   { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  readyBanner:     { backgroundColor: '#EDE9FE', borderRadius: 8, padding: 8, marginBottom: 8 },
  readyBannerTxt:  { fontSize: 12, fontWeight: '600', color: '#7C3AED', textAlign: 'center' },
  orderItem:       { fontSize: 13, color: '#374151', marginBottom: 3 },
  orderFoot:       { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  orderDate:       { fontSize: 12, color: '#94A3B8' },
  orderTot:        { fontSize: 14, fontWeight: '700', color: '#0F172A' },

  receiptCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  receiptAmt:      { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  receiptMeta:     { fontSize: 12, color: '#6B7280', marginTop: 3 },
  receiptView:     { fontSize: 13, fontWeight: '700', color: '#2563EB' },

  idCard:          { backgroundColor: '#1E3A8A', borderRadius: 16, padding: 20, margin: 20 },
  idTitle:         { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 8 },
  idLbl:           { fontSize: 11, color: '#93C5FD', fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  idVal:           { fontSize: 20, fontWeight: '800', color: '#fff', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 4, letterSpacing: 1 },
  unverBanner:     { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 10, marginTop: 12 },
  unverText:       { fontSize: 12, color: '#FCD34D' },

  sec:             { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginHorizontal: 20, marginBottom: 8, marginTop: 8 },
  formCard:        { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginHorizontal: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  fLabel:          { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6, marginTop: 12 },
  fInput:          { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 15, color: '#0F172A', backgroundColor: '#F8FAFC' },
  saveBtn:         { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  saveBtnTxt:      { color: '#fff', fontWeight: '700', fontSize: 15 },
  saveMsg:         { textAlign: 'center', fontSize: 13, color: '#16A34A', marginTop: 8 },
  signOut:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#FECACA', gap: 8 },
  signOutTxt:      { fontSize: 15, fontWeight: '700', color: '#DC2626' },

  emptyState:      { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  emptyTitle:      { fontSize: 17, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptySub:        { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 20 },
  emptyBtn:        { backgroundColor: '#16A34A', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText:    { color: '#fff', fontWeight: '700', fontSize: 14 },

  locBanner:           { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EFF6FF', padding: 12, marginHorizontal: 0 },
  locBannerText:       { fontSize: 13, color: '#1E40AF', fontWeight: '500', flex: 1 },
  radiusBar:           { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexWrap: 'wrap' },
  radiusLabel:         { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  radiusPill:          { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#fff' },
  radiusPillActive:    { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  radiusPillText:      { fontSize: 12, fontWeight: '600', color: '#64748B' },
  radiusPillTextActive:{ color: '#1E40AF' },
});
