import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';

import { useTheme } from '../../hooks/useTheme';
import { VaultService } from '../../src/services/vault-service';
import { AuthService } from '../../src/services/auth-service';
import { useVaultContext } from '../../src/context/vault-context';
import { Typography, Spacing, Radius, Shadows, CategoryColors, CategoryIcons, getStrengthColor } from '../../src/constants/theme';
import { formatDate, timeAgo, faviconUrl, extractDomain } from '../../src/utils/format';
import type { Credential, DecryptedCredential } from '../../src/types/models';

import PrimaryButton from '../../components/ui/PrimaryButton';
import SecondaryButton from '../../components/ui/SecondaryButton';
import DangerButton from '../../components/ui/DangerButton';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

export default function CredentialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { C, scheme } = useTheme();
  const { vaultKey } = useVaultContext();

  const [credential, setCredential] = useState<Credential | null>(null);
  const [decryptedPassword, setDecryptedPassword] = useState<string>('');
  const [decryptedNotes, setDecryptedNotes] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [clipboardToast, setClipboardToast] = useState<{ visible: boolean; type: 'username' | 'password'; timeLeft: number }>({
    visible: false,
    type: 'username',
    timeLeft: 0,
  });

  const hidePasswordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearClipboardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimeouts = () => {
    if (hidePasswordTimeoutRef.current) clearTimeout(hidePasswordTimeoutRef.current);
    if (clearClipboardTimeoutRef.current) clearTimeout(clearClipboardTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  const loadCredential = useCallback(async () => {
    if (!id || !vaultKey) return;
    try {
      const cred = await VaultService.getCredential(id);
      if (cred) {
        setCredential(cred);

        // Decrypt password and notes
        const dec = await VaultService.decryptCredential(cred, vaultKey);
        if (dec) {
          setDecryptedPassword(dec.password);
          setDecryptedNotes(dec.notes || '');
        }

        setLoading(false);

        // Record access in background without blocking UI
        VaultService.recordAccess(id).catch(() => {});
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load credential:', error);
      Alert.alert('Error', 'Failed to load credential details.');
      router.back();
    }
  }, [id, vaultKey, router]);

  useEffect(() => {
    loadCredential();
    return () => {
      clearTimeouts();
    };
  }, [loadCredential]);

  const handleToggleFavorite = async () => {
    if (!credential) return;
    try {
      const isFav = await VaultService.toggleFavorite(credential.id);
      setCredential(prev => prev ? { ...prev, favorite: isFav } : null);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await VaultService.deleteCredential(id);
      setDeleteModalVisible(false);
      router.back();
    } catch (error) {
      console.error('Failed to delete credential:', error);
      Alert.alert('Error', 'Failed to delete credential.');
    }
  };

  const togglePasswordVisibility = async () => {
    if (!showPassword) {
      // User wants to view/reveal the password: demand fingerprint
      const bioAvailable = await AuthService.isBiometricAvailable();
      if (bioAvailable) {
        const authenticated = await AuthService.authenticateWithBiometrics(
          'Scan your fingerprint to view this password'
        );
        if (!authenticated) {
          return;
        }
      }

      setShowPassword(true);
      if (hidePasswordTimeoutRef.current) clearTimeout(hidePasswordTimeoutRef.current);
      hidePasswordTimeoutRef.current = setTimeout(() => {
        setShowPassword(false);
      }, 15000);
    } else {
      setShowPassword(false);
      if (hidePasswordTimeoutRef.current) clearTimeout(hidePasswordTimeoutRef.current);
    }
  };

  const copyToClipboard = async (text: string, type: 'username' | 'password') => {
    if (type === 'password' && !showPassword) {
      // Also require fingerprint if copying password while it is hidden
      const bioAvailable = await AuthService.isBiometricAvailable();
      if (bioAvailable) {
        const authenticated = await AuthService.authenticateWithBiometrics(
          'Scan your fingerprint to copy this password'
        );
        if (!authenticated) {
          return;
        }
      }
    }

    await Clipboard.setStringAsync(text);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (clearClipboardTimeoutRef.current) clearTimeout(clearClipboardTimeoutRef.current);

    let seconds = 30;
    setClipboardToast({ visible: true, type, timeLeft: seconds });

    countdownIntervalRef.current = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) {
        setClipboardToast({ visible: false, type, timeLeft: 0 });
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      } else {
        setClipboardToast({ visible: true, type, timeLeft: seconds });
      }
    }, 1000);

    clearClipboardTimeoutRef.current = setTimeout(async () => {
      await Clipboard.setStringAsync('');
      setClipboardToast({ visible: false, type, timeLeft: 0 });
    }, 30000);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={[styles.loadingText, { color: C.textSecondary }]}>Decrypting details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!credential) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: C.text }}>Credential not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const catColor = CategoryColors[credential.categoryId] || C.primary;
  const catIcon = CategoryIcons[credential.categoryId] || 'key-outline';
  const strengthColor = getStrengthColor(credential.passwordStrength, scheme);
  const domain = extractDomain(credential.website);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleToggleFavorite}>
            <Ionicons
              name={credential.favorite ? 'star' : 'star-outline'}
              size={24}
              color={credential.favorite ? '#D89B3D' : C.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push(`/vault/edit/${credential.id}` as any)}
          >
            <Ionicons name="create-outline" size={24} color={C.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card Header */}
        <View style={[styles.profileCard, { backgroundColor: C.surface, borderColor: C.border }, Shadows.sm]}>
          <View style={[styles.categoryIconWrap, { backgroundColor: `${catColor}18` }]}>
            {domain ? (
              <Image
                source={{ uri: faviconUrl(domain, 64) }}
                style={styles.favicon}
                contentFit="contain"
              />
            ) : (
              <Ionicons name={catIcon as any} size={32} color={catColor} />
            )}
          </View>
          <Text style={[styles.title, { color: C.text }]}>{credential.title}</Text>
          {credential.website ? (
            <Text style={[styles.website, { color: C.primary }]}>{credential.website}</Text>
          ) : null}

          {/* Strength Badge */}
          <View style={[styles.strengthBadge, { backgroundColor: `${strengthColor}18` }]}>
            <View style={[styles.strengthDot, { backgroundColor: strengthColor }]} />
            <Text style={[styles.strengthText, { color: strengthColor }]}>
              {credential.passwordStrength.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Credentials Info Section */}
        <View style={[styles.sectionCard, { backgroundColor: C.surface, borderColor: C.border }, Shadows.sm]}>
          {/* Username */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={[styles.infoLabel, { color: C.textSecondary }]}>Username / Email</Text>
              <Text style={[styles.infoValue, { color: C.text }]} selectable>
                {credential.username}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: C.surfaceSecondary }]}
              onPress={() => copyToClipboard(credential.username, 'username')}
            >
              <Ionicons name="copy-outline" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: C.divider }]} />

          {/* Password */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={[styles.infoLabel, { color: C.textSecondary }]}>Password</Text>
              <Text style={[styles.infoValue, { color: C.text }]} selectable={showPassword}>
                {showPassword ? decryptedPassword : '••••••••••••••••'}
              </Text>
            </View>
            <View style={styles.passwordControls}>
              <TouchableOpacity
                style={[styles.copyButton, { backgroundColor: C.surfaceSecondary }]}
                onPress={togglePasswordVisibility}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={C.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.copyButton, { backgroundColor: C.surfaceSecondary }]}
                onPress={() => copyToClipboard(decryptedPassword, 'password')}
              >
                <Ionicons name="copy-outline" size={18} color={C.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Auto-hide indicator */}
          {showPassword && (
            <Text style={[styles.autoHideNotice, { color: C.warning }]}>
              Auto-hides in 15 seconds
            </Text>
          )}
        </View>

        {/* Secure Notes Section */}
        {decryptedNotes ? (
          <View style={[styles.sectionCard, { backgroundColor: C.surface, borderColor: C.border }, Shadows.sm]}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Secure Notes</Text>
            <Text style={[styles.notesText, { color: C.textSecondary }]} selectable>
              {decryptedNotes}
            </Text>
          </View>
        ) : null}

        {/* Metadata Section */}
        <View style={[styles.sectionCard, { backgroundColor: C.surface, borderColor: C.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Details</Text>

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: C.textSecondary }]}>Category</Text>
            <Text style={[styles.metaValue, { color: C.text }]}>
              {credential.categoryId.charAt(0).toUpperCase() + credential.categoryId.slice(1)}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: C.divider }]} />

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: C.textSecondary }]}>Last Updated</Text>
            <Text style={[styles.metaValue, { color: C.text }]}>
              {formatDate(credential.updatedAt)}
            </Text>
          </View>

          {credential.lastAccessedAt && (
            <>
              <View style={[styles.divider, { backgroundColor: C.divider }]} />
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: C.textSecondary }]}>Last Accessed</Text>
                <Text style={[styles.metaValue, { color: C.text }]}>
                  {timeAgo(credential.lastAccessedAt)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <SecondaryButton
            title="Edit Password"
            onPress={() => router.push(`/vault/edit/${credential.id}` as any)}
            icon={<Ionicons name="create-outline" size={18} color={C.text} />}
          />
          <DangerButton
            title="Delete Password"
            onPress={() => setDeleteModalVisible(true)}
          />
        </View>
      </ScrollView>

      {/* Floating Clipboard Toast */}
      {clipboardToast.visible && (
        <View style={[styles.toastContainer, { backgroundColor: C.text }, Shadows.md]}>
          <Ionicons name="clipboard" size={18} color={C.surface} />
          <Text style={[styles.toastText, { color: C.surface }]}>
            {clipboardToast.type === 'username' ? 'Username' : 'Password'} copied! Clears in {clipboardToast.timeLeft}s
          </Text>
        </View>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete Password"
        message={`Are you sure you want to permanently delete "${credential.title}"? This cannot be undone.`}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    padding: Spacing.xs,
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
  profileCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryIconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  favicon: {
    width: 36,
    height: 36,
  },
  title: {
    fontSize: Typography.size.heading,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
  },
  website: {
    fontSize: Typography.size.body,
    marginBottom: Spacing.xs,
  },
  strengthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginTop: Spacing.xs,
  },
  strengthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  strengthText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  sectionCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.size.bodyLg,
    fontWeight: Typography.weight.bold,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLeft: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: Typography.size.xs,
  },
  infoValue: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.medium,
  },
  passwordControls: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoHideNotice: {
    fontSize: Typography.size.xs,
    marginTop: -Spacing.xs,
  },
  divider: {
    height: 1,
  },
  notesText: {
    fontSize: Typography.size.body,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: Typography.size.sm,
  },
  metaValue: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  actionButtons: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  toastContainer: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.full,
  },
  toastText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
});
