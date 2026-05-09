import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import Svg, { Path, Polyline, Line, Circle } from 'react-native-svg';

import { analyticsApi } from '../api/client';
import { useStore } from '../store/useStore';
import { t } from '../i18n/strings';

function formatRs(paisa: number) { return `Rs ${(paisa / 100).toLocaleString()}`; }

const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  return `${h}${i < 12 ? 'am' : 'pm'}`;
});

const MEDAL_BG     = ['#FBBF24', '#94A3B8', '#D97706', '#E2E8F0', '#E2E8F0'];
const MEDAL_TEXT   = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#94A3B8', '#94A3B8'];
const MEDAL_BORDER = ['#F59E0B', '#64748B', '#B45309', '#CBD5E1', '#CBD5E1'];

const URGENCY: Record<string, { bg: string; color: string; label: string }> = {
  critical: { bg: '#FEE2E2', color: '#DC2626', label: 'Critical' },
  low:      { bg: '#FEF3C7', color: '#D97706', label: 'Low'      },
  ok:       { bg: '#D1FAE5', color: '#16A34A', label: 'OK'       },
};

// ── Icons ────────────────────────────────────────────────────────────────────
const IcTrend = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round">
    <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </Svg>
);
const IcClock = ({ color = '#2563EB' }) => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
    <Circle cx="12" cy="12" r="10"/>
    <Polyline points="12 6 12 12 16 14"/>
  </Svg>
);
const IcStar = ({ color = '#F59E0B' }) => (
  <Svg width="12" height="12" viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </Svg>
);
const IcBox = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round">
    <Path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <Polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <Line x1="12" y1="22.08" x2="12" y2="12"/>
  </Svg>
);

type Period = 'today' | 'week' | 'month';

