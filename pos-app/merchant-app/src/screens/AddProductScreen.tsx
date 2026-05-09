import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { productsApi } from '../api/client';
import { useStore } from '../store/useStore';
import BarcodeScanner from '../components/BarcodeScanner';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

const RETAIL_CATEGORIES: string[] = [];
const RESTAURANT_CATEGORIES = ['Appetizer', 'Main Course', 'Drinks', 'Dessert', 'Snacks'];

export default function AddProductScreen({ navigation, route }: Props) {
  const merchant = useStore((s) => s.merchant);
  const existing = (route.params as any)?.product;
  const isEdit = !!existing;
  const isRestaurant = merchant?.type === 'restaurant';
  const categories = isRestaurant ? RESTAURANT_CATEGORIES : RETAIL_CATEGORIES;

  const [name, setName] = useState(existing?.name ?? '');
  const [priceRs, setPriceRs] = useState(existing ? String(existing.price / 100) : '');
  const [barcode, setBarcode] = useState(existing?.barcode ?? '');
  const [stock, setStock] = useState(existing?.stock_qty != null ? String(existing.stock_qty) : '');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Name haalna'); return; }
    const price = Math.round(parseFloat(priceRs) * 100);
    if (!priceRs || isNaN(price) || price <= 0) { Alert.alert('Valid price haalna (Rs)'); return; }

    setLoading(true);
    const payload = {
      name: name.trim(),
      price,
      barcode: barcode.trim() || undefined,
      stock_qty: stock ? parseInt(stock, 10) : undefined,
      category: category || undefined,
    };
    try {
      if (isEdit) {
        await productsApi.update(existing.id, payload);
      } else {
        await productsApi.create(payload);
      }
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
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Chiya, Wai Wai, Momo..."
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Price (Rs) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 25"
          keyboardType="decimal-pad"
          value={priceRs}
          onChangeText={setPriceRs}
        />

        {isRestaurant && (
          <>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categories}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catBtn, category === c && styles.catBtnActive]}
                  onPress={() => setCategory(category === c ? '' : c)}
                >
                  <Text style={[styles.catBtnText, category === c && styles.catBtnTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>Barcode (optional)</Text>
        <View style={styles.barcodeRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Type or scan barcode"
            value={barcode}
            onChangeText={setBarcode}
          />
          <TouchableOpacity style={styles.scanBtn} onPress={() => setShowScanner(true)}>
            <Text style={styles.scanBtnText}>📷 Scan</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Stock Quantity (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 50"
          keyboardType="number-pad"
          value={stock}
          onChangeText={setStock}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>{isEdit ? 'Update Product' : 'Add Product'}</Text>
          }
        </TouchableOpacity>

        {isEdit && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <BarcodeScanner
        visible={showScanner}
        onScanned={(code) => { setBarcode(code); setShowScanner(false); }}
        onClose={() => setShowScanner(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#D1D5DB',
    padding: 16, fontSize: 16,
  },
  barcodeRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  scanBtn: {
    backgroundColor: '#2563EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 18,
  },
  scanBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  catBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#fff',
  },
  catBtnActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  catBtnText: { color: '#374151', fontWeight: '600' },
  catBtnTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: '#2563EB', borderRadius: 14, padding: 20,
    alignItems: 'center', marginTop: 32,
  },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 10 },
  cancelBtnText: { color: '#6B7280', fontSize: 16 },
});
