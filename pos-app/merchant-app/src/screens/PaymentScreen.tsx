import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { usePreventScreenCapture } from 'expo-screen-capture';

import { transactionsApi } from '../api/client';
import { savePendingTransaction } from '../db/offline';
import { useStore } from '../store/useStore';
import { PaymentMethod } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

const PAYMENT_OPTIONS: { label: string; value: PaymentMethod; color: string; emoji: string }[] = [
  { label: 'Cash',    value: 'cash',    color: '#16A34A', emoji: '💵' },
  { label: 'eSewa',   value: 'esewa',   color: '#7C3AED', emoji: '📱' },
  { label: 'Fonepay', value: 'fonepay', color: '#DC2626', emoji: '🏦' },
  { label: 'Khalti',  value: 'khalti',  color: '#5C2D91', emoji: '💜' },
  { label: 'Khata',   value: 'khata',   color: '#D97706', emoji: '📒' },
];

function formatRs(paisa: number) {
  return `Rs ${(paisa / 100).toFixed(0)}`;
}

export default function PaymentScreen({ navigation, route }: Props) {
  usePreventScreenCapture();  // FLAG_SECURE on Android, overlay block on iOS
  const { cart, cartTotal, clearCart, merchant, isOnline } = useStore();
  const { customerPhone, tableNumber, discountPaisa = 0 } = route.params as any;
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [loading, setLoading] = useState(false);
  const isRestaurant = merchant?.type === 'restaurant';

  const finalTotal = Math.max(0, cartTotal() - discountPaisa);

  async function processPayment() {
    setLoading(true);
    const payload = {
      merchant_id: merchant!.id,
      items: cart.map((i) => ({ product_id: i.product_id, qty: i.qty, unit_price: i.unit_price })),
      payment_method: selectedMethod,
      customer_phone: customerPhone || undefined,
      discount_amount: discountPaisa,
      table_number: tableNumber || undefined,
      idempotency_key: `${merchant!.id}-${Date.now()}`,
    };

    if (!isOnline && selectedMethod !== 'cash') {
      Alert.alert('Internet chaina', 'Digital payment ko laagi internet chaincha. Cash linus ya internet aayepachi garnus.');
      setLoading(false);
      return;
    }

    if (!isOnline) {
      await savePendingTransaction(payload.idempotency_key, payload);
      clearCart();
      navigation.navigate('Receipt', { offline: true, total: finalTotal, tableNumber });
      setLoading(false);
      return;
    }

    try {
      const { data } = await transactionsApi.create(payload);
      clearCart();
      navigation.navigate('Receipt', { transaction: data, offline: false });
    } catch (err: any) {
      Alert.alert('Payment bhayena', err.response?.data?.detail || 'Pheri koshish garna');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {isRestaurant && tableNumber && (
        <View style={styles.tableBadge}>
          <Text style={styles.tableBadgeText}>🍽️ Table {tableNumber}</Text>
        </View>
      )}

      <Text style={styles.title}>Payment Method छान्नुस्</Text>

      {PAYMENT_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.option, selectedMethod === opt.value && { borderColor: opt.color, borderWidth: 3 }]}
          onPress={() => setSelectedMethod(opt.value)}
        >
          <Text style={styles.optionEmoji}>{opt.emoji}</Text>
          <Text style={styles.optionLabel}>{opt.label}</Text>
          {selectedMethod === opt.value && <Text style={[styles.check, { color: opt.color }]}>✓</Text>}
        </TouchableOpacity>
      ))}

      <View style={styles.totalCard}>
        {discountPaisa > 0 && (
          <Text style={styles.discountLine}>Discount: −{formatRs(discountPaisa)}</Text>
        )}
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalAmount}>{formatRs(finalTotal)}</Text>
      </View>

      {!isOnline && selectedMethod === 'cash' && (
        <View style={styles.offlineNote}>
          <Text style={styles.offlineNoteText}>Offline mode — sale locally save huncha, internet aayo ki sync huncha</Text>
        </View>
      )}

      <TouchableOpacity style={styles.confirmBtn} onPress={processPayment} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" size="large" />
          : <Text style={styles.confirmBtnText}>Confirm Payment</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 20 },
  tableBadge: {
    backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10,
    alignItems: 'center', marginBottom: 16,
  },
  tableBadgeText: { color: '#92400E', fontWeight: '700', fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  option: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#D1D5DB', elevation: 1,
  },
  optionEmoji: { fontSize: 24, marginRight: 14 },
  optionLabel: { fontSize: 18, fontWeight: '600', color: '#111827', flex: 1 },
  check: { fontSize: 22, fontWeight: 'bold' },
  totalCard: {
    backgroundColor: '#2563EB', borderRadius: 16, padding: 24, marginTop: 12, alignItems: 'center',
  },
  discountLine: { fontSize: 14, color: '#BFDBFE', marginBottom: 4 },
  totalLabel: { fontSize: 16, color: '#BFDBFE', marginBottom: 4 },
  totalAmount: { fontSize: 40, fontWeight: 'bold', color: '#fff' },
  offlineNote: { backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, marginTop: 12 },
  offlineNoteText: { color: '#92400E', textAlign: 'center', fontSize: 13 },
  confirmBtn: {
    backgroundColor: '#16A34A', borderRadius: 16, padding: 22,
    alignItems: 'center', marginTop: 20,
  },
  confirmBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});
