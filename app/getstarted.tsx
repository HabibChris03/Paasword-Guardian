/**
 * Screen 02 — Welcome / Get Started
 * Shown to first-time users only.
 */
import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { AppLogo } from '../components/ui/AppLogo';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Typography, Spacing, Radius } from '../src/constants/theme';

const FEATURES = [
  {
    icon: 'lock-closed' as const,
    title: 'Zero-Knowledge Encryption',
    desc: 'AES-256 encryption. Only you can read your passwords.',
  },
  {
    icon: 'finger-print' as const,
    title: 'Biometric Unlock',
    desc: 'Face ID or fingerprint for instant secure access.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Breach Monitoring',
    desc: 'Get alerted if your accounts appear in a data breach.',
  },
];

export default function GetStartedScreen() {
  const { C } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      {/* Hero */}
      <View style={styles.hero}>
        <AppLogo size="lg" />
        <Text style={[styles.headline, { color: C.text }]}>
          Password{'\n'}Guardian
        </Text>
        <Text style={[styles.tagline, { color: C.textSecondary }]}>
          Security you can trust. Privacy by design.
        </Text>
      </View>

      {/* Feature cards */}
      <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
        {FEATURES.map((f, i) => (
          <View
            key={f.title}
            style={[
              styles.featureRow,
              i < FEATURES.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.divider },
            ]}
          >
            <View style={[styles.featureIcon, { backgroundColor: C.primaryMuted }]}>
              <Ionicons name={f.icon} size={20} color={C.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: C.text }]}>{f.title}</Text>
              <Text style={[styles.featureDesc, { color: C.textSecondary }]}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.footer}>
        <Text style={[styles.disclaimer, { color: C.textTertiary }]}>
          Your master password is the only key to your vault.{'\n'}We never store it — not even on your device.
        </Text>
        <PrimaryButton
          title="Create New Vault"
          onPress={() => router.push('/auth/masterpassword')}
        />
        <TouchableOpacity
          onPress={() => router.push('/auth/login')}
          style={styles.secondaryLink}
          accessibilityRole="button"
        >
          <Text style={[styles.secondaryLinkText, { color: C.primary }]}>
            I already have a vault
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  headline: {
    fontSize: Typography.size.displayLg,
    fontWeight: Typography.weight.extrabold,
    textAlign: 'center',
    lineHeight: 38,
    marginTop: Spacing.md,
  },
  tagline: {
    fontSize: Typography.size.body,
    textAlign: 'center',
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    marginHorizontal: Spacing.base,
    overflow: 'hidden',
  },
  featureRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
  },
  featureIcon: {
    alignItems: 'center',
    borderRadius: Radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: Typography.size.bodyLg,
    fontWeight: Typography.weight.bold,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: Typography.size.sm,
    lineHeight: 18,
  },
  footer: {
    gap: Spacing.md,
    marginTop: 'auto',
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
  },
  disclaimer: {
    fontSize: Typography.size.xs,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: Spacing.xs,
  },
  secondaryLink: {
    alignItems: 'center',
    padding: Spacing.sm,
  },
  secondaryLinkText: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.bold,
  },
});
