/**
 * Screen 05 — Biometric Setup (optional, post-vault-creation)
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import AuthService from '../../src/services/auth-service';
import SettingsService from '../../src/services/settings-service';
import { Typography, Spacing, Radius } from '../../src/constants/theme';

export default function BiometricSetupScreen() {
  const { C } = useTheme();
  const router = useRouter();
  const [available, setAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face' | 'iris' | 'none'>('none');
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    AuthService.isBiometricAvailable().then(setAvailable);
    AuthService.getBiometricType().then(setBiometricType);
  }, []);

  const handleEnable = async () => {
    setEnabling(true);
    const success = await AuthService.authenticateWithBiometrics('Test your biometrics');
    if (success) {
      await SettingsService.updateSettings({ biometricEnabled: true, biometricSetupComplete: true });
      router.replace('/(tabs)');
    }
    setEnabling(false);
  };

  const handleSkip = async () => {
    await SettingsService.updateSettings({ biometricSetupComplete: true });
    router.replace('/(tabs)');
  };

  const biometricLabel = biometricType === 'face' ? 'Face ID' : biometricType === 'iris' ? 'Iris Scan' : 'Fingerprint';
  const biometricIcon  = biometricType === 'face' ? 'scan-outline' : 'finger-print';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: C.primaryMuted }]}>
          <Ionicons name={biometricIcon} size={52} color={C.primary} />
        </View>

        <Text style={[styles.title, { color: C.text }]}>
          {available ? `Enable ${biometricLabel}` : 'Biometrics Not Available'}
        </Text>
        <Text style={[styles.subtitle, { color: C.textSecondary }]}>
          {available
            ? `Use ${biometricLabel} for quick, secure access to your vault without entering your master password each time.`
            : 'Your device does not support biometric authentication. You can set this up later in Settings if you add biometrics to your device.'}
        </Text>

        {available && (
          <View style={[styles.infoCard, { backgroundColor: C.surfaceSecondary, borderRadius: Radius.lg }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={C.primary} />
            <Text style={[styles.infoText, { color: C.textSecondary }]}>
              Biometrics never leave your device. Your master password remains the ultimate key.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {available ? (
          <>
            <PrimaryButton
              title={`Enable ${biometricLabel}`}
              onPress={handleEnable}
              loading={enabling}
              icon={<Ionicons name={biometricIcon} size={18} color="#fff" />}
            />
            <SecondaryButton
              title="Skip for Now"
              onPress={handleSkip}
            />
          </>
        ) : (
          <PrimaryButton
            title="Continue to Vault"
            onPress={handleSkip}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl, gap: Spacing.base,
  },
  iconWrap: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 60, width: 120, height: 120,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.size.heading,
    fontWeight: Typography.weight.extrabold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.size.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: Spacing.sm, padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  infoText: {
    flex: 1, fontSize: Typography.size.sm, lineHeight: 18,
  },
  actions: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
});
