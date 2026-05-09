import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { customerApi } from '../../api/client';
import { useStore } from '../../store/useStore';
import MeroLogo from '../../components/MeroLogo';
import { t } from '../../i18n/strings';
import { useScreenEntrance } from '../../hooks/useScreenEntrance';

const { width: W } = Dimensions.get('window');
type Props = { navigation: NativeStackNavigationProp<any> };

export default function CustomerSignupScreen({ navigation }: Props) {
  const lang = useStore((s) => s.lang);
  const setCustomer = useStore((s) => s.setCustomer);

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const { barX, formFade, formY } = useScreenEntrance();

  async function handleSignup() {
    if (!phone.trim() || !password) { Alert.alert(t(lang, 'required')); return; }
    setLoading(true);
    try {
      await customerApi.register(phone.trim(), password, name.trim() || undefined);
      const { data } = await customerApi.login(phone.trim(), password);
      await SecureStore.setItemAsync('access_token', data.access_token);
      await SecureStore.setItemAsync('refresh_token', data.refresh_token);
      setCustomer({ phone: phone.trim(), name: name.trim() || undefined });
      navigation.replace('CustomerMain');
    } catch (err: any) {
      Alert.alert(t(lang, 'signupError'), err.response?.data?.detail || t(lang, 'networkError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Animated.View style={[styles.accentBar, { transform: [{ translateX: barX }] }]} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← {t(lang, 'haveAccount')} {t(lang, 'login')}</Text>
          </TouchableOpacity>

          <Animated.View style={{ opacity: formFade, transform: [{ translateY: formY }] }}>
            <View style={styles.logoWrap}>
              <MeroLogo size="md" variant="light" />
            </View>

            <Text style={styles.title}>{t(lang, 'customerSignupTitle')}</Text>

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

            <Text style={styles.label}>
              {t(lang, 'name')}{' '}
              <Text style={styles.optional}>{t(lang, 'optional')}</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ram Bahadur"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              autoCapitalize="words"
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
                onSubmitEditing={handleSignup}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(!showPw)}>
                <Text style={styles.eyeLabel}>{showPw ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>{t(lang, 'signupBtn')}</Text>
              }
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t(lang, 'haveAccount')}</Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.switchLink}> {t(lang, 'login')}</Text>
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
    backgroundColor: '#16A34A',
    zIndex: 10,
  },

  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },
  backBtn: { paddingTop: 22, paddingBottom: 6 },
  backText: { color: '#6B7280', fontSize: 14, fontWeight: '500' },

  logoWrap: { marginTop: 24, marginBottom: 28 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 28, letterSpacing: -0.5 },

  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 7, marginTop: 16 },
  optional: { color: '#9CA3AF', fontWeight: '400' },
  input: {
    borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16, color: '#111827', backgroundColor: '#FAFAFA',
  },
  pwRow: { position: 'relative' },
  pwInput: { paddingRight: 68 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  eyeLabel: { color: '#16A34A', fontSize: 13, fontWeight: '600' },

  btn: {
    backgroundColor: '#16A34A', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 28,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  switchLabel: { color: '#6B7280', fontSize: 14 },
  switchLink: { color: '#16A34A', fontSize: 14, fontWeight: '700' },
});
