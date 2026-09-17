import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../hooks/useTheme';
import { VaultService } from '../../../src/services/vault-service';
import { useVaultContext } from '../../../src/context/vault-context';
import { Typography, Spacing, Radius, Shadows, CategoryColors, CategoryIcons } from '../../../src/constants/theme';
import { validateCredentialForm, type CredentialValidationErrors } from '../../../src/utils/validation';
import type { Credential, CredentialCategory } from '../../../src/types/models';

import PrimaryButton from '../../../components/ui/PrimaryButton';
import DangerButton from '../../../components/ui/DangerButton';
import PasswordStrengthMeter from '../../../components/ui/PasswordStrengthMeter';
import PasswordInput from '../../../components/ui/PasswordInput';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

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

export default function EditCredentialScreen() {
  const router = useRouter();
  const { id, generatedPassword } = useLocalSearchParams<{ id: string; generatedPassword?: string }>();
  const { C } = useTheme();
  const { vaultKey } = useVaultContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [credential, setCredential] = useState<Credential | null>(null);

  const [title, setTitle] = useState('');
  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<CredentialCategory>('other');

  const [errors, setErrors] = useState<CredentialValidationErrors>({});
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const loadCredential = useCallback(async () => {
    if (!id || !vaultKey) return;
    try {
      setLoading(true);
      const cred = await VaultService.getCredential(id);
      if (cred) {
        setCredential(cred);
        setTitle(cred.title);
        setWebsite(cred.website || '');
        setUsername(cred.username);
        setCategory(cred.categoryId);

        const dec = await VaultService.decryptCredential(cred, vaultKey);
        if (dec) {
          setPassword(dec.password);
          setNotes(dec.notes || '');
        }
      }
    } catch (error) {
      console.error('Failed to load credential for editing:', error);
      Alert.alert('Error', 'Failed to load details for editing.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, vaultKey, router]);

  useEffect(() => {
    loadCredential();
  }, [loadCredential]);

  useEffect(() => {
    if (generatedPassword) {
      setPassword(generatedPassword);
    }
  }, [generatedPassword]);

  const handleSave = async () => {
    const errs = validateCredentialForm({ title, username, password, website });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!id || !vaultKey) {
      Alert.alert('Error', 'Vault is locked.');
      return;
    }

    setSaving(true);
    try {
      await VaultService.updateCredential(
        id,
        {
          title,
          website,
          username,
          password,
          notes,
          categoryId: category,
        },
        vaultKey,
      );
      router.back();
    } catch (error) {
      console.error('Failed to update credential:', error);
      Alert.alert('Error', 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await VaultService.deleteCredential(id);
      setDeleteModalVisible(false);
      // Go back to the vault list
      router.replace('/(tabs)/vault');
    } catch (error) {
      console.error('Failed to delete credential:', error);
      Alert.alert('Error', 'Failed to delete credential.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={[styles.loadingText, { color: C.textSecondary }]}>Loading for editing...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={[styles.title, { color: C.text }]}>Edit Password</Text>
          <TouchableOpacity style={styles.saveButtonHeader} onPress={handleSave} disabled={saving}>
            <Text style={[styles.saveButtonText, { color: C.primary }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
                  onPress={() => router.push({ pathname: '/vault/generator', params: { fromMode: 'edit' } } as any)}
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

          {/* Action Buttons */}
          <View style={styles.buttonStack}>
            <PrimaryButton
              title="Save Changes"
              onPress={handleSave}
              loading={saving}
            />
            <DangerButton
              title="Delete Password"
              onPress={() => setDeleteModalVisible(true)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete Password"
        message={`Are you sure you want to delete "${title}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.size.body,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.base,
    paddingBottom: Spacing.xxxl,
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
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.size.bodyLg,
    fontWeight: Typography.weight.bold,
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
  buttonStack: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
});
