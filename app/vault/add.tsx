import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useTheme } from '../../hooks/useTheme';
import { VaultService } from '../../src/services/vault-service';
import { useVaultContext } from '../../src/context/vault-context';
import { Typography, Spacing, Radius, Shadows, CategoryColors, CategoryIcons } from '../../src/constants/theme';
import { validateCredentialForm, type CredentialValidationErrors } from '../../src/utils/validation';
import { faviconUrl } from '../../src/utils/format';
import type { CredentialCategory } from '../../src/types/models';
import TotpService from '../../src/crypto/totp-service';

import PrimaryButton from '../../components/ui/PrimaryButton';
import PasswordStrengthMeter from '../../components/ui/PasswordStrengthMeter';
import PasswordInput from '../../components/ui/PasswordInput';

const CATEGORIES: { id: CredentialCategory; label: string }[] = [
  { id: 'social', label: 'Social' },
  { id: 'banking', label: 'Banking' },
  { id: 'work', label: 'Work' },
  { id: 'email', label: 'Email' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'development', label: 'Dev' },
  { id: 'other', label: 'Other' },
];

const QUICK_PICKS: { title: string; website: string; domain: string; category: CredentialCategory }[] = [
  { title: 'Google', website: 'https://accounts.google.com', domain: 'google.com', category: 'email' },
  { title: 'GitHub', website: 'https://github.com', domain: 'github.com', category: 'development' },
  { title: 'Netflix', website: 'https://netflix.com', domain: 'netflix.com', category: 'entertainment' },
  { title: 'Instagram', website: 'https://instagram.com', domain: 'instagram.com', category: 'social' },
  { title: 'Amazon', website: 'https://amazon.com', domain: 'amazon.com', category: 'shopping' },
  { title: 'LinkedIn', website: 'https://linkedin.com', domain: 'linkedin.com', category: 'social' },
  { title: 'Slack', website: 'https://slack.com', domain: 'slack.com', category: 'work' },
];

