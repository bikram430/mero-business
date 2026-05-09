'use strict';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import { t } from '../i18n/strings';

type Props = { navigation: NativeStackNavigationProp<any> };

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 60 * 1000;

export default function PinLockScreen({ navigation }: Props) {
  const lang = useStore((s) => s.lang);
  const role = useStore((s) => s.role);
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [hasBiometric, setHasBiometric] = useState(false);

  const homeRoute = role === 'customer' ? 'CustomerMain' : 'Main';

  useEffect(() => {
    checkLockout();
    checkBiometric();
  }, []);

  useEffect(() => {
    if (!locked) return;
    const interval = setInterval(() => {
      setLockRemaining((prev) => {
        if (prev <= 1) { setLocked(false); clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [locked]);

  async function checkLockout() {
    const lockUntil = await SecureStore.getItemAsync('pin_lock_until');
    if (lockUntil) {
      const remaining = parseInt(lockUntil) - Date.now();
      if (remaining > 0) {
        setLocked(true);
        setLockRemaining(Math.ceil(remaining / 1000));
        return;
      }
      await SecureStore.deleteItemAsync('pin_lock_until');
    }
    const savedAttempts = await SecureStore.getItemAsync('pin_attempts');
    if (savedAttempts) setAttempts(parseInt(savedAttempts));
  }

  async function checkBiometric() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setHasBiometric(hasHardware && isEnrolled);
    if (hasHardware && isEnrolled) triggerBiometric();
  }

  const triggerBiometric = useCallback(async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login to Mero Business',
        fallbackLabel: 'Use PIN',
        cancelLabel: t(lang, 'cancel'),
        disableDeviceFallback: false,
      });
      if (result.success) {
        await resetAttempts();
        navigation.replace(homeRoute);
      }
    } catch {}
  }, [homeRoute, navigation, lang]);

  async function handleDigit(digit: string) {
    if (locked) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length >= 4) await verifyPin(newPin);
  }

  async function verifyPin(entered: string) {
    const stored = await SecureStore.getItemAsync('merchant_pin');
    if (stored === entered) {
      await resetAttempts();
      navigation.replace(homeRoute);
    } else {
      Vibration.vibrate(300);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');
      await SecureStore.setItemAsync('pin_attempts', String(newAttempts));
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockUntil = Date.now() + LOCKOUT_MS;
        await SecureStore.setItemAsync('pin_lock_until', String(lockUntil));
        setLocked(true);
        setLockRemaining(LOCKOUT_MS / 1000);
        Alert.alert(t(lang, 'accountLocked'), t(lang, 'lockedMsg'));
      } else {
        Alert.alert(t(lang, 'wrongPin'), `${MAX_ATTEMPTS - newAttempts} ${t(lang, 'attemptsLeft')}`);
      }
    }
  }

  async function resetAttempts() {
    setAttempts(0);
    await SecureStore.deleteItemAsync('pin_attempts');
    await SecureStore.deleteItemAsync('pin_lock_until');
  }

  const formatLockTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.inner}>
        <Text style={styles.appName}>Mero Business</Text>

        <Text style={styles.title}>
          {locked ? `${t(lang, 'accountLocked')} — ${formatLockTime(lockRemaining)}` : t(lang, 'enterPin')}
        </Text>

        {/* PIN dots */}
        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
          ))}
        </View>

        {attempts > 0 && !locked && (
          <Text style={styles.attemptsText}>
            {MAX_ATTEMPTS - attempts} {t(lang, 'attemptsLeft')}
          </Text>
        )}

        {/* Numpad */}
        <View style={styles.numpad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'].map((key, idx) => {
            if (key === '') return <View key={idx} style={styles.keyEmpty} />;
            const isBackspace = key === '←';
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.key, locked && styles.keyDisabled]}
                onPress={() => isBackspace ? setPin((p) => p.slice(0, -1)) : handleDigit(key)}
                disabled={locked}
                activeOpacity={0.6}
              >
                <Text style={[styles.keyText, isBackspace && styles.backspaceText]}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {hasBiometric && !locked && (
          <TouchableOpacity style={styles.bioBtn} onPress={triggerBiometric}>
            <Text style={styles.bioText}>{t(lang, 'biometric')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  appName: { fontSize: 16, fontWeight: '700', color: '#9CA3AF', marginBottom: 8, letterSpacing: 0.5 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 36, textAlign: 'center' },

  dots: { flexDirection: 'row', gap: 18, marginBottom: 12 },
  dot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: '#2563EB', backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: '#2563EB' },

  attemptsText: { fontSize: 13, color: '#DC2626', fontWeight: '500', marginBottom: 16 },

  numpad: {
    flexDirection: 'row', flexWrap: 'wrap',
    width: 288, gap: 12,
    justifyContent: 'center', marginTop: 20,
  },
  key: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  keyEmpty: { width: 84, height: 84 },
  keyDisabled: { opacity: 0.3 },
  keyText: { fontSize: 26, fontWeight: '600', color: '#111827' },
  backspaceText: { fontSize: 22, color: '#6B7280' },

  bioBtn: { marginTop: 32, padding: 14 },
  bioText: { color: '#2563EB', fontSize: 15, fontWeight: '600' },
});
