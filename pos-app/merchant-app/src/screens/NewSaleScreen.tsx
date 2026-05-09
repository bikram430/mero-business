import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Alert, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Line, Polyline, Circle, Rect } from 'react-native-svg';

import { productsApi } from '../api/client';
import { getCachedProducts, cacheProducts } from '../db/offline';
import { useStore } from '../store/useStore';
import { t } from '../i18n/strings';
import { Product } from '../types';
import BarcodeScanner from '../components/BarcodeScanner';

type Props = { navigation: NativeStackNavigationProp<any> };

function formatRs(paisa: number) {
  return `Rs ${(paisa / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const TABLES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const ALL_CATEGORY = '__all__';

// ── Icons ──────────────────────────────────────────────────────────────────
const IcSearch = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round">
    <Circle cx={11} cy={11} r={8} /><Line x1={21} y1={21} x2={16.65} y2={16.65} />
  </Svg>
);
const IcScan = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 7V5a2 2 0 012-2h2" /><Path d="M17 3h2a2 2 0 012 2v2" />
    <Path d="M21 17v2a2 2 0 01-2 2h-2" /><Path d="M7 21H5a2 2 0 01-2-2v-2" />
    <Line x1={7} y1={12} x2={17} y2={12} strokeWidth={2.5} />
  </Svg>
);
const IcKitchen = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8h1a4 4 0 010 8h-1" /><Path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
    <Line x1={6} y1={1} x2={6} y2={4} /><Line x1={10} y1={1} x2={10} y2={4} /><Line x1={14} y1={1} x2={14} y2={4} />
  </Svg>
);
const IcCard = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={1} y={4} width={22} height={16} rx={2} ry={2} />
    <Line x1={1} y1={10} x2={23} y2={10} />
  </Svg>
);
const IcMinus = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2.5} strokeLinecap="round">
    <Line x1={5} y1={12} x2={19} y2={12} />
  </Svg>
);
const IcPlus = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
    <Line x1={12} y1={5} x2={12} y2={19} /><Line x1={5} y1={12} x2={19} y2={12} />
  </Svg>
);

export default function NewSaleScreen({ navigation }: Props) {
  const { products, setProducts, cart, addToCart, updateQty, clearCart, cartTotal, isOnline, merchant } = useStore();
  const lang = useStore((s) => s.lang);
  const insets = useSafeAreaInsets();
  const isRestaurant = merchant?.type === 'restaurant';

  const [search, setSearch] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [discountRs, setDiscountRs] = useState('');
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [showScanner, setShowScanner] = useState(false);

  const categories = [ALL_CATEGORY, ...Array.from(new Set(products.map((p: any) => p.category).filter(Boolean) as string[]))];

  useEffect(() => {
    loadProducts();
    return () => clearCart();
  }, []);

  async function loadProducts() {
    if (isOnline) {
      try {
        const { data } = await productsApi.list();
        setProducts(data);
        await cacheProducts(data);
      } catch {
        const cached = await getCachedProducts() as Product[];
        setProducts(cached);
      }
    } else {
      const cached = await getCachedProducts() as Product[];
      setProducts(cached);
    }
  }

  const filtered = products.filter((p: any) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === ALL_CATEGORY || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  const discountPaisa = Math.round((parseFloat(discountRs) || 0) * 100);
  const finalTotal = Math.max(0, cartTotal() - discountPaisa);
  const cartCount = cart.reduce((sum: number, c: any) => sum + c.qty, 0);

  function handleBarcodeScanned(barcode: string) {
    setShowScanner(false);
    const match = products.find((p: any) => p.barcode === barcode);
    if (match) {
      addToCart(match);
      Alert.alert(t(lang, 'barcodeFound'), match.name);
    } else {
      Alert.alert(t(lang, 'barcodeNotFound'), barcode);
      setSearch(barcode);
    }
  }

  function proceedToPayment() {
    if (cart.length === 0) { Alert.alert('', t(lang, 'cartEmptyMsg')); return; }
    if (isRestaurant && !tableNumber) { Alert.alert('', t(lang, 'tableRequiredMsg')); return; }
    navigation.navigate('Payment', { customerPhone, tableNumber: tableNumber || undefined, discountPaisa });
  }

  const footerHeight = 200 + insets.bottom;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={styles.safe} edges={['top']}>

        {/* ── Table selector (restaurant only) ── */}
        {isRestaurant && (
          <View style={styles.tableSection}>
            <Text style={styles.tableSectionLabel}>{t(lang, 'tableSelect')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tableRow}>
                {TABLES.map((tbl) => (
                  <TouchableOpacity
                    key={tbl}
                    style={[styles.tableBtn, tableNumber === tbl && styles.tableBtnActive]}
                    onPress={() => setTableNumber(tableNumber === tbl ? '' : tbl)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tableBtnText, tableNumber === tbl && styles.tableBtnTextActive]}>{tbl}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── Category pills (restaurant only when categories exist) ── */}
        {categories.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            <View style={styles.catRow}>
              {categories.map((c) => {
                const label = c === ALL_CATEGORY ? t(lang, 'allTypes') : c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.catChip, activeCategory === c && styles.catChipActive]}
                    onPress={() => setActiveCategory(c)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.catChipText, activeCategory === c && styles.catChipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* ── Search bar ── */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <IcSearch />
            <TextInput
              style={styles.searchInput}
              placeholder={t(lang, 'searchProduct')}
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity style={styles.scanBtn} onPress={() => setShowScanner(true)} activeOpacity={0.8}>
            <IcScan />
          </TouchableOpacity>
        </View>

        {/* ── Product list ── */}
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: cart.length > 0 ? footerHeight : 16 }}
          renderItem={({ item }) => {
            const cartItem = cart.find((c: any) => c.product_id === item.id);
            const qty = cartItem?.qty ?? 0;
            return (
              <View style={[styles.productCard, qty > 0 && styles.productCardActive]}>
                <View style={styles.productInfo}>
                  {(item as any).category && (
                    <Text style={styles.productCategory}>{(item as any).category}</Text>
                  )}
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productPrice}>{formatRs(item.price)}</Text>
                </View>
                <View style={styles.qtyControls}>
                  {qty > 0 ? (
                    <>
                      <TouchableOpacity style={styles.qtyMinus} onPress={() => updateQty(item.id, qty - 1)}>
                        <IcMinus />
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{qty}</Text>
                    </>
                  ) : null}
                  <TouchableOpacity style={styles.qtyPlus} onPress={() => addToCart(item)}>
                    <IcPlus />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {products.length === 0 ? t(lang, 'addProductsFirst') : t(lang, 'noProductsFound')}
              </Text>
            </View>
          }
        />
      </SafeAreaView>

      <BarcodeScanner
        visible={showScanner}
        onScanned={handleBarcodeScanned}
        onClose={() => setShowScanner(false)}
      />

      {/* ── Cart footer ── */}
      {cart.length > 0 && (
        <View style={[styles.cartFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.cartMeta}>
            <TextInput
              style={styles.metaInput}
              placeholder={t(lang, 'customerPhoneOptional')}
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              maxLength={10}
            />
            <TextInput
              style={styles.metaInput}
              placeholder={t(lang, 'discountRsOptional')}
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              value={discountRs}
              onChangeText={setDiscountRs}
            />
          </View>

          <View style={styles.totalsRow}>
            {discountPaisa > 0 && (
              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>{t(lang, 'subtotalLabel')}</Text>
                <Text style={styles.subtotalValue}>{formatRs(cartTotal())}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>
                  {t(lang, 'totalLabel')}{discountPaisa > 0 ? ` (−${formatRs(discountPaisa)})` : ''}
                </Text>
                <Text style={styles.cartCountLabel}>{cartCount} {t(lang, 'itemsInCart')}</Text>
              </View>
              <Text style={styles.totalAmount}>{formatRs(finalTotal)}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            {isRestaurant && tableNumber && (
              <TouchableOpacity
                style={styles.kitchenBtn}
                onPress={() => navigation.navigate('KitchenOrder', {
                  tableNumber,
                  customerPhone,
                  discountPaisa,
                  items: cart.map((i: any) => ({ ...i, product_name: i.product_name })),
                })}
                activeOpacity={0.85}
              >
                <IcKitchen />
                <Text style={styles.kitchenBtnText}>{t(lang, 'sendToKitchen')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.payBtn} onPress={proceedToPayment} activeOpacity={0.85}>
              <IcCard />
              <Text style={styles.payBtnText}>
                {isRestaurant && tableNumber
                  ? `${t(lang, 'proceedPayment')} — T${tableNumber}`
                  : t(lang, 'proceedPayment')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  safe: { flex: 1 },

  // Table
  tableSection: {
    backgroundColor: '#fff', paddingTop: 12, paddingBottom: 10, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  tableSectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', gap: 8 },
  tableBtn: {
    width: 46, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center',
  },
  tableBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  tableBtnText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  tableBtnTextActive: { color: '#fff' },

  // Category
  catScroll: { backgroundColor: '#fff', maxHeight: 52, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  catRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  catChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  catChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  catChipTextActive: { color: '#fff' },

  // Search
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 14, gap: 10 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#0F172A', padding: 0 },
  scanBtn: {
    width: 46, height: 46, borderRadius: 12, backgroundColor: '#2563EB',
    alignItems: 'center', justifyContent: 'center',
  },

  // Product list
  list: { flex: 1, paddingHorizontal: 14 },
  productCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'transparent',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  productCardActive: { borderColor: '#BFDBFE', backgroundColor: '#F0F7FF' },
  productInfo: { flex: 1 },
  productCategory: { fontSize: 10, fontWeight: '700', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  productName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  productPrice: { fontSize: 14, fontWeight: '600', color: '#2563EB', marginTop: 3 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyMinus: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center',
  },
  qtyValue: { fontSize: 17, fontWeight: '800', color: '#0F172A', minWidth: 20, textAlign: 'center' },
  qtyPlus: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#2563EB',
    alignItems: 'center', justifyContent: 'center',
  },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 15, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 32 },

  // Cart footer
  cartFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  cartMeta: { gap: 8, marginBottom: 12 },
  metaInput: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  totalsRow: { marginBottom: 12 },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  subtotalLabel: { fontSize: 13, color: '#94A3B8' },
  subtotalValue: { fontSize: 13, color: '#94A3B8' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  cartCountLabel: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  totalAmount: { fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  actionRow: { flexDirection: 'row', gap: 10 },
  kitchenBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#D97706', borderRadius: 14, paddingVertical: 14,
  },
  kitchenBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  payBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#16A34A', borderRadius: 14, paddingVertical: 14,
  },
  payBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
