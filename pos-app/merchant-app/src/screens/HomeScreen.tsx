import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Polyline, Line, Circle, Rect } from 'react-native-svg';

import { transactionsApi, storesApi } from '../api/client';
import { useStore } from '../store/useStore';
import { syncOfflineTransactions } from '../db/offline';
import { t } from '../i18n/strings';

type Props = { navigation: NativeStackNavigationProp<any> };

function formatRs(paisa: number) { return `Rs ${(paisa / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`; }

// ── SVG icons ─────────────────────────────────────────────────────────────
const IcPlus = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
    <Line x1={12} y1={5} x2={12} y2={19} /><Line x1={5} y1={12} x2={19} y2={12} />
  </Svg>
);
const IcOrders = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
    <Rect x={9} y={3} width={6} height={4} rx={1} />
    <Line x1={9} y1={12} x2={15} y2={12} /><Line x1={9} y1={16} x2={13} y2={16} />
  </Svg>
);
const IcSettings = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={3} />
    <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </Svg>
);
const IcBell = ({ size = 22, color = '#374151' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 01-3.46 0" />
  </Svg>
);
const IcEye = ({ show }: { show: boolean }) => show ? (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} strokeLinecap="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><Circle cx={12} cy={12} r={3} />
  </Svg>
) : (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round">
    <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <Line x1={1} y1={1} x2={23} y2={23} />
  </Svg>
);
const IcCheck = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2.5} strokeLinecap="round">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);
const IcX = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2.5} strokeLinecap="round">
    <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
  </Svg>
);
const IcArrow = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);