export default function AddCredentialScreen() {
  const router = useRouter();
  const { generatedPassword } = useLocalSearchParams<{ generatedPassword?: string }>();
  const { C } = useTheme();
  const { vaultKey } = useVaultContext();

  const [title, setTitle] = useState('');
  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [category, setCategory] = useState<CredentialCategory>('other');

  const [errors, setErrors] = useState<CredentialValidationErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (generatedPassword) {
      setPassword(generatedPassword);
    }
  }, [generatedPassword]);

  const handleQuickPick = (item: typeof QUICK_PICKS[0]) => {
    setTitle(item.title);
    setWebsite(item.website);
    setCategory(item.category);
  };

  const handleSave = async () => {
    const errs = validateCredentialForm({ title, username, password, website });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (totpSecret.trim() && !TotpService.isValidSecret(totpSecret.trim())) {
      Alert.alert('Invalid 2FA Secret', 'The authenticator key must be a valid Base32 string (letters A-Z and digits 2-7).');
      return;
    }

    if (!vaultKey) {
      Alert.alert('Error', 'Vault is locked. Please unlock first.');
      return;
    }

    setSaving(true);
    try {
      await VaultService.createCredential(
        {
          title,
          website,
          username,
          password,
          notes,
          totpSecret: totpSecret.trim() || undefined,
          categoryId: category,
          tags: [],
        },
        vaultKey,
      );
      router.back();
    } catch (error) {
      console.error('Failed to create credential:', error);
      Alert.alert('Error', 'Failed to save password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: C.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: C.text }]}>Add Password</Text>
          <TouchableOpacity style={styles.saveButtonHeader} onPress={handleSave} disabled={saving}>
            <Text style={[styles.saveButtonText, { color: C.primary }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Quick Picks */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Quick Select</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPicksScroll}>
              {QUICK_PICKS.map((item) => (
                <TouchableOpacity
                  key={item.title}
                  style={[styles.quickPickCard, { backgroundColor: C.surface, borderColor: C.border }]}
                  onPress={() => handleQuickPick(item)}
                >
                  <Image source={{ uri: faviconUrl(item.domain, 48) }} style={styles.quickPickFavicon} contentFit="contain" />
                  <Text style={[styles.quickPickText, { color: C.text }]}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }, Shadows.sm]}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: C.textSecondary }]}>Account / Service Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: C.text, borderColor: errors.title ? C.danger : C.border, backgroundColor: C.surfaceSecondary },
                ]}
                placeholder="e.g. Google, GitHub, Chase"
                placeholderTextColor={C.textTertiary}
                value={title}
                onChangeText={setTitle}
              />
              {errors.title && <Text style={[styles.errorText, { color: C.danger }]}>{errors.title}</Text>}
            </View>

            {/* Website */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: C.textSecondary }]}>Website URL</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: C.text, borderColor: errors.website ? C.danger : C.border, backgroundColor: C.surfaceSecondary },
                ]}
                placeholder="https://..."
                placeholderTextColor={C.textTertiary}
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
                keyboardType="url"
              />
              {errors.website && <Text style={[styles.errorText, { color: C.danger }]}>{errors.website}</Text>}
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: C.textSecondary }]}>Username / Email *</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: C.text, borderColor: errors.username ? C.danger : C.border, backgroundColor: C.surfaceSecondary },
                ]}
                placeholder="username@example.com"
                placeholderTextColor={C.textTertiary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              {errors.username && <Text style={[styles.errorText, { color: C.danger }]}>{errors.username}</Text>}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={[styles.label, { color: C.textSecondary }]}>Password *</Text>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={() => router.push({ pathname: '/vault/generator', params: { fromMode: 'add' } } as any)}
                >
                  <Ionicons name="dice-outline" size={16} color={C.primary} />
                  <Text style={[styles.generateText, { color: C.primary }]}>Generate</Text>
                </TouchableOpacity>
              </View>

              <PasswordInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter or generate password"
                error={errors.password}
              />

              {password.length > 0 && (
                <View style={styles.strengthMeterContainer}>
                  <PasswordStrengthMeter password={password} />
                </View>
              )}
            </View>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Category</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                const catColor = CategoryColors[cat.id] || C.primary;
                const catIcon = CategoryIcons[cat.id] || 'key-outline';
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? catColor : C.surface,
                        borderColor: isSelected ? catColor : C.border,
                      },
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Ionicons
                      name={catIcon as any}
                      size={16}
                      color={isSelected ? '#FFF' : catColor}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: isSelected ? '#FFF' : C.text },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2FA / TOTP Authenticator Key */}
          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }, Shadows.sm]}>
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 }}>
                <Ionicons name="shield-checkmark-outline" size={16} color={C.primary} />
                <Text style={[styles.label, { color: C.textSecondary, marginBottom: 0 }]}>2FA / Authenticator Key (Optional)</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  { color: C.text, borderColor: C.border, backgroundColor: C.surfaceSecondary },
                ]}
                placeholder="e.g. JBSWY3DPEHPK3PXP"
                placeholderTextColor={C.textTertiary}
                value={totpSecret}
                onChangeText={setTotpSecret}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Text style={{ fontSize: Typography.size.xs, color: C.textTertiary, marginTop: 4 }}>
                Enter the setup key provided by the website to generate 6-digit verification codes.
              </Text>
            </View>
          </View>

          {/* Notes */}
          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }, Shadows.sm]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: C.textSecondary }]}>Secure Notes (Optional)</Text>
              <TextInput
                style={[
                  styles.textArea,
                  { color: C.text, borderColor: C.border, backgroundColor: C.surfaceSecondary },
                ]}
                placeholder="Recovery codes, security questions, notes..."
                placeholderTextColor={C.textTertiary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Submit */}
          <PrimaryButton
            title="Save Password"
            onPress={handleSave}
            loading={saving}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
  },
  saveButtonHeader: {
    padding: Spacing.xs,
  },
  saveButtonText: {
    fontSize: Typography.size.bodyLg,
    fontWeight: Typography.weight.bold,
  },
  title: {
    fontSize: Typography.size.subtitle,
    fontWeight: Typography.weight.bold,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.size.bodyLg,
    fontWeight: Typography.weight.bold,
  },
  quickPicksScroll: {
    gap: Spacing.sm,
  },
  quickPickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  quickPickFavicon: {
    width: 20,
    height: 20,
  },
  quickPickText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  input: {
    fontFamily: Typography.fontFamilyInput,
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.size.body,
  },
  textArea: {
    fontFamily: Typography.fontFamilyInput,
    minHeight: 100,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Typography.size.body,
  },
  errorText: {
    fontSize: Typography.size.xs,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  generateText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  strengthMeterContainer: {
    marginTop: Spacing.xs,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
});
