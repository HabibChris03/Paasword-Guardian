/**
 * Screen 06 — Vault Unlock
 * Biometric-first unlock screen with fallback to Master Password.
 * Fingerprint is the primary unlock method unless the user explicitly logged out.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Vibration, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppLogo } from '../../components/ui/AppLogo';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { useVaultContext } from '../../src/context/vault-context';
import AuthService from '../../src/services/auth-service';
import SettingsService from '../../src/services/settings-service';
import { Typography, Spacing, Radius } from '../../src/constants/theme';

export default function LoginScreen() {
  const { C } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ loggedOut?: string }>();
  const isExplicitLogout = params.loggedOut === 'true';

  const { unlock } = useVaultContext();

  const [authMode, setAuthMode] = useState<'biometric' | 'password'>('biometric');
  const [hasBioKey, setHasBioKey] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = useCallback(() => {
    Vibration.vibrate(50);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleBiometric = useCallback(async () => {
    setError('');
    const result = await AuthService.unlockWithBiometrics('Scan fingerprint to unlock Password Guardian');
    if (result.success && result.vaultKey) {
      unlock(result.vaultKey);
      router.replace('/(tabs)');
    } else if (result.error && !result.error.toLowerCase().includes('cancel')) {
      setError(result.error);
    }
  }, [unlock, router]);

  useEffect(() => {
    let active = true;

    async function checkAuthMode() {
      if (isExplicitLogout) {
        setAuthMode('password');
        setHasBioKey(false);
        return;
      }

      const [available, bioKeyExists, settings] = await Promise.all([
        AuthService.isBiometricAvailable(),
        AuthService.hasBiometricKey(),
        SettingsService.getSettings(),
      ]);

      if (!active) return;
      setBiometricAvailable(available);
      setHasBioKey(bioKeyExists);

      if (available && bioKeyExists && settings.biometricEnabled !== false) {
        setAuthMode('biometric');
        // Auto-prompt fingerprint immediately upon landing
        handleBiometric();
      } else {
        setAuthMode('password');
      }
    }

    checkAuthMode();

    return () => {
      active = false;
    };
  }, [isExplicitLogout, handleBiometric]);

  const handlePasswordUnlock = useCallback(async () => {
    if (!password.trim()) {
      setError('Please enter your master password.');
      shake();
      return;
    }
    setLoading(true);
    setError('');
    const result = await AuthService.unlockWithPassword(password);
    setLoading(false);
    if (result.success && result.vaultKey) {
      unlock(result.vaultKey);
      router.replace('/(tabs)');
    } else {
      setAttempts(a => a + 1);
      setError(result.error ?? 'Incorrect password.');
      setPassword('');
      shake();
    }
  }, [password, unlock, router, shake]);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: C.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.inner}>
          {/* Header & Logo */}
          <View style={styles.hero}>
            <AppLogo size="lg" />
            <Text style={[styles.title, { color: C.text }]}>
              {authMode === 'biometric' ? 'Welcome Back' : (isExplicitLogout ? 'Sign In' : 'Unlock Vault')}
            </Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>
              {authMode === 'biometric'
                ? 'Touch the fingerprint sensor to unlock'
                : (isExplicitLogout
                    ? 'You logged out of your vault. Enter your master password to sign in.'
                    : 'Enter your master password to unlock your vault')}
            </Text>
          </View>

          {/* Biometric View */}
          {authMode === 'biometric' ? (
            <View style={styles.biometricContainer}>
              <TouchableOpacity
                style={[
                  styles.fingerprintTouchArea,
                  { backgroundColor: C.primaryMuted, borderColor: C.primaryLight },
                ]}
                activeOpacity={0.8}
                onPress={handleBiometric}
                accessibilityLabel="Touch to scan fingerprint"
              >
                <Ionicons name="finger-print" size={72} color={C.primary} />
              </TouchableOpacity>

              <Text style={[styles.sensorHint, { color: C.textSecondary }]}>
                Touch the sensor or tap above to scan
              </Text>

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: C.dangerLight, borderRadius: Radius.md }]}>
                  <Ionicons name="alert-circle-outline" size={16} color={C.danger} />
                  <Text style={[styles.errorText, { color: C.danger }]}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.actions}>
                <PrimaryButton
                  title="Scan Fingerprint"
                  onPress={handleBiometric}
                  icon={<Ionicons name="finger-print" size={20} color="#fff" />}
                />
                <SecondaryButton
                  title="Use Master Password Instead"
                  onPress={() => {
                    setError('');
                    setAuthMode('password');
                  }}
                  icon={<Ionicons name="lock-closed-outline" size={18} color={C.primary} />}
                />
              </View>
            </View>
          ) : (
            /* Master Password View */
            <View style={styles.passwordContainer}>
              <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>
                <PasswordInput
                  label="Master Password"
                  placeholder="Enter your master password"
                  value={password}
                  onChangeText={text => { setPassword(text); setError(''); }}
                  error={error}
                  returnKeyType="done"
                  onSubmitEditing={handlePasswordUnlock}
                  leftIcon={<Ionicons name="lock-closed-outline" size={18} color={C.textTertiary} />}
                />
                {attempts >= 3 && (
                  <View style={[styles.warningBox, { backgroundColor: C.warningLight, borderRadius: Radius.md }]}>
                    <Ionicons name="warning-outline" size={16} color={C.warning} />
                    <Text style={[styles.warningText, { color: C.warning }]}>
                      Multiple failed attempts. Ensure Caps Lock is off.
                    </Text>
                  </View>
                )}
              </Animated.View>

              <View style={styles.actions}>
                <PrimaryButton
                  title="Unlock Vault"
                  onPress={handlePasswordUnlock}
                  loading={loading}
                  icon={<Ionicons name="lock-open-outline" size={18} color="#fff" />}
                />

                {hasBioKey && biometricAvailable && !isExplicitLogout && (
                  <SecondaryButton
                    title="Unlock with Fingerprint"
                    onPress={() => {
                      setError('');
                      setAuthMode('biometric');
                      handleBiometric();
                    }}
                    icon={<Ionicons name="finger-print" size={18} color={C.primary} />}
                  />
                )}
              </View>
            </View>
          )}

          {/* Forgot / help link */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push('/help/index')}
            accessibilityLabel="Help"
          >
            <Text style={[styles.forgotText, { color: C.textTertiary }]}>
              Forgot your password?
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.size.heading,
    fontWeight: Typography.weight.extrabold,
    fontFamily: Typography.fontFamilyBold,
  },
  subtitle: {
    fontSize: Typography.size.body,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Typography.fontFamily,
    paddingHorizontal: Spacing.md,
  },
  biometricContainer: {
    alignItems: 'center',
    gap: Spacing.lg,
    width: '100%',
  },
  fingerprintTouchArea: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  sensorHint: {
    fontSize: Typography.size.body,
    fontFamily: Typography.fontFamilyMedium,
  },
  passwordContainer: {
    gap: Spacing.lg,
    width: '100%',
  },
  form: {
    gap: Spacing.md,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    width: '100%',
  },
  errorText: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
  },
  forgotBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  forgotText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily,
  },
});
