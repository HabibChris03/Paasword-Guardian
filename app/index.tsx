import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '../src/services/auth-service';
import { SettingsService } from '../src/services/settings-service';
import { useVaultContext } from '../src/context/vault-context';
import { useTheme } from '../hooks/useTheme';

export default function IndexScreen() {
  const router = useRouter();
  const { unlock } = useVaultContext();
  const { C } = useTheme();

  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndRoute() {
      try {
        const hasVault = await AuthService.hasVault();

        if (!hasVault) {
          if (isMounted) {
            router.replace('/getstarted');
          }
          return;
        }

        // A vault exists on this device!
        const settings = await SettingsService.getSettings();
        const bioAvailable = await AuthService.isBiometricAvailable();
        const hasBioKey = await AuthService.hasBiometricKey();

        if (settings.biometricEnabled !== false && bioAvailable && hasBioKey) {
          // Attempt biometric unlock immediately
          const result = await AuthService.unlockWithBiometrics('Scan fingerprint to unlock Password Guardian');
          if (result.success && result.vaultKey) {
            unlock(result.vaultKey);
            if (isMounted) {
              router.replace('/(tabs)');
            }
            return;
          }
        }

        // If biometric disabled or user cancelled, route directly to Login (never Get Started)
        if (isMounted) {
          router.replace('/auth/login');
        }
      } catch {
        if (isMounted) {
          router.replace('/auth/login');
        }
      }
    }

    checkAuthAndRoute();

    return () => {
      isMounted = false;
    };
  }, [router, unlock]);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
