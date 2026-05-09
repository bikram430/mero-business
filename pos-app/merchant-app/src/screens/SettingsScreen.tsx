import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Switch, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Polyline, Circle, Line } from 'react-native-svg';

import { useStore } from '../store/useStore';
import { t, Lang } from '../i18n/strings';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: { params?: { showRevenue?: boolean; onToggleRevenue?: () => void } };
};

// ── Icons ──────────────────────────────────────────────────────────────────
const IcChevron = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);
const IcLanguage = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={10} />
    <Line x1={2} y1={12} x2={22} y2={12} />
    <Path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </Svg>
);
const IcEye = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth={2} strokeLinecap="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><Circle cx={12} cy={12} r={3} />
  </Svg>
);
const IcAnalytics = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </Svg>
);
const IcStore = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <Polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
);
const IcBox = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <Polyline points="3.27 6.96 12 12.01 20.73 6.96" /><Line x1={12} y1={22.08} x2={12} y2={12} />
  </Svg>
);
const IcHistory = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={10} /><Polyline points="12 6 12 12 16 14" />
  </Svg>
);
const IcKhata = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
    <Line x1={8} y1={9} x2={16} y2={9} /><Line x1={8} y1={13} x2={14} y2={13} />
  </Svg>
);
const IcLogout = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <Polyline points="16 17 21 12 16 7" /><Line x1={21} y1={12} x2={9} y2={12} />
  </Svg>
);

// ── Row components ────────────────────────────────────────────────────────
function SettingRow({ icon, label, onPress, right }: { icon: React.ReactNode; label: string; onPress?: () => void; right?: React.ReactNode }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>{right ?? <IcChevron />}</View>
    </TouchableOpacity>
  );
}

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionHeader}>{label.toUpperCase()}</Text>;
}

export default function SettingsScreen({ navigation }: Props) {
  const lang      = useStore((s) => s.lang);
  const setLang   = useStore((s) => s.setLang);
  const merchant  = useStore((s) => s.merchant);
  const logout    = useStore((s) => s.logout);
  const [showRev, setShowRev] = useState(true);

  function confirmLogout() {
    Alert.alert(t(lang, 'logout'), t(lang, 'confirmLogout'), [
      { text: t(lang, 'cancel'), style: 'cancel' },
      {
        text: t(lang, 'yes'), style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: 'Role' }] });
        },
      },
    ]);
  }

  function toggleLang() {
    setLang(lang === 'en' ? 'ne' : 'en');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t(lang, 'settings')}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Store info */}
        <View style={styles.storeCard}>
          <View style={styles.storeAvatar}>
            <Text style={styles.storeAvatarText}>{(merchant?.name ?? '?')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.storeCardName}>{merchant?.name ?? '—'}</Text>
            <Text style={styles.storeCardType}>
              {merchant?.type === 'restaurant' ? t(lang, 'restaurant') : t(lang, 'retail')}
            </Text>
            <Text style={styles.storeCardPhone}>{merchant?.phone ?? ''}</Text>
          </View>
        </View>

        {/* Appearance */}
        <SectionHeader label={t(lang, 'appearance')} />
        <View style={styles.card}>
          <SettingRow
            icon={<IcLanguage />}
            label={t(lang, 'language')}
            onPress={toggleLang}
            right={
              <View style={styles.langToggle}>
                <Text style={[styles.langOpt, lang === 'en' && styles.langOptActive]}>EN</Text>
                <Text style={styles.langDivider}>|</Text>
                <Text style={[styles.langOpt, lang === 'ne' && styles.langOptActive]}>NE</Text>
              </View>
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<IcEye />}
            label={t(lang, 'showRevenueLabel')}
            right={
              <Switch
                value={showRev}
                onValueChange={setShowRev}
                trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                thumbColor={showRev ? '#2563EB' : '#94A3B8'}
              />
            }
          />
        </View>

        {/* Quick Nav */}
        <SectionHeader label={t(lang, 'storeInfo')} />
        <View style={styles.card}>
          <SettingRow icon={<IcStore />} label={t(lang, 'storeSettings')} onPress={() => navigation.navigate('StoreSettings')} />
          <View style={styles.divider} />
          <SettingRow icon={<IcBox />} label={t(lang, 'products')} onPress={() => navigation.navigate('Products')} />
          <View style={styles.divider} />
          <SettingRow icon={<IcAnalytics />} label={t(lang, 'analyticsBtn')} onPress={() => navigation.navigate('Analytics')} />
          <View style={styles.divider} />
          <SettingRow icon={<IcHistory />} label={t(lang, 'history')} onPress={() => navigation.navigate('History')} />
          <View style={styles.divider} />
          <SettingRow icon={<IcKhata />} label={t(lang, 'khata')} onPress={() => navigation.navigate('Khata')} />
        </View>

        {/* Sign out */}
        <SectionHeader label={t(lang, 'account')} />
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={confirmLogout} activeOpacity={0.7}>
            <View style={styles.rowIcon}><IcLogout /></View>
            <Text style={[styles.rowLabel, { color: '#DC2626' }]}>{t(lang, 'signOutBtn')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#F8FAFC' },
  title:  { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  scroll: { flex: 1 },

  storeCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 24,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  storeAvatar: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  storeAvatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  storeCardName: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  storeCardType: { fontSize: 13, color: '#64748B', marginTop: 2 },
  storeCardPhone:{ fontSize: 13, color: '#94A3B8', marginTop: 2 },

  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1,
    paddingHorizontal: 20, marginTop: 20, marginBottom: 8,
  },
  card:     { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  divider:  { height: 1, backgroundColor: '#F3F4F6', marginLeft: 56 },
  row:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon:  { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#0F172A' },
  rowRight: { marginLeft: 8 },

  langToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  langOpt:    { fontSize: 13, fontWeight: '600', color: '#94A3B8', paddingHorizontal: 4 },
  langOptActive: { color: '#2563EB', fontWeight: '800' },
  langDivider:   { color: '#E2E8F0', fontSize: 14, marginHorizontal: 2 },
});
