import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, ScrollView, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Polyline, Circle, Line } from 'react-native-svg';

import { storesApi } from '../api/client';
import { useStore } from '../store/useStore';
import { t } from '../i18n/strings';

type StatusFilter = 'all' | 'pending' | 'accepted' | 'ready' | 'collected' | 'cancelled';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: '#FEF3C7', color: '#D97706' },
  accepted:  { bg: '#DBEAFE', color: '#2563EB' },
  ready:     { bg: '#EDE9FE', color: '#7C3AED' },
  collected: { bg: '#DCFCE7', color: '#16A34A' },
  cancelled: { bg: '#F3F4F6', color: '#6B7280' },
};

function fmtRs(paisa: number) {
  return `Rs ${(paisa / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
function fmtDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ── Icons ──────────────────────────────────────────────────────────────────
const IcCheck = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);
const IcX = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
    <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
  </Svg>
);
const IcReady = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="22 11.08V12a10 10 0 11-5.93-9.14" />
    <Polyline points="22 4 12 14.01 9 11.01" />
  </Svg>
);
const IcRefresh = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2} strokeLinecap="round">
    <Polyline points="23 4 23 10 17 10" /><Polyline points="1 20 1 14 7 14" />
    <Path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </Svg>
);

// ── Order card ────────────────────────────────────────────────────────────
function OrderCard({ order, lang, onAction }: { order: any; lang: string; onAction: (id: string, status: string) => void }) {
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);
  const st = STATUS_STYLE[order.status] ?? STATUS_STYLE.cancelled;

  async function act(status: string) {
    setBusy(true);
    try { await onAction(order.id, status); } finally { if (mounted.current) setBusy(false); }
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.customerName}>{order.customer_name ?? order.customer_phone ?? 'Customer'}</Text>
          <Text style={styles.orderId}>#{order.id?.slice(-8).toUpperCase()}</Text>
          {order.created_at && <Text style={styles.orderDate}>{fmtDate(order.created_at)}</Text>}
        </View>
        <View>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.color }]}>{order.status?.toUpperCase()}</Text>
          </View>
          {order.total != null && (
            <Text style={styles.orderTotal}>{fmtRs(order.total)}</Text>
          )}
        </View>
      </View>

      {/* Items */}
      {(order.items ?? []).length > 0 && (
        <View style={styles.itemsWrap}>
          {order.items.map((item: any, i: number) => (
            <View key={i} style={styles.itemChip}>
              <Text style={styles.itemChipText}>{item.product_name} ×{item.qty}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action buttons */}
      {busy ? (
        <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 10 }} />
      ) : (
        <View style={styles.actions}>
          {order.status === 'pending' && (
            <>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2563EB' }]} onPress={() => act('accepted')}>
                <IcCheck />
                <Text style={styles.actionBtnText}>{t(lang as any, 'acceptOrder')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#DC2626' }]} onPress={() => act('cancelled')}>
                <IcX />
                <Text style={styles.actionBtnText}>{t(lang as any, 'cancelOrder')}</Text>
              </TouchableOpacity>
            </>
          )}
          {order.status === 'accepted' && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#7C3AED', flex: 1 }]} onPress={() => act('ready')}>
              <IcReady />
              <Text style={styles.actionBtnText}>{t(lang as any, 'markReady')}</Text>
            </TouchableOpacity>
          )}
          {order.status === 'ready' && (
            <View style={styles.readyBanner}>
              <Text style={styles.readyBannerText}>{t(lang as any, 'orderReady')}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────
export default function OrdersScreen() {
  const lang    = useStore((s) => s.lang);
  const isOnline= useStore((s) => s.isOnline);

  const [orders,     setOrders]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState<StatusFilter>('pending');

  const FILTERS: StatusFilter[] = ['pending', 'accepted', 'ready', 'collected', 'cancelled', 'all'];

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    if (!isOnline) { setLoading(false); setRefreshing(false); return; }
    try {
      const { data } = await storesApi.collectOrders(filter === 'all' ? undefined : filter);
      setOrders(Array.isArray(data) ? data : []);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter, isOnline]);

  useEffect(() => { load(); }, [load]);

  // Poll every 20 s when viewing pending/accepted
  useEffect(() => {
    if (!isOnline || (filter !== 'pending' && filter !== 'accepted')) return;
    const id = setInterval(() => load(true), 20000);
    return () => clearInterval(id);
  }, [isOnline, filter, load]);

  async function handleAction(id: string, status: string) {
    // Optimistic update first — avoids setState on unmounted component
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    if (filter !== 'all' && filter !== status) {
      setOrders(prev => prev.filter(o => o.id !== id));
    }
    try {
      await storesApi.updateOrderStatus(id, status);
    } catch (e: any) {
      load(true); // revert to server state on failure
      Alert.alert('Error', e.response?.data?.detail || t(lang, 'networkError'));
    }
  }

  const onRefresh = () => { setRefreshing(true); load(true); };

  function filterLabel(f: StatusFilter) {
    const map: Record<StatusFilter, string> = {
      all:       t(lang, 'allOrders'),
      pending:   t(lang, 'pendingOrders'),
      accepted:  t(lang, 'acceptedOrders'),
      ready:     t(lang, 'readyOrders'),
      collected: t(lang, 'collectedOrders'),
      cancelled: t(lang, 'cancelledOrders'),
    };
    return map[f];
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Title */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>{t(lang, 'ordersPage')}</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => load(true)}>
          <IcRefresh />
        </TouchableOpacity>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.pill, filter === f && styles.pillActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>
              {filterLabel(f)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => o.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
          renderItem={({ item }) => (
            <OrderCard order={item} lang={lang} onAction={handleAction} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{t(lang, 'noOrdersYet')}</Text>
              <Text style={styles.emptySub}>{t(lang, 'noOrdersYetDesc')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#F8FAFC' },
  pageHeader:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  pageTitle:   { flex: 1, fontSize: 24, fontWeight: '800', color: '#0F172A' },
  refreshBtn:  { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // filter
  filterScroll:  { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  filterContent: { paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  pill:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff' },
  pillActive:    { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  pillText:      { fontSize: 13, fontWeight: '600', color: '#64748B' },
  pillTextActive:{ color: '#fff' },

  // list
  list: { padding: 16, paddingBottom: 32 },

  // card
  card:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardHeader:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  customerName:{ fontSize: 16, fontWeight: '700', color: '#0F172A' },
  orderId:     { fontSize: 12, color: '#94A3B8', marginTop: 2, fontFamily: 'monospace' },
  orderDate:   { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  statusText:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  orderTotal:  { fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 6, textAlign: 'right' },
  itemsWrap:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  itemChip:    { backgroundColor: '#F1F5F9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  itemChipText:{ fontSize: 12, color: '#475569', fontWeight: '500' },

  // actions
  actions:     { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 10, gap: 6 },
  actionBtnText:{ fontSize: 13, fontWeight: '700', color: '#fff' },
  readyBanner: { flex: 1, backgroundColor: '#EDE9FE', borderRadius: 10, padding: 10, alignItems: 'center' },
  readyBannerText: { fontSize: 13, fontWeight: '600', color: '#7C3AED', textAlign: 'center' },

  // empty
  empty:     { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle:{ fontSize: 17, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptySub:  { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});
