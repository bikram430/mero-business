import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Switch, Platform,
  RefreshControl,
} from 'react-native';
import Svg, { Path, Polyline, Circle, Line } from 'react-native-svg';

import { storesApi } from '../api/client';
import { useStore } from '../store/useStore';
import { t } from '../i18n/strings';

type Tab = 'location' | 'offers' | 'collect';

const ORDER_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#FEF3C7', color: '#D97706', label: 'Pending'   },
  accepted:  { bg: '#DBEAFE', color: '#2563EB', label: 'Accepted'  },
  ready:     { bg: '#EDE9FE', color: '#7C3AED', label: 'Ready'     },
  collected: { bg: '#D1FAE5', color: '#16A34A', label: 'Collected' },
  cancelled: { bg: '#F1F5F9', color: '#64748B', label: 'Cancelled' },
};

function formatRs(paisa: number) { return `Rs ${(paisa / 100).toLocaleString()}`; }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }

// ── Icons ────────────────────────────────────────────────────────────────────
const IcMapPin = ({ c = '#2563EB', s = 14 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
    <Circle cx="12" cy="10" r="3"/>
  </Svg>
);
const IcTag = ({ c = '#D97706', s = 14 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round">
    <Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
    <Line x1="7" y1="7" x2="7.01" y2="7"/>
  </Svg>
);
const IcPackage = ({ c = '#7C3AED', s = 14 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
    <Path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <Polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <Line x1="12" y1="22.08" x2="12" y2="12"/>
  </Svg>
);
const IcTrash = ({ c = '#DC2626', s = 14 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
    <Polyline points="3 6 5 6 21 6"/>
    <Path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <Path d="M10 11v6M14 11v6"/>
    <Path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </Svg>
);
const IcCheck = ({ c = '#16A34A', s = 13 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
    <Polyline points="20 6 9 17 4 12"/>
  </Svg>
);

export default function StoreSettingsScreen() {
  const lang = useStore((s) => s.lang);
  const [tab, setTab] = useState<Tab>('location');

  // Location
  const [store, setStore]         = useState<any>(null);
  const [lat, setLat]             = useState('');
  const [lng, setLng]             = useState('');
  const [desc, setDesc]           = useState('');
  const [isPublic, setIsPublic]   = useState(false);
  const [savingLoc, setSavingLoc] = useState(false);
  const [locMsg, setLocMsg]       = useState<{ text: string; ok: boolean } | null>(null);

  // Offers
  const [offers, setOffers]           = useState<any[]>([]);
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [offerTitle, setOfferTitle]   = useState('');
  const [offerDesc, setOfferDesc]     = useState('');
  const [offerPct, setOfferPct]       = useState('');
  const [offerFlat, setOfferFlat]     = useState('');
  const [offerUntil, setOfferUntil]   = useState('');
  const [savingOffer, setSavingOffer] = useState(false);

  // Collect orders
  const [orders, setOrders]           = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const loadStore = useCallback(async () => {
    try {
      const { data } = await storesApi.my();
      setStore(data);
      setLat(String(data.latitude ?? ''));
      setLng(String(data.longitude ?? ''));
      setDesc(data.description ?? '');
      setIsPublic(data.is_public ?? false);
      setOffers(data.offers ?? []);
    } catch { /* store not created yet */ }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const { data } = await storesApi.collectOrders(statusFilter === 'all' ? undefined : statusFilter);
      setOrders(Array.isArray(data) ? data : []);
    } catch { setOrders([]); }
    finally { setLoadingOrders(false); }
  }, [statusFilter]);

  useEffect(() => { loadStore(); }, []);
  useEffect(() => { if (tab === 'collect') loadOrders(); }, [tab, statusFilter]);

  async function saveLocation() {
    setSavingLoc(true); setLocMsg(null);
    try {
      await storesApi.updateLocation({
        latitude: lat ? parseFloat(lat) : 0,
        longitude: lng ? parseFloat(lng) : 0,
        description: desc.trim() || undefined,
        is_public: isPublic,
      });
      setLocMsg({ text: t(lang, 'storeUpdated'), ok: true });
    } catch (e: any) {
      setLocMsg({ text: e.response?.data?.detail || t(lang, 'networkError'), ok: false });
    } finally {
      setSavingLoc(false);
      setTimeout(() => setLocMsg(null), 3000);
    }
  }

  async function addOffer() {
    if (!offerTitle.trim()) { Alert.alert('Title required'); return; }
    setSavingOffer(true);
    try {
      await storesApi.createOffer({
        title: offerTitle.trim(),
        description: offerDesc.trim() || null,
        discount_percent: offerPct ? parseFloat(offerPct) : null,
        discount_flat: offerFlat ? Math.round(parseFloat(offerFlat) * 100) : null,
        valid_until: offerUntil.trim() || null,
      });
      await loadStore();
      setShowAddOffer(false);
      setOfferTitle(''); setOfferDesc(''); setOfferPct(''); setOfferFlat(''); setOfferUntil('');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || t(lang, 'networkError'));
    } finally {
      setSavingOffer(false);
    }
  }

  async function deleteOffer(id: string) {
    Alert.alert('Delete Offer', 'Remove this offer?', [
      { text: t(lang, 'cancel'), style: 'cancel' },
      {
        text: t(lang, 'deleteOffer'), style: 'destructive',
        onPress: async () => {
          try { await storesApi.deleteOffer(id); await loadStore(); }
          catch (e: any) { Alert.alert('Error', e.response?.data?.detail || t(lang, 'networkError')); }
        },
      },
    ]);
  }

  async function updateOrderStatus(id: string, status: string) {
    setUpdatingOrder(id);
    try {
      await storesApi.updateOrderStatus(id, status);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || t(lang, 'networkError'));
    } finally {
      setUpdatingOrder(null);
    }
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'location', label: t(lang, 'locationTab'), icon: <IcMapPin c={tab === 'location' ? '#2563EB' : '#94A3B8'} s={14} /> },
    { key: 'offers',   label: t(lang, 'offersTab'),   icon: <IcTag    c={tab === 'offers'   ? '#D97706' : '#94A3B8'} s={14} /> },
    { key: 'collect',  label: t(lang, 'collectTab'),  icon: <IcPackage c={tab === 'collect' ? '#7C3AED' : '#94A3B8'} s={14} /> },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(({ key, label, icon }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
            onPress={() => setTab(key)}
            activeOpacity={0.7}
          >
            {icon}
            <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── LOCATION TAB ─────────────────────────────────────────────────── */}
      {tab === 'location' && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <IcMapPin c="#2563EB" s={16} />
              <Text style={styles.cardTitle}>{t(lang, 'storeLocationTitle')}</Text>
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>{t(lang, 'showOnMeroPasal')}</Text>
                <Text style={styles.switchSub}>Customers can discover your store</Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                thumbColor={isPublic ? '#2563EB' : '#94A3B8'}
              />
            </View>

            <Text style={styles.fieldLabel}>{t(lang, 'latitudeLabel')}</Text>
            <TextInput
              value={lat}
              onChangeText={setLat}
              placeholder="27.7172"
              placeholderTextColor="#9CA3AF"
              style={styles.fieldInput}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>{t(lang, 'longitudeLabel')}</Text>
            <TextInput
              value={lng}
              onChangeText={setLng}
              placeholder="85.3240"
              placeholderTextColor="#9CA3AF"
              style={styles.fieldInput}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>{t(lang, 'storeDescLabel')}</Text>
            <TextInput
              value={desc}
              onChangeText={setDesc}
              placeholder={t(lang, 'storeDescPlaceholder')}
              placeholderTextColor="#9CA3AF"
              style={[styles.fieldInput, { height: 80, textAlignVertical: 'top' }]}
              multiline
              numberOfLines={3}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 }}>
              <TouchableOpacity
                style={[styles.saveBtn, { opacity: savingLoc ? 0.7 : 1 }]}
                onPress={saveLocation}
                disabled={savingLoc}
              >
                <Text style={styles.saveBtnText}>{savingLoc ? 'Saving...' : t(lang, 'saveLocation')}</Text>
              </TouchableOpacity>
              {locMsg != null && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                  {locMsg.ok && <IcCheck c="#16A34A" s={13} />}
                  <Text style={{ fontSize: 12, color: locMsg.ok ? '#16A34A' : '#DC2626', flex: 1 }}>
                    {locMsg.text}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                Tip: Open Google Maps, tap your location, then copy the coordinates shown at the bottom.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ── OFFERS TAB ───────────────────────────────────────────────────── */}
      {tab === 'offers' && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          <View style={styles.sectionCard}>
            <View style={[styles.cardHeader, { marginBottom: 16 }]}>
              <IcTag c="#D97706" s={16} />
              <Text style={styles.cardTitle}>{t(lang, 'offersTab')}</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowAddOffer(!showAddOffer)}
              >
                <Text style={styles.addBtnText}>{showAddOffer ? 'Cancel' : t(lang, 'addOfferBtn')}</Text>
              </TouchableOpacity>
            </View>

            {showAddOffer && (
              <View style={styles.addOfferForm}>
                <Text style={styles.fieldLabel}>{t(lang, 'offerTitleLabel')} *</Text>
                <TextInput
                  value={offerTitle}
                  onChangeText={setOfferTitle}
                  placeholder="e.g. 20% off on weekdays"
                  placeholderTextColor="#9CA3AF"
                  style={styles.fieldInput}
                />
                <Text style={[styles.fieldLabel, { marginTop: 10 }]}>{t(lang, 'offerDescLabel')}</Text>
                <TextInput
                  value={offerDesc}
                  onChangeText={setOfferDesc}
                  placeholder="Additional details..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.fieldInput}
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>{t(lang, 'discountPctLabel')}</Text>
                    <TextInput
                      value={offerPct}
                      onChangeText={setOfferPct}
                      placeholder="20"
                      placeholderTextColor="#9CA3AF"
                      style={styles.fieldInput}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>{t(lang, 'discountFlatLabel')}</Text>
                    <TextInput
                      value={offerFlat}
                      onChangeText={setOfferFlat}
                      placeholder="50"
                      placeholderTextColor="#9CA3AF"
                      style={styles.fieldInput}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
                <Text style={[styles.fieldLabel, { marginTop: 10 }]}>{t(lang, 'validUntilLabel')}</Text>
                <TextInput
                  value={offerUntil}
                  onChangeText={setOfferUntil}
                  placeholder="2025-12-31"
                  placeholderTextColor="#9CA3AF"
                  style={styles.fieldInput}
                />
                <TouchableOpacity
                  style={[styles.saveBtn, { marginTop: 14, opacity: savingOffer ? 0.7 : 1 }]}
                  onPress={addOffer}
                  disabled={savingOffer}
                >
                  <Text style={styles.saveBtnText}>{savingOffer ? 'Adding...' : t(lang, 'submitOffer')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {offers.length === 0 && !showAddOffer && (
              <View style={styles.emptyInCard}>
                <Text style={styles.emptyInCardText}>{t(lang, 'noOffers')}</Text>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                  Add an offer to attract more customers
                </Text>
              </View>
            )}

            {offers.map((o: any) => (
              <View key={o.id} style={styles.offerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.offerTitle}>{o.title}</Text>
                  {o.description != null && o.description !== '' && (
                    <Text style={styles.offerDesc}>{o.description}</Text>
                  )}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    {o.discount_percent != null && (
                      <View style={styles.discountChip}>
                        <Text style={styles.discountChipText}>{o.discount_percent}% OFF</Text>
                      </View>
                    )}
                    {o.discount_flat != null && (
                      <View style={styles.discountChip}>
                        <Text style={styles.discountChipText}>Rs {o.discount_flat / 100} OFF</Text>
                      </View>
                    )}
                    {o.valid_until != null && (
                      <Text style={styles.offerExpiry}>Until {o.valid_until}</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteOffer(o.id)}>
                  <IcTrash c="#DC2626" s={14} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ── COLLECT ORDERS TAB ───────────────────────────────────────────── */}
      {tab === 'collect' && (
        <View style={{ flex: 1 }}>
          {/* Status filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {['pending', 'accepted', 'ready', 'collected', 'cancelled', 'all'].map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusPill, statusFilter === s && styles.statusPillActive]}
                onPress={() => setStatusFilter(s)}
              >
                <Text style={[styles.statusPillText, statusFilter === s && styles.statusPillTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            contentContainerStyle={styles.tabContent}
            refreshControl={<RefreshControl refreshing={loadingOrders} onRefresh={loadOrders} />}
          >
            {loadingOrders ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator color="#7C3AED" />
              </View>
            ) : orders.length === 0 ? (
              <View style={styles.emptyInCard}>
                <IcPackage c="#94A3B8" s={24} />
                <Text style={[styles.emptyInCardText, { marginTop: 12 }]}>{t(lang, 'noCollectOrders')}</Text>
              </View>
            ) : (
              orders.map((o: any) => {
                const st = ORDER_STATUS[o.status] ?? ORDER_STATUS.pending;
                return (
                  <View key={o.id} style={styles.orderCard}>
                    <View style={styles.orderCardHeader}>
                      <View>
                        <Text style={styles.orderCustomer}>{o.customer_name ?? o.customer_phone ?? 'Customer'}</Text>
                        <Text style={styles.orderId}>#{String(o.id).slice(0, 8).toUpperCase()}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                        <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                      </View>
                    </View>

                    {o.items?.map((item: any, i: number) => (
                      <View key={i} style={styles.orderItemRow}>
                        <Text style={styles.orderItemName}>{item.product_name} ×{item.qty}</Text>
                        <Text style={styles.orderItemPrice}>{formatRs(item.unit_price * item.qty)}</Text>
                      </View>
                    ))}

                    <View style={styles.orderTotal}>
                      <Text style={styles.orderTotalLabel}>Total</Text>
                      <Text style={styles.orderTotalVal}>{formatRs(o.total_amount)}</Text>
                    </View>

                    {o.notes != null && o.notes !== '' && (
                      <View style={styles.orderNote}>
                        <Text style={styles.orderNoteText}>{o.notes}</Text>
                      </View>
                    )}

                    {/* Action buttons */}
                    <View style={styles.orderActions}>
                      {o.status === 'pending' && (
                        <>
                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#DBEAFE' }]}
                            onPress={() => updateOrderStatus(o.id, 'accepted')}
                            disabled={updatingOrder === o.id}
                          >
                            {updatingOrder === o.id
                              ? <ActivityIndicator size="small" color="#2563EB" />
                              : <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>{t(lang, 'acceptOrder')}</Text>}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
                            onPress={() => updateOrderStatus(o.id, 'cancelled')}
                            disabled={updatingOrder === o.id}
                          >
                            <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>{t(lang, 'cancelOrder')}</Text>
                          </TouchableOpacity>
                        </>
                      )}
                      {o.status === 'accepted' && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#EDE9FE', flex: 1 }]}
                          onPress={() => updateOrderStatus(o.id, 'ready')}
                          disabled={updatingOrder === o.id}
                        >
                          {updatingOrder === o.id
                            ? <ActivityIndicator size="small" color="#7C3AED" />
                            : <Text style={[styles.actionBtnText, { color: '#7C3AED' }]}>{t(lang, 'markReady')}</Text>}
                        </TouchableOpacity>
                      )}
                      {o.status === 'ready' && (
                        <View style={styles.readyBanner}>
                          <IcCheck c="#16A34A" s={14} />
                          <Text style={styles.readyBannerText}>Ready for collection</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.orderTime}>{fmtDate(o.created_at)}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 13, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: '#2563EB', backgroundColor: '#F8FAFF' },
  tabLabel: { fontSize: 12, fontWeight: '500', color: '#94A3B8' },
  tabLabelActive: { color: '#1E40AF', fontWeight: '700' },

  tabContent: { padding: 16, paddingBottom: 40 },

  sectionCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1,
    borderColor: '#E2E8F0', padding: 18,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },

  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 16,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  switchSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },
  fieldInput: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 13, paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14, color: '#111827', backgroundColor: '#F8FAFC',
  },

  saveBtn: {
    backgroundColor: '#2563EB', borderRadius: 10,
    paddingVertical: 11, paddingHorizontal: 20, alignSelf: 'flex-start',
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  infoBanner: {
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: 10, padding: 12, marginTop: 16,
  },
  infoBannerText: { fontSize: 12, color: '#92400E', lineHeight: 18 },

  addBtn: {
    backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#BBF7D0',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
  },
  addBtnText: { color: '#16A34A', fontWeight: '700', fontSize: 13 },

  addOfferForm: {
    backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1,
    borderColor: '#E2E8F0', padding: 14, marginBottom: 16,
  },

  emptyInCard: { alignItems: 'center', paddingVertical: 32 },
  emptyInCardText: { fontSize: 15, fontWeight: '700', color: '#374151' },

  offerRow: {
    flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  offerTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  offerDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  discountChip: {
    backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1, borderColor: '#FDE68A',
  },
  discountChipText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  offerExpiry: { fontSize: 11, color: '#94A3B8', alignSelf: 'center' },
  deleteBtn: {
    width: 34, height: 34, borderRadius: 8, backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },

  filterScroll: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 10 },
  statusPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  statusPillActive: { backgroundColor: '#DBEAFE' },
  statusPillText: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  statusPillTextActive: { color: '#2563EB', fontWeight: '700' },

  orderCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0',
    padding: 16, marginBottom: 12,
  },
  orderCardHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12,
  },
  orderCustomer: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  orderId: { fontSize: 11, color: '#94A3B8', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  orderItemRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 3,
  },
  orderItemName: { fontSize: 13, color: '#475569' },
  orderItemPrice: { fontSize: 13, fontWeight: '600', color: '#374151' },
  orderTotal: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
    paddingTop: 10, marginTop: 6,
  },
  orderTotalLabel: { fontSize: 12, color: '#94A3B8' },
  orderTotalVal: { fontSize: 17, fontWeight: '800', color: '#2563EB' },
  orderNote: {
    backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginTop: 8,
  },
  orderNoteText: { fontSize: 12, color: '#64748B' },
  orderActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  readyBanner: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#BBF7D0',
    borderRadius: 10, padding: 10,
  },
  readyBannerText: { fontSize: 13, color: '#16A34A', fontWeight: '600' },
  orderTime: { fontSize: 11, color: '#94A3B8', marginTop: 8 },
});
