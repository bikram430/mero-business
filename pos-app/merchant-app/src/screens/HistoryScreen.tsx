import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, ScrollView, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle, Polyline, Line } from 'react-native-svg';

import { api } from '../api/client';
import { Transaction, PaymentMethod } from '../types/index';

type Props = { navigation: NativeStackNavigationProp<any> };

// ── colours ────────────────────────────────────────────────────────────────
const PM_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  cash:    { bg: '#DCFCE7', text: '#16A34A', label: 'Cash' },
  esewa:   { bg: '#F3E8FF', text: '#7C3AED', label: 'eSewa' },
  khalti:  { bg: '#F3E8FF', text: '#7C3AED', label: 'Khalti' },
  fonepay: { bg: '#FEE2E2', text: '#DC2626', label: 'FonePay' },
  khata:   { bg: '#FEF3C7', text: '#D97706', label: 'Khata' },
};
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  paid:      { bg: '#DCFCE7', text: '#16A34A' },
  pending:   { bg: '#FEF3C7', text: '#D97706' },
  failed:    { bg: '#FEE2E2', text: '#DC2626' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280' },
};
const FILTER_OPTIONS = ['all', 'cash', 'esewa', 'khalti', 'fonepay', 'khata'] as const;
type Filter = typeof FILTER_OPTIONS[number];

// ── helpers ─────────────────────────────────────────────────────────────────
function fmtRs(paisa: number) {
  return `Rs ${(paisa / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
function fmtDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${day}  ${time}`;
}
function shortId(id: string) {
  return id.length > 8 ? '#' + id.slice(-8).toUpperCase() : '#' + id.toUpperCase();
}

// ── SVG icons ─────────────────────────────────────────────────────────────
function IcReceipt() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <Path d="M9 5a2 2 0 002 2h2a2 2 0 002-2 2 2 0 00-2-2h-2a2 2 0 00-2 2z" />
      <Line x1={9} y1={12} x2={15} y2={12} />
      <Line x1={9} y1={16} x2={13} y2={16} />
    </Svg>
  );
}
function IcChevronDown({ up }: { up?: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round"
      style={up ? { transform: [{ rotate: '180deg' }] } : undefined}>
      <Polyline points="6 9 12 15 18 9" />
    </Svg>
  );
}
function IcTrend() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <Polyline points="17 6 23 6 23 12" />
    </Svg>
  );
}

// ── TransactionRow ─────────────────────────────────────────────────────────
interface TxRowProps {
  item: Transaction & { created_at?: string };
  onReceipt: () => void;
}

