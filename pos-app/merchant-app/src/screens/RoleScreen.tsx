import React, { useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Platform, Animated, Easing, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import MeroLogo from '../components/MeroLogo';
import { useStore } from '../store/useStore';
import { t, Lang } from '../i18n/strings';

const { width: W, height: H } = Dimensions.get('window');
type Props = { navigation: NativeStackNavigationProp<any> };

// ─── Floating orb that loops up/down endlessly ───────────────────────────────
function FloatingOrb({
  size, color, top, left, distance, duration, delay,
}: {
  size: number; color: string;
  top?: number; left?: number;
  distance: number; duration: number; delay: number;
}) {
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, {
          toValue: distance,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.orb,
        {
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: color,
          top, left,
          transform: [{ translateY: y }],
        },
      ]}
    />
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function RoleScreen({ navigation }: Props) {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const setRole = useStore((s) => s.setRole);

  // Entrance animations
  const logoFade   = useRef(new Animated.Value(0)).current;
  const logoY      = useRef(new Animated.Value(18)).current;
  const card1Fade  = useRef(new Animated.Value(0)).current;
  const card1Y     = useRef(new Animated.Value(28)).current;
  const card2Fade  = useRef(new Animated.Value(0)).current;
  const card2Y     = useRef(new Animated.Value(28)).current;
  const topFade    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    Animated.parallel([
      // top bar fades first
      Animated.timing(topFade,   { toValue: 1, duration: 400, easing: ease, useNativeDriver: true }),
      // logo slides up
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.timing(logoFade, { toValue: 1, duration: 500, easing: ease, useNativeDriver: true }),
          Animated.timing(logoY,    { toValue: 0, duration: 500, easing: ease, useNativeDriver: true }),
        ]),
      ]),
      // card 1
      Animated.sequence([
        Animated.delay(320),
        Animated.parallel([
          Animated.timing(card1Fade, { toValue: 1, duration: 450, easing: ease, useNativeDriver: true }),
          Animated.timing(card1Y,    { toValue: 0, duration: 450, easing: ease, useNativeDriver: true }),
        ]),
      ]),
      // card 2 — 120 ms after card 1
      Animated.sequence([
        Animated.delay(440),
        Animated.parallel([
          Animated.timing(card2Fade, { toValue: 1, duration: 450, easing: ease, useNativeDriver: true }),
          Animated.timing(card2Y,    { toValue: 0, duration: 450, easing: ease, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  const toggleLang = useCallback(async () => {
    const next: Lang = lang === 'en' ? 'ne' : 'en';
    setLang(next);
    await SecureStore.setItemAsync('app_language', next);
  }, [lang, setLang]);

  async function selectRole(role: 'merchant' | 'customer') {
    await SecureStore.setItemAsync('app_role', role);
    setRole(role);
    navigation.replace(role === 'merchant' ? 'MerchantLogin' : 'CustomerLogin');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Background orbs ──────────────────────────────────────────── */}
      <FloatingOrb size={320} color="rgba(37,99,235,0.07)"  top={-80}     left={W * 0.45}  distance={-22} duration={6200} delay={0} />
      <FloatingOrb size={260} color="rgba(22,163,74,0.06)"  top={H * 0.5} left={-80}       distance={18}  duration={7800} delay={1800} />
      <FloatingOrb size={200} color="rgba(37,99,235,0.05)"  top={H * 0.3} left={W * 0.55}  distance={-14} duration={5400} delay={900} />

      {/* ── Language toggle ──────────────────────────────────────────── */}
      <Animated.View style={[styles.topBar, { opacity: topFade }]}>
        <TouchableOpacity style={styles.langBtn} onPress={toggleLang} activeOpacity={0.7}>
          <Text style={styles.langBtnText}>
            {lang === 'en' ? 'NE  नेपाली' : 'EN  English'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.logoSection,
          { opacity: logoFade, transform: [{ translateY: logoY }] },
        ]}
      >
        <MeroLogo size="lg" variant="light" />
        <Text style={styles.tagline}>{t(lang, 'tagline')}</Text>
      </Animated.View>

      {/* ── Divider ──────────────────────────────────────────────────── */}
      <Animated.View style={[styles.divider, { opacity: logoFade }]} />

      {/* ── Role cards ───────────────────────────────────────────────── */}
      <View style={styles.cardsSection}>
        <Text style={styles.whoTitle}>{t(lang, 'whoAreYou')}</Text>

        <Animated.View style={{ opacity: card1Fade, transform: [{ translateY: card1Y }] }}>
          <TouchableOpacity
            style={[styles.card, styles.merchantCard]}
            onPress={() => selectRole('merchant')}
            activeOpacity={0.82}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardTitle}>{t(lang, 'merchant')}</Text>
              <Text style={styles.cardDesc}>{t(lang, 'merchantDesc')}</Text>
            </View>
            <View style={[styles.badge, styles.merchantBadge]}>
              <Text style={[styles.badgeText, { color: '#2563EB' }]}>POS</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ opacity: card2Fade, transform: [{ translateY: card2Y }] }}>
          <TouchableOpacity
            style={[styles.card, styles.customerCard]}
            onPress={() => selectRole('customer')}
            activeOpacity={0.82}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardTitle}>{t(lang, 'customer')}</Text>
              <Text style={styles.cardDesc}>{t(lang, 'customerDesc')}</Text>
            </View>
            <View style={[styles.badge, styles.customerBadge]}>
              <Text style={[styles.badgeText, { color: '#16A34A' }]}>SHOP</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Text style={styles.footer}>© 2025 Mero Business</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF', overflow: 'hidden' },

  orb: { position: 'absolute' },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 10 : 6,
    paddingBottom: 8,
  },
  langBtn: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  langBtnText: { color: '#374151', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },

  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  tagline: { color: '#6B7280', fontSize: 14, marginTop: 14, letterSpacing: 0.2 },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 24, marginBottom: 28 },

  cardsSection: { paddingHorizontal: 20, paddingBottom: 16 },
  whoTitle: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  merchantCard: { borderColor: '#BFDBFE', borderLeftWidth: 4, borderLeftColor: '#2563EB' },
  customerCard: { borderColor: '#BBF7D0', borderLeftWidth: 4, borderLeftColor: '#16A34A' },

  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#6B7280' },

  badge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  merchantBadge: { backgroundColor: '#EFF6FF' },
  customerBadge: { backgroundColor: '#F0FDF4' },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

  footer: {
    color: '#D1D5DB',
    fontSize: 11,
    textAlign: 'center',
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
  },
});
