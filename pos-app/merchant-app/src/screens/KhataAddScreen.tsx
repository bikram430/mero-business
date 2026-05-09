import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../api/client';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function KhataAddScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [amountRs, setAmountRs] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!phone || phone.length < 10) { Alert.alert('Phone number haalna (10 digits)'); return; }
    const amountPaisa = Math.round(parseFloat(amountRs) * 100);
    if (!amountRs || isNaN(amountPaisa) || amountPaisa <= 0) {
      Alert.alert('Valid amount haalna (Rs)');
      return;
    }

    setLoading(true);
    try {
      await api.post('/khata', {
        customer_phone: phone,
        customer_name: name.trim() || undefined,
        amount_due: amountPaisa,
        due_date: dueDate || undefined,
        notes: notes.trim() || undefined,
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Save bhayena', err.response?.data?.detail || 'Pheri koshish garna');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Khata = Customer le aile liye, paisa pachhi dine. Yo record ma rakhnu huncha.
          </Text>
        </View>

        <Text style={styles.label}>Customer Phone *</Text>
        <TextInput
          style={styles.input}
          placeholder="98XXXXXXXX"
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>Customer Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Optional — yaad garna"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Amount (Rs) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 500"
          keyboardType="decimal-pad"
          value={amountRs}
          onChangeText={setAmountRs}
        />

        <Text style={styles.label}>Due Date (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD (e.g. 2026-05-15)"
          value={dueDate}
          onChangeText={setDueDate}
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. Momo × 2, Chiya × 1..."
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Khata Add Garne</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 20 },
  infoCard: {
    backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, marginBottom: 8,
    borderLeftWidth: 4, borderLeftColor: '#D97706',
  },
  infoText: { fontSize: 14, color: '#92400E', lineHeight: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5,
    borderColor: '#D1D5DB', padding: 16, fontSize: 16,
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: '#DC2626', borderRadius: 14, padding: 20,
    alignItems: 'center', marginTop: 32,
  },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelBtn: { padding: 16, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: '#6B7280', fontSize: 16 },
});
