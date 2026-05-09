import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Share,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useStore } from '../store/useStore';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

function formatRs(paisa: number) {
  return `Rs ${(paisa / 100).toFixed(0)}`;
}

export default function KitchenOrderScreen({ navigation, route }: Props) {
  const { tableNumber, items, customerPhone, discountPaisa = 0 } = route.params as any;
  const merchant = useStore((s) => s.merchant);
  const cartTotal = items.reduce((sum: number, i: any) => sum + i.unit_price * i.qty, 0);
  const finalTotal = Math.max(0, cartTotal - discountPaisa);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' });

  async function shareKitchenOrder() {
    const lines = [
      `🍽️ KITCHEN ORDER — Table ${tableNumber}`,
      `Time: ${timeStr}`,
      `Merchant: ${merchant?.name}`,
      '─────────────────',
      ...items.map((i: any) => `${i.product_name}  ×${i.qty}`),
      '─────────────────',
    ];
    await Share.share({ message: lines.join('\n') });
  }

  return (
    <ScrollView style={styles.container}>
      {/* Kitchen ticket header */}
      <View style={styles.ticket}>
        <Text style={styles.kitchenLabel}>KITCHEN ORDER</Text>
        <View style={styles.ticketHeader}>
          <View style={styles.tableBox}>
            <Text style={styles.tableNum}>Table {tableNumber}</Text>
          </View>
          <Text style={styles.time}>{timeStr}</Text>
        </View>

        <Text style={styles.merchantName}>{merchant?.name}</Text>

        <View style={styles.divider} />

        {/* Items */}
        {items.map((item: any, i: number) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.qty}>×{item.qty}</Text>
            <Text style={styles.itemName}>{item.product_name}</Text>
            {item.category && <Text style={styles.itemCat}>{item.category}</Text>}
          </View>
        ))}

        <View style={styles.divider} />

        {/* Totals for cashier reference */}
        {discountPaisa > 0 && (
          <View style={styles.totalLine}>
            <Text style={styles.totalKey}>Subtotal</Text>
            <Text style={styles.totalVal}>{formatRs(cartTotal)}</Text>
          </View>
        )}
        {discountPaisa > 0 && (
          <View style={styles.totalLine}>
            <Text style={[styles.totalKey, { color: '#DC2626' }]}>Discount</Text>
            <Text style={[styles.totalVal, { color: '#DC2626' }]}>−{formatRs(discountPaisa)}</Text>
          </View>
        )}
        <View style={[styles.totalLine, styles.grandTotal]}>
          <Text style={styles.grandKey}>Bill Total</Text>
          <Text style={styles.grandVal}>{formatRs(finalTotal)}</Text>
        </View>

        {customerPhone && (
          <Text style={styles.phone}>Customer: {customerPhone}</Text>
        )}
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.shareBtn} onPress={shareKitchenOrder}>
        <Text style={styles.shareBtnText}>📤 Share with Kitchen</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.payBtn}
        onPress={() => navigation.navigate('Payment', {
          customerPhone,
          tableNumber,
          discountPaisa,
        })}
      >
        <Text style={styles.payBtnText}>💳 Proceed to Payment →</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>← Back to Order</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  ticket: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    marginBottom: 16, elevation: 2,
    borderLeftWidth: 6, borderLeftColor: '#D97706',
  },
  kitchenLabel: { fontSize: 11, letterSpacing: 2, color: '#D97706', fontWeight: '800', marginBottom: 12 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tableBox: { backgroundColor: '#FEF3C7', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  tableNum: { fontSize: 22, fontWeight: '900', color: '#92400E' },
  time: { fontSize: 18, color: '#6B7280', fontWeight: '600' },
  merchantName: { fontSize: 14, color: '#9CA3AF', marginBottom: 4 },
  divider: { borderTopWidth: 1, borderColor: '#F3F4F6', marginVertical: 16, borderStyle: 'dashed' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  qty: { fontSize: 22, fontWeight: '900', color: '#2563EB', minWidth: 36 },
  itemName: { fontSize: 20, fontWeight: '700', color: '#111827', flex: 1 },
  itemCat: { fontSize: 12, color: '#7C3AED', backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalKey: { fontSize: 14, color: '#6B7280' },
  totalVal: { fontSize: 14, color: '#6B7280' },
  grandTotal: { marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderColor: '#E5E7EB' },
  grandKey: { fontSize: 18, fontWeight: '800', color: '#111827' },
  grandVal: { fontSize: 18, fontWeight: '800', color: '#2563EB' },
  phone: { fontSize: 13, color: '#9CA3AF', marginTop: 12 },
  shareBtn: {
    backgroundColor: '#D97706', borderRadius: 14, padding: 18,
    alignItems: 'center', marginBottom: 12,
  },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  payBtn: {
    backgroundColor: '#16A34A', borderRadius: 14, padding: 18,
    alignItems: 'center', marginBottom: 12,
  },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  backBtn: { padding: 14, alignItems: 'center' },
  backBtnText: { color: '#6B7280', fontSize: 15 },
});
