import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';

type Props = { navigation: NativeStackNavigationProp<any> };

function formatRs(paisa: number) { return `Rs ${(paisa / 100).toFixed(0)}`; }
function formatDate(s?: string) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('ne-NP', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_COLOR: Record<string, string> = {
  active: '#DC2626',
  partial: '#D97706',
  paid: '#16A34A',
};

export default function KhataScreen({ navigation }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'paid'>('active');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/khata' : `/khata?status_filter=${filter}`;
      const { data: d } = await api.get(url);
      setData(d);
    } catch {
      Alert.alert('Error', 'Khata load bhayena');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function recordPayment(item: any) {
    Alert.prompt(
      `Payment Record — ${item.customer_name || item.customer_phone}`,
      `Baki: ${formatRs(item.amount_remaining)}\nKati payment garyo? (Rs)`,
      async (rsStr) => {
        if (!rsStr) return;
        const paisa = Math.round(parseFloat(rsStr) * 100);
        if (!paisa || paisa <= 0) { Alert.alert('Invalid amount'); return; }
        try {
          await api.post(`/khata/${item.id}/pay`, { amount_paid: paisa });
          load();
        } catch (err: any) {
          Alert.alert('Error', err.response?.data?.detail || 'Payment record bhayena');
        }
      },
      'plain-text',
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary cards */}
      {data && (
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderTopColor: '#DC2626' }]}>
            <Text style={styles.sumLabel}>Outstanding</Text>
            <Text style={[styles.sumAmt, { color: '#DC2626' }]}>{formatRs(data.total_outstanding)}</Text>
            <Text style={styles.sumSub}>{data.total_active} customers</Text>
          </View>
          <View style={[styles.summaryCard, { borderTopColor: '#16A34A' }]}>
            <Text style={styles.sumLabel}>Collected</Text>
            <Text style={[styles.sumAmt, { color: '#16A34A' }]}>{formatRs(data.total_amount_paid)}</Text>
          </View>
        </View>
      )}

      {/* Filter tabs */}
      <View style={styles.tabs}>
        {(['active', 'all', 'paid'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.tab, filter === f && styles.tabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
              {f === 'active' ? 'Baki' : f === 'paid' ? 'Paid' : 'Sabai'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data?.khata_list ?? []}
          keyExtractor={(i) => i.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{item.customer_name || 'Unknown'}</Text>
                  <Text style={styles.phone}>{item.customer_phone}</Text>
                  {item.due_date && <Text style={styles.dueDate}>Due: {formatDate(item.due_date)}</Text>}
                  {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.remaining}>{formatRs(item.amount_remaining)}</Text>
                  <Text style={styles.dueTotal}>of {formatRs(item.amount_due)}</Text>
                </View>
              </View>

              {item.status !== 'paid' && (
                <TouchableOpacity style={styles.payBtn} onPress={() => recordPayment(item)}>
                  <Text style={styles.payBtnText}>Record Payment</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {filter === 'active' ? 'Koi baki chaina 🎉' : 'Koi khata chaina'}
            </Text>
          }
        />
      )}

      <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('KhataAdd')}>
        <Text style={styles.addBtnText}>+ Naya Khata</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  summaryRow: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 0 },
  summaryCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderTopWidth: 4, elevation: 2,
  },
  sumLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  sumAmt: { fontSize: 22, fontWeight: '800' },
  sumSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  tabs: { flexDirection: 'row', margin: 16, backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff', elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#111827' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 10, elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  customerName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  phone: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  dueDate: { fontSize: 12, color: '#D97706', marginTop: 4 },
  notes: { fontSize: 12, color: '#9CA3AF', marginTop: 2, fontStyle: 'italic' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginBottom: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  remaining: { fontSize: 20, fontWeight: '800', color: '#DC2626' },
  dueTotal: { fontSize: 12, color: '#9CA3AF' },
  payBtn: {
    backgroundColor: '#16A34A', borderRadius: 10, padding: 12, alignItems: 'center',
  },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 60, fontSize: 16 },
  addBtn: {
    backgroundColor: '#2563EB', margin: 16, borderRadius: 14, padding: 18, alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
