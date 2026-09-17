/**
 * Screen 03 — Create Master Password
 * Full setup flow with strength meter, tips, and confirmation.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { PasswordStrengthMeter } from '../../components/ui/PasswordStrengthMeter';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecurityAlert } from '../../components/ui/SecurityAlert';
import { AppLogo } from '../../components/ui/AppLogo';
import { useVaultContext } from '../../src/context/vault-context';
import AuthService from '../../src/services/auth-service';
import { validateMasterPassword, validatePasswordsMatch } from '../../src/utils/validation';
import { Typography, Spacing, Radius } from '../../src/constants/theme';

const TIPS = [
  { icon: 'sparkles-outline' as const, text: 'Use a passphrase: 3+ random words + symbols' },
  { icon: 'close-circle-outline' as const, text: 'Avoid names, birthdays, and common words' },
  { icon: 'shuffle-outline' as const, text: 'Mix uppercase, lowercase, numbers, and symbols' },
  { icon: 'document-lock-outline' as const, text: 'Write it down and store it safely offline' },
];

export default function MasterPasswordScreen() {
  const { C } = useTheme();
  const router = useRouter();
  const { unlock } = useVaultContext();

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState<{ password?: string; confirm?: string }>({});

  const validate = useCallback(() => {
    const errs: typeof errors = {};
    const { valid, errors: pwdErrors } = validateMasterPassword(password);
    if (!valid) errs.password = pwdErrors[0];
    if (!validatePasswordsMatch(password, confirm)) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [password, confirm]);

  const handleCreate = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const vaultKey = await AuthService.createVault(password);
      unlock(vaultKey);
      router.replace('/auth/biometric-setup');
    } catch (e: any) {
      console.error('Failed to create vault:', e);
      Alert.alert(
        'Error',
        e?.message ? `Unable to create vault: ${e.message}` : 'Unable to create your vault. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [password, validate, unlock, router]);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: C.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View style={styles.hero}>
            <AppLogo size="md" />
            <Text style={[styles.title, { color: C.text }]}>Secure Your Vault</Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>
              Create a strong master password. This is the only key to your vault — we cannot recover it.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <PasswordInput
              label="Master Password"
              placeholder="At least 10 characters"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={C.textTertiary} />}
            />
            {password.length > 0 && (
              <PasswordStrengthMeter password={password} />
            )}

            <PasswordInput
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={confirm}
              onChangeText={setConfirm}
              error={errors.confirm}
              leftIcon={<Ionicons name="checkmark-circle-outline" size={18} color={C.textTertiary} />}
            />
          </View>

          {/* Security tips */}
          <View style={[styles.tipsCard, { backgroundColor: C.primarySurface, borderColor: C.border }]}>
            <Text style={[styles.tipsTitle, { color: C.text }]}>Tips for a Strong Password</Text>
            {TIPS.map(tip => (
              <View key={tip.text} style={styles.tipRow}>
                <Ionicons name={tip.icon} size={16} color={C.primary} />
                <Text style={[styles.tipText, { color: C.textSecondary }]}>{tip.text}</Text>
              </View>
            ))}
          </View>

          <SecurityAlert
            variant="info"
            icon="information-circle-outline"
            title="Zero-Knowledge Encryption"
            message="Your master password is never sent to any server. It exists only on your device."
          />

          <PrimaryButton
            title="Create Vault"
            onPress={handleCreate}
            loading={loading}
            style={styles.cta}
          />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
  backBtn: {
    alignItems: 'center', justifyContent: 'center',
    height: 40, width: 40,
  },
  scroll: { paddingBottom: 60, gap: Spacing.lg, paddingHorizontal: Spacing.base },
  hero: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.md },
  title: { fontSize: Typography.size.headingLg, fontWeight: Typography.weight.extrabold, textAlign: 'center' },
  subtitle: { fontSize: Typography.size.body, textAlign: 'center', lineHeight: 22 },
  form: { gap: Spacing.base },
  tipsCard: {
    borderRadius: Radius.card, borderWidth: 1,
    padding: Spacing.base, gap: Spacing.sm,
  },
  tipsTitle: { fontSize: Typography.size.bodyLg, fontWeight: Typography.weight.bold, marginBottom: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  tipText: { flex: 1, fontSize: Typography.size.sm, lineHeight: 18 },
  cta: { marginTop: Spacing.sm },
});
