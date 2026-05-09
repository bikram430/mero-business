import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ActivityIndicator, ScrollView, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { authApi } from '../api/client';
import { useStore } from '../store/useStore';
import MeroLogo from '../components/MeroLogo';
import { t } from '../i18n/strings';
import { useScreenEntrance } from '../hooks/useScreenEntrance';

const { width: W } = Dimensions.get('window');
type Props = { navigation: NativeStackNavigationProp<any> };

export default function LoginScreen({ navigation }: Props) {
  const lang = useStore((s) => s.lang);
  const setMerchant = useStore((s) => s.setMerchant);
  const logout = useStore((s) => s.logout);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const { barX, formFade, formY } = useScreenEntrance();

  async function handleLogin() {
    if (!phone.trim() || !password) { Alert.alert(t(lang, 'required')); return; }
    setLoading(true);
    try {
      const { data } = await authApi.login(phone.trim(), password);
      await SecureStore.setItemAsync('access_token', data.access_token);
      await SecureStore.setItemAsync('refresh_token', data.refresh_token);
      setMerchant(data.merchant);
      const existingPin = await SecureStore.getItemAsync('merchant_pin');
      navigation.replace(existingPin ? 'Main' : 'PinSetup');
    } catch (err: any) {
      Alert.alert(t(lang, 'loginError'), err.response?.data?.detail || t(lang, 'networkError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleBack() {
    await logout();
    navigation.replace('Role');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Accent bar — slides in from left */}
      <Animated.View style={[styles.accentBar, { transform: [{ translateX: barX }] }]} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backText}>← {t(lang, 'backToRole')}</Text>
          </TouchableOpacity>

          <Animated.View style={{ opacity: formFade, transform: [{ translateY: formY }] }}>
            <View style={styles.logoWrap}>
              <MeroLogo size="md" variant="light" />
            </View>

            <Text style={styles.title}>{t(lang, 'merchantLoginTitle')}</Text>

            <Text style={styles.label}>{t(lang, 'phone')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t(lang, 'phonePlaceholder')}
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={10}
              returnKeyType="next"
              autoComplete="tel"
            />

            <Text style={styles.label}>{t(lang, 'password')}</Text>
            <View style={styles.pwRow}>
              <TextInput
                style={[styles.input, styles.pwInput]}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPw}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(!showPw)}>
                <Text style={styles.eyeLabel}>{showPw ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>{t(lang, 'loginBtn')}</Text>
              }
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t(lang, 'noMerchantAccount')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MerchantRegister')}>
                <Text style={styles.switchLink}> {t(lang, 'createAccount')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF', overflow: 'hidden' },

  accentBar: {
    position: 'absolute',
    top: 0, left: 0,
    width: W, height: 3,
    backgroundColor: '#2563EB',
    zIndex: 10,
  },

  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },

  backBtn: { paddingTop: 22, paddingBottom: 6 },
  backText: { color: '#6B7280', fontSize: 14, fontWeight: '500' },

  logoWrap: { marginTop: 24, marginBottom: 28 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 28, letterSpacing: -0.5 },

  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 7, marginTop: 16 },
  input: {
    borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16, color: '#111827', backgroundColor: '#FAFAFA',
  },
  pwRow: { position: 'relative' },
  pwInput: { paddingRight: 68 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  eyeLabel: { color: '#2563EB', fontSize: 13, fontWeight: '600' },

  btn: {
    backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 28,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, flexWrap: 'wrap' },
  switchLabel: { color: '#6B7280', fontSize: 14 },
  switchLink: { color: '#2563EB', fontSize: 14, fontWeight: '700' },
});