function TransactionRow({ item, onReceipt }: TxRowProps) {
  const [expanded, setExpanded] = useState(false);
  const pm = PM_COLOR[item.payment_method] ?? { bg: '#F3F4F6', text: '#374151', label: item.payment_method };
  const st = STATUS_COLOR[item.payment_status] ?? { bg: '#F3F4F6', text: '#6B7280' };

  return (
    <View style={styles.txCard}>
      {/* summary row */}
      <TouchableOpacity style={styles.txSummary} onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
        {/* left: icon + amount */}
        <View style={styles.txIconWrap}>
          <IcReceipt />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.txAmount}>{fmtRs(item.total_amount)}</Text>
          <Text style={styles.txDate}>{fmtDate(item.created_at) || shortId(item.id)}</Text>
        </View>
        {/* right: badges + chevron */}
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={[styles.badge, { backgroundColor: pm.bg }]}>
            <Text style={[styles.badgeText, { color: pm.text }]}>{pm.label}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: st.bg }]}>
            <Text style={[styles.badgeText, { color: st.text }]}>{item.payment_status.toUpperCase()}</Text>
          </View>
        </View>
        <View style={{ marginLeft: 8 }}>
          <IcChevronDown up={expanded} />
        </View>
      </TouchableOpacity>

      {/* expanded detail */}
      {expanded && (
        <View style={styles.txDetail}>
          <View style={styles.divider} />

          {/* items list */}
          {(item.items ?? []).length > 0 ? (
            <>
              <Text style={styles.detailLabel}>Items</Text>
              {item.items.map((it, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>{it.product_name}</Text>
                  <Text style={styles.itemQty}>×{it.qty}</Text>
                  <Text style={styles.itemPrice}>{fmtRs(it.unit_price * it.qty)}</Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.noItems}>No item details</Text>
          )}

          {/* meta row */}
          <View style={styles.metaRow}>
            {item.discount_amount > 0 && (
              <Text style={styles.metaText}>Discount: {fmtRs(item.discount_amount)}</Text>
            )}
            {item.customer_phone && (
              <Text style={styles.metaText}>Customer: {item.customer_phone}</Text>
            )}
            <Text style={[styles.metaText, { marginLeft: 'auto' }]}>{shortId(item.id)}</Text>
          </View>

          {/* receipt button */}
          <TouchableOpacity style={styles.receiptBtn} onPress={onReceipt}>
            <Text style={styles.receiptBtnText}>View Receipt →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── main screen ────────────────────────────────────────────────────────────
export default function HistoryScreen({ navigation }: Props) {
  const [transactions, setTransactions] = useState<(Transaction & { created_at?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const { data } = await api.get('/transactions?limit=100');
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      // keep existing data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.payment_method === filter);

  const totalRevenue = filtered.reduce((s, t) => s + (t.payment_status === 'paid' ? t.total_amount : 0), 0);
  const paidCount   = filtered.filter(t => t.payment_status === 'paid').length;
  const avg         = paidCount > 0 ? totalRevenue / paidCount : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={{ color: '#6B7280', marginTop: 12 }}>Loading history…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {/* ── summary strip ── */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <IcTrend />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.summaryVal}>{fmtRs(totalRevenue)}</Text>
            <Text style={styles.summaryLbl}>Total Revenue</Text>
          </View>
        </View>
        <View style={styles.stripDivider} />
        <View style={styles.summaryItem}>
          <View>
            <Text style={styles.summaryVal}>{paidCount}</Text>
            <Text style={styles.summaryLbl}>Transactions</Text>
          </View>
        </View>
        <View style={styles.stripDivider} />
        <View style={styles.summaryItem}>
          <View>
            <Text style={styles.summaryVal}>{fmtRs(avg)}</Text>
            <Text style={styles.summaryLbl}>Avg Order</Text>
          </View>
        </View>
      </View>

      {/* ── filter pills ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTER_OPTIONS.map(f => {
          const active = filter === f;
          const pm = f === 'all' ? null : PM_COLOR[f];
          return (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                active && { backgroundColor: pm ? pm.text : '#2563EB', borderColor: 'transparent' },
              ]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterPillText, active && { color: '#fff' }]}>
                {f === 'all' ? 'All' : (PM_COLOR[f]?.label ?? f)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── list ── */}
      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        renderItem={({ item }) => (
          <TransactionRow
            item={item}
            onReceipt={() => navigation.navigate('Receipt', { transaction: item, offline: false })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySub}>Start a new sale to see history here.</Text>
            <TouchableOpacity style={styles.newSaleBtn} onPress={() => navigation.navigate('NewSale')}>
              <Text style={styles.newSaleBtnText}>Start New Sale</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ── styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea:       { flex: 1, backgroundColor: '#F3F4F6' },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },

  // summary
  summaryStrip:   { backgroundColor: '#2563EB', flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 20 },
  summaryItem:    { flex: 1, flexDirection: 'row', alignItems: 'center' },
  summaryVal:     { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  summaryLbl:     { fontSize: 11, color: '#BFDBFE', marginTop: 2 },
  stripDivider:   { width: 1, backgroundColor: '#3B82F6', marginHorizontal: 8, opacity: 0.5 },

  // filter
  filterScroll:   { flexGrow: 0, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterContent:  { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterPill:     {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#fff',
  },
  filterPillText: { fontSize: 13, fontWeight: '600', color: '#374151' },

  // list
  listContent:    { padding: 16, paddingBottom: 32 },

  // transaction card
  txCard:         { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  txSummary:      { flexDirection: 'row', alignItems: 'center', padding: 16 },
  txIconWrap:     { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  txAmount:       { fontSize: 17, fontWeight: 'bold', color: '#111827' },
  txDate:         { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badge:          { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText:      { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },

  // expanded
  txDetail:       { paddingHorizontal: 16, paddingBottom: 16 },
  divider:        { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },
  detailLabel:    { fontSize: 12, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  itemRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemName:       { flex: 1, fontSize: 14, color: '#374151' },
  itemQty:        { fontSize: 13, color: '#9CA3AF', marginHorizontal: 8 },
  itemPrice:      { fontSize: 14, fontWeight: '600', color: '#111827', minWidth: 60, textAlign: 'right' },
  noItems:        { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', marginBottom: 8 },
  metaRow:        { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 },
  metaText:       { fontSize: 12, color: '#6B7280' },
  receiptBtn:     { marginTop: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center' },
  receiptBtnText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },

  // empty
  emptyWrap:      { alignItems: 'center', paddingTop: 80 },
  emptyTitle:     { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 6 },
  emptySub:       { fontSize: 14, color: '#9CA3AF', marginBottom: 24 },
  newSaleBtn:     { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  newSaleBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
