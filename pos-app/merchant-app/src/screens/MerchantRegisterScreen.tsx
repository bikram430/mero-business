import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, Animated, Dimensions,
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
type StoreType = 'retail' | 'restaurant';
type Props = { navigation: NativeStackNavigationProp<any> };

export default function MerchantRegisterScreen({ navigation }: Props) {
  const lang = useStore((s) => s.lang);
  const setMerchant = useStore((s) => s.setMerchant);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [storeType, setStoreType] = useState<StoreType>('retail');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { barX, formFade, formY } = useScreenEntrance();
  const pwMatch = !confirmPw || password === confirmPw;

  async function handleRegister() {
    if (!name.trim() || !phone.trim() || !password) {
      Alert.alert(t(lang, 'required'));
      return;
    }
    if (password !== confirmPw) {
      Alert.alert(t(lang, 'passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await authApi.register({
        name: name.trim(),
        phone: phone.trim(),
        password,
        address: address.trim() || undefined,
        type: storeType,
      });
      const { data } = await authApi.login(phone.trim(), password);
      await SecureStore.setItemAsync('access_token', data.access_token);
      await SecureStore.setItemAsync('refresh_token', data.refresh_token);
      if (data.merchant) setMerchant(data.merchant);
      navigation.replace('PinSetup');
    } catch (err: any) {
      Alert.alert(t(lang, 'registerError'), err.response?.data?.detail || t(lang, 'networkError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Accent bar */}
      <Animated.View style={[styles.accentBar, { transform: [{ translateX: barX }] }]} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← {t(lang, 'alreadyHaveAccount')} {t(lang, 'signIn')}</Text>
          </TouchableOpacity>

          <Animated.View style={{ opacity: formFade, transform: [{ translateY: formY }] }}>
            <View style={styles.logoWrap}>
              <MeroLogo size="md" variant="light" />
            </View>

            <Text style={styles.title}>{t(lang, 'registerTitle')}</Text>

            <Text style={styles.label}>{t(lang, 'businessName')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Sharma Store / Ram Sharma"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              autoCapitalize="words"
            />

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

            <Text style={styles.label}>{t(lang, 'storeType')}</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, storeType === 'retail' && styles.typeBtnActive]}
                onPress={() => setStoreType('retail')}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeBtnText, storeType === 'retail' && styles.typeBtnTextActive]}>
                  {t(lang, 'typeRetail')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, storeType === 'restaurant' && styles.typeBtnActive]}
                onPress={() => setStoreType('restaurant')}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeBtnText, storeType === 'restaurant' && styles.typeBtnTextActive]}>
                  {t(lang, 'typeRestaurant')}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>
              {t(lang, 'address')}{' '}
              <Text style={styles.optionalText}>{t(lang, 'optional')}</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t(lang, 'addressPlaceholder')}
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={setAddress}
              returnKeyType="next"
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
                returnKeyType="next"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(!showPw)}>
                <Text style={styles.eyeLabel}>{showPw ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>{t(lang, 'passwordHint')}</Text>

            <Text style={styles.label}>{t(lang, 'confirmPassword')}</Text>
            <View style={styles.pwRow}>
              <TextInput
                style={[styles.input, styles.pwInput, !pwMatch && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirm}
                value={confirmPw}
                onChangeText={setConfirmPw}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                <Text style={styles.eyeLabel}>{showConfirm ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            {!pwMatch && <Text style={styles.errorText}>{t(lang, 'passwordMismatch')}</Text>}

            <TouchableOpacity
              style={[styles.btn, (loading || !pwMatch) && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading || !pwMatch}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>{t(lang, 'registerBtn')}</Text>
              }
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t(lang, 'alreadyHaveAccount')}</Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.switchLink}> {t(lang, 'signIn')}</Text>
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

  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: { paddingTop: 22, paddingBottom: 6 },
  backText: { color: '#6B7280', fontSize: 14, fontWeight: '500' },

  logoWrap: { marginTop: 24, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 24, letterSpacing: -0.5 },

  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 7, marginTop: 16 },
  optionalText: { color: '#9CA3AF', fontWeight: '400' },

  input: {
    borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16, color: '#111827', backgroundColor: '#FAFAFA',
  },
  inputError: { borderColor: '#EF4444' },
  pwRow: { position: 'relative' },
  pwInput: { paddingRight: 68 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  eyeLabel: { color: '#2563EB', fontSize: 13, fontWeight: '600' },
  hint: { color: '#9CA3AF', fontSize: 12, marginTop: 5 },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 5, fontWeight: '500' },

  typeRow: {
    flexDirection: 'row',
    borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 10, overflow: 'hidden',
  },
  typeBtn: { flex: 1, paddingVertical: 13, alignItems: 'center', backgroundColor: '#FAFAFA' },
  typeBtnActive: { backgroundColor: '#2563EB' },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  typeBtnTextActive: { color: '#FFFFFF' },

  btn: {
    backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 28,
  },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  switchLabel: { color: '#6B7280', fontSize: 14 },
  switchLink: { color: '#2563EB', fontSize: 14, fontWeight: '700' },
});
