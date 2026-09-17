/**
 * Screen 25 — Help & Security Information
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { APP_VERSION } from '../../src/constants/app';
import { Typography, Spacing, Radius } from '../../src/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface FAQItem {
  icon: IoniconName;
  question: string;
  answer: string;
}

const FAQ: FAQItem[] = [
  {
    icon: 'lock-closed-outline',
    question: 'How does encryption work?',
    answer: 'Your vault is protected with AES-256 encryption — the same standard used by governments and banks. Your master password is transformed into an encryption key using PBKDF2 with 100,000 iterations of SHA-256. This key encrypts a randomly-generated Vault Encryption Key (VEK), which in turn encrypts each of your passwords individually.',
  },
  {
    icon: 'eye-off-outline',
    question: 'What is "zero-knowledge" encryption?',
    answer: 'Zero-knowledge means that even Password Guardian\'s developers cannot see your passwords. Your master password never leaves your device. All encryption and decryption happens locally. We only store (if you sync) an encrypted blob that cannot be deciphered without your master password.',
  },
  {
    icon: 'help-circle-outline',
    question: 'What if I forget my master password?',
    answer: 'Unfortunately, your master password cannot be recovered — this is by design. Without your master password, your vault cannot be decrypted. This is the fundamental guarantee of zero-knowledge encryption. We strongly recommend:\n• Writing down your master password and storing it in a secure physical location\n• Creating encrypted backups regularly\n• Using a memorable passphrase instead of a random password',
  },
  {
    icon: 'cloud-upload-outline',
    question: 'How do backups work?',
    answer: 'When you create a backup, your entire vault is exported in an encrypted format (.pgb file). The backup is encrypted with the same AES-256 encryption as your vault. Anyone who gets the backup file still cannot read it without your master password. Store backups securely — on cloud storage, a USB drive, or email them to yourself.',
  },
  {
    icon: 'shield-half-outline',
    question: 'What is breach monitoring?',
    answer: 'Breach monitoring checks if your accounts appear in known data breaches. We use a privacy-preserving technique called k-anonymity: only a small portion of a hash (not your actual email or password) is sent to our server. The full matching happens on your device. Your actual passwords and emails are never transmitted.',
  },
  {
    icon: 'finger-print',
    question: 'How does biometric unlock work?',
    answer: 'When biometrics are enabled, your device authenticates you (Face ID or fingerprint) using the secure enclave — hardware separate from the app. Biometric data never leaves your device. After successful biometric authentication, the vault can be unlocked without typing your master password. Your master password remains the ultimate key — biometrics are a convenience layer.',
  },
  {
    icon: 'clipboard-outline',
    question: 'Why does the clipboard clear automatically?',
    answer: 'Clipboard data can be accessed by other apps. When you copy a password, a timer starts (default: 30 seconds). After this period, your password is automatically cleared from the clipboard. You can adjust this duration in Security Settings.',
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const { C } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.accordion, { backgroundColor: C.surface, borderColor: C.border }]}>
      <TouchableOpacity
        onPress={() => setOpen(o => !o)}
        style={styles.accordionHeader}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={[styles.accordionIcon, { backgroundColor: C.primaryMuted }]}>
          <Ionicons name={item.icon} size={18} color={C.primary} />
        </View>
        <Text style={[styles.accordionQ, { color: C.text }]}>{item.question}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={C.textTertiary} />
      </TouchableOpacity>
      {open && (
        <Text style={[styles.accordionA, { color: C.textSecondary }]}>{item.answer}</Text>
      )}
    </View>
  );
}

export default function HelpScreen() {
  const { C } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.text }]}>Help & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={[styles.heroCard, { backgroundColor: C.primaryMuted, borderRadius: Radius.card }]}>
          <Ionicons name="shield-checkmark" size={36} color={C.primary} />
          <Text style={[styles.heroTitle, { color: C.text }]}>Your Security Matters</Text>
          <Text style={[styles.heroDesc, { color: C.textSecondary }]}>
            Password Guardian is built on the principle that only you should be able to read your passwords — not us, not anyone else.
          </Text>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Frequently Asked Questions</Text>
          {FAQ.map(item => (
            <FAQAccordion key={item.question} item={item} />
          ))}
        </View>

        {/* Best practices */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Security Best Practices</Text>
          {[
            { icon: 'key-outline' as const,              tip: 'Use a strong, unique master password of at least 12 characters' },
            { icon: 'lock-closed-outline' as const,      tip: 'Enable auto-lock to protect your vault when not in use' },
            { icon: 'cloud-upload-outline' as const,     tip: 'Create regular encrypted backups and store them securely' },
            { icon: 'shield-half-outline' as const,      tip: 'Run breach scans regularly to detect compromised accounts' },
            { icon: 'refresh-circle-outline' as const,   tip: 'Update weak and old passwords using the password generator' },
            { icon: 'phone-portrait-outline' as const,   tip: 'Enable 2FA on your most important accounts when possible' },
          ].map(p => (
            <View key={p.tip} style={[styles.tipRow, { backgroundColor: C.surface, borderColor: C.border }]}>
              <View style={[styles.tipIcon, { backgroundColor: C.primaryMuted }]}>
                <Ionicons name={p.icon} size={16} color={C.primary} />
              </View>
              <Text style={[styles.tipText, { color: C.textSecondary }]}>{p.tip}</Text>
            </View>
          ))}
        </View>

        {/* Version */}
        <Text style={[styles.version, { color: C.textTertiary }]}>
          Password Guardian v{APP_VERSION}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    alignItems: 'center', flexDirection: 'row',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
  },
  backBtn: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  title: { flex: 1, fontSize: Typography.size.subtitle, fontWeight: Typography.weight.extrabold, textAlign: 'center' },
  content: { paddingHorizontal: Spacing.base, paddingBottom: 60, gap: Spacing.xl },
  heroCard: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.xl },
  heroTitle: { fontSize: Typography.size.headingLg, fontWeight: Typography.weight.extrabold, textAlign: 'center' },
  heroDesc: { fontSize: Typography.size.body, lineHeight: 22, textAlign: 'center' },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.size.bodyLg, fontWeight: Typography.weight.extrabold },
  accordion: {
    borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden',
  },
  accordionHeader: {
    alignItems: 'center', flexDirection: 'row',
    gap: Spacing.sm, padding: Spacing.md,
  },
  accordionIcon: {
    alignItems: 'center', borderRadius: Radius.sm,
    height: 32, justifyContent: 'center', width: 32, flexShrink: 0,
  },
  accordionQ: { flex: 1, fontSize: Typography.size.body, fontWeight: Typography.weight.semibold },
  accordionA: {
    fontSize: Typography.size.sm, lineHeight: 20,
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
  },
  tipRow: {
    alignItems: 'flex-start', borderRadius: Radius.md, borderWidth: 1,
    flexDirection: 'row', gap: Spacing.md, padding: Spacing.md,
  },
  tipIcon: {
    alignItems: 'center', borderRadius: Radius.sm, flexShrink: 0,
    height: 30, justifyContent: 'center', width: 30,
  },
  tipText: { flex: 1, fontSize: Typography.size.sm, lineHeight: 18, paddingTop: 4 },
  version: { fontSize: Typography.size.xs, textAlign: 'center' },
});
