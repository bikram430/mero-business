import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { productsApi } from '../api/client';
import { cacheProducts, getCachedProducts } from '../db/offline';
import { useStore } from '../store/useStore';
import { Product } from '../types';

type Props = { navigation: NativeStackNavigationProp<any> };

function formatRs(paisa: number) {
  return `Rs ${(paisa / 100).toFixed(0)}`;
}

export default function ProductsScreen({ navigation }: Props) {
  const isOnline = useStore((s) => s.isOnline);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const { data } = await productsApi.list();
        setProducts(data);
        await cacheProducts(data);
      } else {
        const cached = await getCachedProducts() as Product[];
        setProducts(cached);
      }
    } catch {
      const cached = await getCachedProducts() as Product[];
      setProducts(cached);
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleDelete(product: Product) {
    Alert.alert(
      'Delete Product',
      `"${product.name}" delete garne?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await productsApi.delete(product.id);
              setProducts((prev) => prev.filter((p) => p.id !== product.id));
            } catch {
              Alert.alert('Error', 'Delete bhayena — pheri koshish garna');
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>{formatRs(item.price)}</Text>
                {item.category && <Text style={styles.category}>{item.category}</Text>}
                {item.stock_qty != null && (
                  <Text style={[styles.stock, item.stock_qty < 5 && styles.lowStock]}>
                    Stock: {item.stock_qty}
                  </Text>
                )}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => navigation.navigate('AddProduct', { product: item })}
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>Koi products chaina</Text>
              <Text style={styles.emptySub}>Add Product button chhap!</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct', { product: null })}
      >
        <Text style={styles.fabText}>+ Add Product</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  row: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', elevation: 1,
  },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700', color: '#111827' },
  price: { fontSize: 15, color: '#2563EB', marginTop: 2 },
  category: { fontSize: 12, color: '#7C3AED', marginTop: 3, fontWeight: '500' },
  stock: { fontSize: 12, color: '#6B7280', marginTop: 3 },
  lowStock: { color: '#DC2626', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  editBtn: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  editBtnText: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  deleteBtn: { backgroundColor: '#FEE2E2', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  deleteBtnText: { color: '#DC2626', fontWeight: 'bold', fontSize: 16 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 14, color: '#9CA3AF', marginTop: 6 },
  fab: {
    position: 'absolute', bottom: 24, left: 20, right: 20,
    backgroundColor: '#2563EB', borderRadius: 16, padding: 20, alignItems: 'center', elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