export default function AnalyticsScreen() {
  const lang = useStore((s) => s.lang);
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState<Period>('month');
  const [prodView, setProdView] = useState<'revenue' | 'qty'>('revenue');

  const load = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const { data: d } = await analyticsApi.get(p);
      setData(d);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(period); }, [period]);

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'today', label: t(lang, 'today') },
    { key: 'week',  label: t(lang, 'last7Days') },
    { key: 'month', label: t(lang, 'last30Days') },
  ];

  const maxHourRev  = data ? Math.max(...data.hourly_stats.map((h: any) => h.revenue), 1) : 1;
  const maxDayRev   = data ? Math.max(...data.day_stats.map((d: any) => d.revenue), 1) : 1;
  const topProducts = data ? (prodView === 'revenue' ? data.top_by_revenue : data.top_by_qty) : [];
  const maxProd     = topProducts.length
    ? Math.max(...topProducts.map((p: any) => prodView === 'revenue' ? p.total_revenue : p.total_qty), 1)
    : 1;
  const peakHourLabel = data?.peak_hour != null ? HOURS[data.peak_hour] : null;
  const peakDayLabel  = data?.peak_day  != null ? DAYS[data.peak_day]   : null;
  const payTotal = data ? Math.max(data.cash_revenue + data.digital_revenue + data.khata_revenue, 1) : 1;
  const cashPct  = data ? Math.round((data.cash_revenue    / payTotal) * 100) : 0;
  const digPct   = data ? Math.round((data.digital_revenue / payTotal) * 100) : 0;
  const khataPct = data ? Math.round((data.khata_revenue   / payTotal) * 100) : 0;

  const STAT_CARDS = data ? [
    { label: t(lang, 'totalRevenue'),   value: formatRs(data.total_revenue),   sub: PERIODS.find(p => p.key === period)?.label ?? '', accent: '#2563EB', bg: '#EFF6FF' },
    { label: t(lang, 'totalOrders'),    value: String(data.total_orders),       sub: 'Completed sales',  accent: '#16A34A', bg: '#F0FDF4' },
    { label: t(lang, 'avgOrderValue'),  value: formatRs(data.avg_order_value),  sub: 'Per transaction',  accent: '#7C3AED', bg: '#F5F3FF' },
    { label: t(lang, 'peakHour'),       value: peakHourLabel ?? '—',            sub: peakDayLabel ? `Busiest: ${peakDayLabel}` : 'Not enough data', accent: '#D97706', bg: '#FFFBEB' },
  ] : [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(period)} />}
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <IcTrend />
            <Text style={styles.pageTitle}>{t(lang, 'analyticsTitle')}</Text>
          </View>
          <Text style={styles.pageSub}>{t(lang, 'analyticsSubtitle')}</Text>
        </View>
      </View>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {PERIODS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setPeriod(key)}
            style={[styles.periodBtn, period === key && styles.periodBtnActive]}
          >
            <Text style={[styles.periodBtnText, period === key && styles.periodBtnTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      ) : !data ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t(lang, 'noAnalytics')}</Text>
          <Text style={styles.emptyDesc}>{t(lang, 'noAnalyticsDesc')}</Text>
        </View>
      ) : (
        <>
          {/* Stat cards */}
          <View style={styles.statsGrid}>
            {STAT_CARDS.map((c, i) => (
              <View key={i} style={[styles.statCard, { borderTopColor: c.accent }]}>
                <View style={[styles.statDot, { backgroundColor: c.bg }]}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent }} />
                </View>
                <Text style={styles.statLabel}>{c.label}</Text>
                <Text style={[styles.statValue, { color: c.accent }]}>{c.value}</Text>
                <Text style={styles.statSub}>{c.sub}</Text>
              </View>
            ))}
          </View>

          {/* Hourly chart */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <IcClock color="#2563EB" />
                <Text style={styles.cardTitle}>{t(lang, 'salesByHour')}</Text>
              </View>
              {peakHourLabel != null && (
                <View style={styles.peakBadge}>
                  <IcStar color="#D97706" />
                  <Text style={styles.peakBadgeText}>{t(lang, 'peakLabel')} {peakHourLabel}</Text>
                </View>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.barChart}>
                {data.hourly_stats.map((h: any) => {
                  const heightPct = Math.max((h.revenue / maxHourRev) * 90, h.revenue > 0 ? 5 : 2);
                  const isPeak = h.hour === data.peak_hour;
                  return (
                    <View key={h.hour} style={styles.barCol}>
                      <View style={[
                        styles.bar,
                        {
                          height: heightPct,
                          backgroundColor: isPeak ? '#D97706' : (h.revenue > 0 ? '#DBEAFE' : '#F1F5F9'),
                          borderWidth: isPeak ? 1 : 0,
                          borderColor: '#F59E0B',
                        },
                      ]} />
                      {h.hour % 4 === 0 && (
                        <Text style={styles.barLabel}>{HOURS[h.hour]}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
            {peakHourLabel != null && (
              <View style={styles.tipBox}>
                <Text style={styles.tipText}>
                  {t(lang, 'staffingTip')} <Text style={{ color: '#D97706', fontWeight: '700' }}>{peakHourLabel}</Text>
                </Text>
              </View>
            )}
          </View>

          {/* Day of week chart */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <IcClock color="#7C3AED" />
                <Text style={styles.cardTitle}>{t(lang, 'salesByDay')}</Text>
              </View>
              {peakDayLabel != null && (
                <View style={[styles.peakBadge, { backgroundColor: '#EDE9FE' }]}>
                  <IcStar color="#7C3AED" />
                  <Text style={[styles.peakBadgeText, { color: '#7C3AED' }]}>{peakDayLabel}</Text>
                </View>
              )}
            </View>
            <View style={styles.dayChart}>
              {data.day_stats.map((d: any, i: number) => {
                const h = Math.max((d.revenue / maxDayRev) * 80, d.revenue > 0 ? 5 : 2);
                const isPeak = i === data.peak_day;
                return (
                  <View key={i} style={styles.dayCol}>
                    <Text style={[styles.dayRevLabel, { color: d.revenue > 0 ? '#64748B' : 'transparent' }]} numberOfLines={1}>
                      {d.revenue > 0 ? formatRs(d.revenue) : ''}
                    </Text>
                    <View style={[
                      styles.dayBar,
                      {
                        height: h,
                        backgroundColor: isPeak ? '#7C3AED' : (d.revenue > 0 ? '#E9D5FF' : '#F1F5F9'),
                      },
                    ]} />
                    <Text style={[styles.dayLabel, { color: isPeak ? '#7C3AED' : '#94A3B8', fontWeight: isPeak ? '700' : '500' }]}>
                      {DAYS[i]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Top products */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <IcStar color="#F59E0B" />
                <Text style={styles.cardTitle}>{t(lang, 'topProductsTitle')}</Text>
              </View>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, prodView === 'revenue' && styles.toggleBtnActive]}
                  onPress={() => setProdView('revenue')}
                >
                  <Text style={[styles.toggleBtnText, prodView === 'revenue' && styles.toggleBtnTextActive]}>
                    {t(lang, 'byRevenue')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, prodView === 'qty' && styles.toggleBtnActive]}
                  onPress={() => setProdView('qty')}
                >
                  <Text style={[styles.toggleBtnText, prodView === 'qty' && styles.toggleBtnTextActive]}>
                    {t(lang, 'byQty')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {topProducts.slice(0, 5).map((p: any, i: number) => {
              const val  = prodView === 'revenue' ? p.total_revenue : p.total_qty;
              const pct  = Math.max((val / maxProd) * 100, 3);
              return (
                <View key={p.product_name} style={styles.prodRow}>
                  <View style={[styles.medal, { backgroundColor: MEDAL_BG[i], borderColor: MEDAL_BORDER[i] }]}>
                    <Text style={[styles.medalText, { color: MEDAL_TEXT[i] }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.prodName} numberOfLines={1}>{p.product_name}</Text>
                    <View style={styles.prodBarTrack}>
                      <View style={[styles.prodBar, { width: `${pct}%`, backgroundColor: MEDAL_BORDER[i] }]} />
                    </View>
                  </View>
                  <Text style={styles.prodVal}>
                    {prodView === 'revenue' ? formatRs(p.total_revenue) : `${p.total_qty}x`}
                  </Text>
                </View>
              );
            })}
            {topProducts.length === 0 && (
              <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', paddingVertical: 16 }}>
                No data yet
              </Text>
            )}
          </View>

          {/* Payment breakdown */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t(lang, 'paymentBreakdown')}</Text>
            </View>
            <View style={styles.payBar}>
              {cashPct > 0 && <View style={[styles.payBarSeg, { width: `${cashPct}%`, backgroundColor: '#16A34A', borderRadius: 4 }]} />}
              {digPct > 0  && <View style={[styles.payBarSeg, { width: `${digPct}%`,  backgroundColor: '#7C3AED' }]} />}
              {khataPct > 0 && <View style={[styles.payBarSeg, { width: `${khataPct}%`, backgroundColor: '#D97706', borderRadius: 4 }]} />}
            </View>
            {[
              { label: t(lang, 'cash'),    pct: cashPct,  color: '#16A34A', val: data.cash_revenue    },
              { label: t(lang, 'digital'), pct: digPct,   color: '#7C3AED', val: data.digital_revenue },
              { label: t(lang, 'khata'),   pct: khataPct, color: '#D97706', val: data.khata_revenue   },
            ].map((row) => (
              <View key={row.label} style={styles.payRow}>
                <View style={[styles.payDot, { backgroundColor: row.color }]} />
                <Text style={styles.payLabel}>{row.label}</Text>
                <Text style={styles.payPct}>{row.pct}%</Text>
                <Text style={styles.payVal}>{formatRs(row.val)}</Text>
              </View>
            ))}
          </View>

          {/* Stock alerts */}
          {(data.stock_alerts?.length ?? 0) > 0 && (
            <View style={styles.card}>
              <View style={[styles.cardHeader, { marginBottom: 14 }]}>
                <Text style={styles.cardTitle}>{t(lang, 'stockAlertsTitle')}</Text>
                {data.stock_alerts.filter((s: any) => s.urgency === 'critical').length > 0 && (
                  <View style={[styles.peakBadge, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.peakBadgeText, { color: '#DC2626' }]}>
                      {data.stock_alerts.filter((s: any) => s.urgency === 'critical').length} Critical
                    </Text>
                  </View>
                )}
              </View>
              {data.stock_alerts.map((s: any) => {
                const u = URGENCY[s.urgency] ?? URGENCY.ok;
                return (
                  <View key={s.product_id} style={styles.alertRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.alertName} numberOfLines={1}>{s.product_name}</Text>
                      <Text style={styles.alertSub}>{s.stock_qty} in stock</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <View style={[styles.alertBadge, { backgroundColor: u.bg }]}>
                        <Text style={[styles.alertBadgeText, { color: u.color }]}>{u.label}</Text>
                      </View>
                      <Text style={styles.alertVelocity}>{s.daily_velocity?.toFixed(1) ?? '—'}/day</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },

  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 },
  pageSub: { fontSize: 13, color: '#64748B', marginTop: 2 },

  periodRow: {
    flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 10,
    padding: 4, marginBottom: 16, gap: 2,
  },
  periodBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 7, alignItems: 'center' },
  periodBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  periodBtnText: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  periodBtnTextActive: { color: '#0F172A', fontWeight: '700' },

  loadingState: { alignItems: 'center', paddingVertical: 60, gap: 14 },
  loadingText: { color: '#94A3B8', fontSize: 14 },
  emptyState: {
    alignItems: 'center', padding: 48,
    backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0',
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#64748B', textAlign: 'center' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statCard: {
    width: '47.5%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderTopWidth: 3, borderWidth: 1, borderColor: '#E2E8F0',
  },
  statDot: {
    width: 26, height: 26, borderRadius: 7, alignItems: 'center',
    justifyContent: 'center', marginBottom: 8,
  },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '500', marginBottom: 3 },
  statValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: 2 },
  statSub: { fontSize: 10, color: '#94A3B8' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  peakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF3C7', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20,
  },
  peakBadgeText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  tipBox: { backgroundColor: '#FFFBEB', borderRadius: 8, padding: 10, marginTop: 10 },
  tipText: { fontSize: 12, color: '#6B7280' },

  // Hourly chart
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 104, paddingHorizontal: 4, gap: 2 },
  barCol: { width: 22, alignItems: 'center', gap: 3 },
  bar: { width: 16, borderRadius: 3 },
  barLabel: { fontSize: 7, color: '#94A3B8', textAlign: 'center' },

  // Day chart
  dayChart: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 6 },
  dayCol: { flex: 1, alignItems: 'center', gap: 4 },
  dayRevLabel: { fontSize: 7, textAlign: 'center' },
  dayBar: { width: '100%', borderRadius: 4 },
  dayLabel: { fontSize: 10 },

  // Top products
  toggleRow: { flexDirection: 'row', gap: 4 },
  toggleBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7,
    backgroundColor: '#F1F5F9',
  },
  toggleBtnActive: { backgroundColor: '#EFF6FF' },
  toggleBtnText: { fontSize: 11, fontWeight: '500', color: '#64748B' },
  toggleBtnTextActive: { color: '#2563EB', fontWeight: '700' },
  prodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  medal: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, flexShrink: 0,
  },
  medalText: { fontSize: 11, fontWeight: '800' },
  prodName: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 5 },
  prodBarTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  prodBar: { height: 6, borderRadius: 3 },
  prodVal: { fontSize: 13, fontWeight: '700', color: '#374151', marginLeft: 10, minWidth: 56, textAlign: 'right' },

  // Payment breakdown
  payBar: { height: 12, flexDirection: 'row', borderRadius: 4, overflow: 'hidden', backgroundColor: '#F1F5F9', marginBottom: 14 },
  payBarSeg: { height: 12 },
  payRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  payDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  payLabel: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },
  payPct: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginRight: 12 },
  payVal: { fontSize: 12, color: '#64748B', minWidth: 72, textAlign: 'right' },

  // Stock alerts
  alertRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  alertName: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 2 },
  alertSub: { fontSize: 12, color: '#64748B' },
  alertBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  alertBadgeText: { fontSize: 11, fontWeight: '700' },
  alertVelocity: { fontSize: 11, color: '#94A3B8' },
});
