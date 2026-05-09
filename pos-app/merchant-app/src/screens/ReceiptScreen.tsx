import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { usePreventScreenCapture } from 'expo-screen-capture';
import QRCode from 'react-native-qrcode-svg';

import { transactionsApi } from '../api/client';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

function formatRs(paisa: number) {
  return `Rs ${(paisa / 100).toFixed(0)}`;
}

export default function ReceiptScreen({ navigation, route }: Props) {
  usePreventScreenCapture();  // Prevent screenshot of receipt with customer phone/amount
  const { transaction, offline, total } = route.params as any;

  async function resendReceipt(channel: 'whatsapp' | 'sms') {
    if (!transaction?.id) return;
    try {
      await transactionsApi.sendReceipt(transaction.id, { channel });
      Alert.alert('Pathayo!', `Receipt ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} ma pathayo`);
    } catch {
      Alert.alert('Error', 'Receipt pathaauna sakiena — pheri koshish garna');
    }
  }

  const displayTotal = offline ? total : (transaction?.total_amount ?? 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.successBox}>
        <Text style={styles.tick}>✓</Text>
        <Text style={styles.successText}>{offline ? 'Sale Saved (Offline)' : 'Payment Successful!'}</Text>
        <Text style={styles.totalText}>{formatRs(displayTotal)}</Text>
      </View>

      {offline && (
        <View style={styles.offlineCard}>
          <Text style={styles.offlineTitle}>Offline Sale</Text>
          <Text style={styles.offlineDesc}>
            Internet aayo ki yo sale automatically server ma sync huncha ra customer lai receipt pathaincha.
          </Text>
        </View>
      )}

      {!offline && transaction && (
        <View style={styles.receiptCard}>
          <Text style={styles.receiptTitle}>Receipt #{transaction.id.slice(0, 8).toUpperCase()}</Text>
          {transaction.items?.map((item: any, i: number) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.product_name} × {item.qty}</Text>
              <Text style={styles.itemPrice}>{formatRs(item.unit_price * item.qty)}</Text>
            </View>
          ))}
          {transaction.discount_amount > 0 && (
            <View style={styles.itemRow}>
              <Text style={styles.itemName}>Discount</Text>
              <Text style={[styles.itemPrice, { color: '#DC2626' }]}>-{formatRs(transaction.discount_amount)}</Text>
            </View>
          )}
          <View style={[styles.itemRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatRs(transaction.total_amount)}</Text>
          </View>
          <Text style={styles.method}>Payment: {transaction.payment_method?.toUpperCase()}</Text>
          <View style={styles.qrSection}>
            <QRCode
              value={`https://merobusiness.com.np/receipt/${transaction.id}`}
              size={120}
              color="#111827"
              backgroundColor="#fff"
            />
            <Text style={styles.qrLabel}>Digital receipt scan garna</Text>
          </View>
        </View>
      )}

      {!offline && transaction?.customer_phone && (
        <View style={styles.sendSection}>
          <Text style={styles.sendLabel}>Receipt pathaaunu cha?</Text>
          <TouchableOpacity style={styles.waBtn} onPress={() => resendReceipt('whatsapp')}>
            <Text style={styles.waBtnText}>📱 WhatsApp ma Pathaaunu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smsBtn} onPress={() => resendReceipt('sms')}>
            <Text style={styles.smsBtnText}>SMS ma Pathaaunu</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('Main')}>
        <Text style={styles.doneBtnText}>Naya Sale Suru Garne</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  successBox: { backgroundColor: '#16A34A', borderRadius: 20, padding: 32, alignItems: 'center', marginBottom: 16 },
  tick: { fontSize: 60, color: '#fff', marginBottom: 8 },
  successText: { fontSize: 22, color: '#fff', fontWeight: 'bold', marginBottom: 4 },
  totalText: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
  offlineCard: { backgroundColor: '#FEF3C7', borderRadius: 16, padding: 20, marginBottom: 16 },
  offlineTitle: { fontSize: 17, fontWeight: 'bold', color: '#92400E', marginBottom: 6 },
  offlineDesc: { fontSize: 14, color: '#92400E', lineHeight: 20 },
  receiptCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2 },
  receiptTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemName: { fontSize: 15, color: '#374151', flex: 1 },
  itemPrice: { fontSize: 15, color: '#111827', fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
  totalValue: { fontSize: 17, fontWeight: 'bold', color: '#2563EB' },
  method: { fontSize: 13, color: '#9CA3AF', marginTop: 8 },
  qrSection: { alignItems: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderColor: '#E5E7EB' },
  qrLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  sendSection: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 },
  sendLabel: { fontSize: 16, color: '#374151', marginBottom: 12 },
  waBtn: { backgroundColor: '#16A34A', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  waBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  smsBtn: { borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 12, padding: 14, alignItems: 'center' },
  smsBtnText: { color: '#374151', fontSize: 16 },
  doneBtn: { backgroundColor: '#2563EB', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 32 },
  doneBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
