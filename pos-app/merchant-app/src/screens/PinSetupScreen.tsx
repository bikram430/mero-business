import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import { t } from '../i18n/strings';

type Props = { navigation: NativeStackNavigationProp<any> };
type Step = 'create' | 'confirm';

export default function PinSetupScreen({ navigation }: Props) {
  const lang = useStore((s) => s.lang);
  const [step, setStep] = useState<Step>('create');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');

  function handleDigit(digit: string) {
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length >= 4) {
      if (step === 'create') {
        setFirstPin(newPin);
        setPin('');
        setStep('confirm');
      } else {
        handleConfirm(newPin);
      }
    }
  }

  async function handleConfirm(confirmPin: string) {
    if (confirmPin !== firstPin) {
      Vibration.vibrate(300);
      Alert.alert(t(lang, 'pinMismatch'), '', [{ text: 'OK' }]);
      setFirstPin('');
      setPin('');
      setStep('create');
      return;
    }
    await SecureStore.setItemAsync('merchant_pin', confirmPin);
    navigation.replace('Main');
  }

  function handleSkip() {
    Alert.alert(
      t(lang, 'skipPin'),
      t(lang, 'skipWarning'),
      [
        { text: t(lang, 'setPin'), style: 'cancel' },
        { text: t(lang, 'skip'), style: 'destructive', onPress: () => navigation.replace('Main') },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.inner}>
        <Text style={styles.appName}>Mero Business</Text>

        <Text style={styles.title}>
          {step === 'create' ? t(lang, 'setupPin') : t(lang, 'confirmPin')}
        </Text>
        <Text style={styles.sub}>
          {step === 'create' ? t(lang, 'pinSetupSub') : t(lang, 'pinConfirmSub')}
        </Text>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepActive]} />
          <View style={[styles.stepDot, step === 'confirm' && styles.stepActive]} />
        </View>

        {/* PIN dots */}
        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
          ))}
        </View>

        {/* Numpad */}
        <View style={styles.numpad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'].map((key, idx) => {
            if (key === '') return <View key={idx} style={styles.keyEmpty} />;
            const isBackspace = key === '←';
            return (
              <TouchableOpacity
                key={idx}
                style={styles.key}
                onPress={() => isBackspace ? setPin((p) => p.slice(0, -1)) : handleDigit(key)}
                activeOpacity={0.6}
              >
                <Text style={[styles.keyText, isBackspace && styles.backspaceText]}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>{t(lang, 'skipPin')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  appName: { fontSize: 16, fontWeight: '700', color: '#9CA3AF', marginBottom: 8, letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20, maxWidth: 280 },

  stepRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  stepDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB',
  },
  stepActive: { backgroundColor: '#2563EB' },

  dots: { flexDirection: 'row', gap: 18, marginBottom: 32 },
  dot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: '#2563EB', backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: '#2563EB' },

  numpad: {
    flexDirection: 'row', flexWrap: 'wrap',
    width: 288, gap: 12,
    justifyContent: 'center',
  },
  key: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  keyEmpty: { width: 84, height: 84 },
  keyText: { fontSize: 26, fontWeight: '600', color: '#111827' },
  backspaceText: { fontSize: 22, color: '#6B7280' },

  skipBtn: { marginTop: 32, padding: 14 },
  skipText: { color: '#9CA3AF', fontSize: 14 },
});
