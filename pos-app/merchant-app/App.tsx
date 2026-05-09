import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Network from 'expo-network';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainerRef } from '@react-navigation/native';

import AppNavigator from './src/navigation/AppNavigator';
import { initOfflineDB } from './src/db/offline';
import { useStore } from './src/store/useStore';
import { Lang } from './src/i18n/strings';

// Auto-lock after 2 minutes in background (PDF security requirement)
const AUTO_LOCK_MS = 2 * 60 * 1000;

export default function App() {
  const setOnline = useStore((s) => s.setOnline);
  const setLang = useStore((s) => s.setLang);
  const setRole = useStore((s) => s.setRole);
  const navRef = useRef<NavigationContainerRef<any>>(null);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    initOfflineDB();

    async function restoreSession() {
      const [lang, role, token] = await Promise.all([
        SecureStore.getItemAsync('app_language'),
        SecureStore.getItemAsync('app_role'),
        SecureStore.getItemAsync('access_token'),
      ]);

      if (lang) setLang(lang as Lang);
      if (role) setRole(role as 'merchant' | 'customer');

      if (!navRef.current) return;

      if (role && token) {
        const pin = await SecureStore.getItemAsync('merchant_pin');
        if (pin) {
          navRef.current.reset({ index: 0, routes: [{ name: 'PinLock' }] });
        } else {
          navRef.current.reset({
            index: 0,
            routes: [{ name: role === 'merchant' ? 'Main' : 'CustomerMain' }],
          });
        }
      }
      // No role or no token → stays at "Role" screen (initial route)
      // Logout clears both role and token so this path is always clean
    }

    restoreSession();

    // Auto-lock when app returns from background after AUTO_LOCK_MS
    const handleAppState = async (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAt.current = Date.now();
      } else if (nextState === 'active' && backgroundedAt.current !== null) {
        const elapsed = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (elapsed >= AUTO_LOCK_MS) {
          const [token, pin] = await Promise.all([
            SecureStore.getItemAsync('access_token'),
            SecureStore.getItemAsync('merchant_pin'),
          ]);
          if (token && pin && navRef.current) {
            navRef.current.navigate('PinLock');
          }
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);

    const checkNetwork = async () => {
      const state = await Network.getNetworkStateAsync();
      setOnline(state.isConnected ?? false);
    };
    checkNetwork();
    const interval = setInterval(checkNetwork, 5000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, []);

  return <AppNavigator ref={navRef} />;
}