export default function HomeScreen({ navigation }: Props) {
  const merchant  = useStore((s) => s.merchant);
  const isOnline  = useStore((s) => s.isOnline);
  const lang      = useStore((s) => s.lang);
  const logout    = useStore((s) => s.logout);
  const insets    = useSafeAreaInsets();

  const [dashboard,      setDashboard]      = useState<any>(null);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [pendingOrders,  setPendingOrders]  = useState<any[]>([]);
  const [updatingOrder,  setUpdatingOrder]  = useState<string | null>(null);
  const [showRevenue,    setShowRevenue]    = useState(true);

  const isRestaurant = merchant?.type === 'restaurant';

  const fetchDashboard = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    if (!isOnline) { setLoading(false); setRefreshing(false); return; }
    try {
      const { data } = await transactionsApi.dashboard();
      setDashboard(data);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, [isOnline]);

  const fetchPendingOrders = useCallback(async () => {
    if (!isOnline) return;
    try {
      const { data } = await storesApi.collectOrders('pending');
      setPendingOrders(Array.isArray(data) ? data : []);
    } catch { setPendingOrders([]); }
  }, [isOnline]);

  useEffect(() => {
    fetchDashboard();
    fetchPendingOrders();
  }, []);

  // Poll every 30 s for new orders
  useEffect(() => {
    if (!isOnline) return;
    const id = setInterval(() => { fetchPendingOrders(); fetchDashboard(true); }, 30000);
    return () => clearInterval(id);
  }, [isOnline, fetchPendingOrders, fetchDashboard]);

  async function updateOrderStatus(id: string, status: string) {
    setUpdatingOrder(id);
    try {
      await storesApi.updateOrderStatus(id, status);
      setPendingOrders(prev => prev.filter(o => o.id !== id));
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || t(lang, 'networkError'));
    } finally { setUpdatingOrder(null); }
  }

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchDashboard(true), fetchPendingOrders()]).finally(() => setRefreshing(false));
  };

  const todayCount   = dashboard?.today_transactions ?? 0;
  const todayTotal   = dashboard?.today_total ?? 0;
  const notifCount   = pendingOrders.length;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={styles.safeTop} edges={['top']} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 90 + insets.bottom }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {/* ── Welcome header ── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeLabel}>{t(lang, 'welcome')},</Text>
            <Text style={styles.storeName} numberOfLines={1}>{merchant?.name ?? '...'}</Text>
            <Text style={styles.storeType}>{isRestaurant ? t(lang, 'restaurant') : t(lang, 'retail')}</Text>
          </View>
          <TouchableOpacity
            style={styles.bellWrap}
            onPress={() => navigation.navigate('Orders')}
            activeOpacity={0.7}
          >
            <IcBell color={notifCount > 0 ? '#2563EB' : '#64748B'} />
            {notifCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifCount > 9 ? '9+' : notifCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Offline banner ── */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>{t(lang, 'offlineMsg')}</Text>
          </View>
        )}

        {/* ── Click & Collect queue (max 3) ── */}
        {pendingOrders.length > 0 && (
          <View style={styles.queueCard}>
            <View style={styles.queueHeader}>
              <View>
                <Text style={styles.queueTitle}>{t(lang, 'ordersHeader')}</Text>
                <Text style={styles.queueSub}>{pendingOrders.length} {t(lang, 'newOrders')}</Text>
              </View>
            </View>

            {pendingOrders.slice(0, 3).map((o: any) => (
              <View key={o.id} style={styles.queueRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.queueCustomer}>{o.customer_name ?? o.customer_phone ?? 'Customer'}</Text>
                  <View style={styles.chipRow}>
                    {o.items?.slice(0, 3).map((item: any, i: number) => (
                      <View key={i} style={styles.chip}>
                        <Text style={styles.chipText}>{item.product_name}</Text>
                      </View>
                    ))}
                    {(o.items?.length ?? 0) > 3 && (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>+{o.items.length - 3}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.queueActions}>
                  <TouchableOpacity
                    style={styles.queueBtn}
                    onPress={() => updateOrderStatus(o.id, 'accepted')}
                    disabled={updatingOrder === o.id}
                  >
                    {updatingOrder === o.id
                      ? <ActivityIndicator size="small" color="#2563EB" />
                      : <IcCheck />}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.queueBtn, styles.queueBtnRed]}
                    onPress={() => updateOrderStatus(o.id, 'cancelled')}
                    disabled={updatingOrder === o.id}
                  >
                    <IcX />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {pendingOrders.length > 3 && (
              <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('Orders')}>
                <Text style={styles.viewAllText}>{t(lang, 'viewAllOrders')} ({pendingOrders.length})</Text>
                <IcArrow />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Today's sales card ── */}
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#2563EB" />
          </View>
        ) : (
          <View style={styles.salesCard}>
            <View style={styles.salesCardTop}>
              <View>
                <Text style={styles.salesLabel}>{t(lang, 'todaySales')}</Text>
                <Text style={styles.salesCount}>
                  {todayCount} <Text style={styles.salesCountSub}>{t(lang, 'salesTodayCount')}</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowRevenue(v => !v)} style={styles.eyeBtn} activeOpacity={0.7}>
                <IcEye show={showRevenue} />
              </TouchableOpacity>
            </View>

            {showRevenue ? (
              <Text style={styles.salesAmount}>{formatRs(todayTotal)}</Text>
            ) : (
              <View style={styles.hiddenRevRow}>
                <Text style={styles.hiddenRevText}>{t(lang, 'revenueHidden')}</Text>
                <Text style={styles.tapReveal}>{t(lang, 'tapToReveal')}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Fixed footer nav ── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('Orders')}
          activeOpacity={0.7}
        >
          <IcOrders />
          <Text style={styles.footerItemLabel}>{t(lang, 'ordersPage')}</Text>
          {notifCount > 0 && (
            <View style={styles.footerBadge}>
              <Text style={styles.footerBadgeText}>{notifCount > 9 ? '9+' : notifCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fabBtn}
          onPress={() => navigation.navigate('NewSale')}
          activeOpacity={0.85}
        >
          <IcPlus />
          <Text style={styles.fabLabel}>{isRestaurant ? t(lang, 'newOrder') : t(lang, 'newSale')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <IcSettings />
          <Text style={styles.footerItemLabel}>{t(lang, 'settings')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F8FAFC' },
  safeTop: { backgroundColor: '#F8FAFC' },
  scroll:  { flex: 1 },
  content: { padding: 20 },

  // header
  header:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  welcomeLabel:{ fontSize: 13, color: '#64748B', fontWeight: '500' },
  storeName:   { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  storeType:   { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  bellWrap:    { position: 'relative', width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2, marginLeft: 12 },
  badge:       { position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  badgeText:   { fontSize: 10, fontWeight: '800', color: '#fff' },

  // offline
  offlineBanner: { backgroundColor: '#FEF9C3', borderRadius: 10, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: '#FDE047' },
  offlineText:   { color: '#713F12', fontSize: 13, textAlign: 'center', fontWeight: '500' },

  // queue
  queueCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#BFDBFE', shadowColor: '#2563EB', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  queueHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  queueTitle:   { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  queueSub:     { fontSize: 12, color: '#2563EB', marginTop: 2, fontWeight: '600' },
  queueRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  queueCustomer:{ fontSize: 14, fontWeight: '700', color: '#0F172A' },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  chip:         { backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  chipText:     { fontSize: 11, color: '#2563EB', fontWeight: '600' },
  queueActions: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  queueBtn:     { width: 32, height: 32, borderRadius: 8, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
  queueBtnRed:  { backgroundColor: '#FEE2E2' },
  viewAllBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 4, gap: 4 },
  viewAllText:  { fontSize: 13, fontWeight: '700', color: '#2563EB' },

  // today's sales card
  loadingCard:  { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  salesCard:    { backgroundColor: '#2563EB', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#2563EB', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  salesCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  salesLabel:   { fontSize: 12, fontWeight: '600', color: '#BFDBFE', textTransform: 'uppercase', letterSpacing: 0.8 },
  salesCount:   { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 4 },
  salesCountSub:{ fontSize: 13, fontWeight: '400', color: '#BFDBFE' },
  salesAmount:  { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  eyeBtn:       { width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  hiddenRevRow: { marginTop: 4 },
  hiddenRevText:{ fontSize: 14, color: '#93C5FD', fontWeight: '600' },
  tapReveal:    { fontSize: 12, color: '#BFDBFE', marginTop: 2 },

  // footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0',
    flexDirection: 'row', alignItems: 'center', paddingTop: 10,
    paddingHorizontal: 20,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  footerItem: {
    flex: 1, alignItems: 'center', paddingVertical: 4, position: 'relative',
  },
  footerItemLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 4 },
  footerBadge: {
    position: 'absolute', top: 0, right: 16,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },
  footerBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  fabBtn: {
    flex: 1.6, backgroundColor: '#2563EB', borderRadius: 16,
    paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginHorizontal: 8,
    shadowColor: '#2563EB', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabLabel: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
