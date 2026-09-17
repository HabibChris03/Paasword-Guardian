/**
 * Screen 19 — Create Encrypted Backup
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../hooks/useTheme';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecurityAlert } from '../../components/ui/SecurityAlert';
import { useVaultContext } from '../../src/context/vault-context';
import { BackupService } from '../../src/services/backup-service';
import { formatDate, formatBytes } from '../../src/utils/format';
import { Typography, Spacing, Radius, Shadows } from '../../src/constants/theme';
import type { BackupMetadata } from '../../src/types/models';

export default function BackupScreen() {
  const { C } = useTheme();
  const router = useRouter();
  const { vaultKey } = useVaultContext();
  const [lastBackup,  setLastBackup]  = useState<BackupMetadata | null>(null);
  const [backing,     setBacking]     = useState(false);
  const [backupUri,   setBackupUri]   = useState<string | null>(null);

  const load = useCallback(async () => {
    const b = await BackupService.getLatestBackup();
    setLastBackup(b);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleBackup = async () => {
    if (!vaultKey) {
      Alert.alert('Error', 'Vault is not unlocked.');
      return;
    }
    setBacking(true);
    try {
      const { uri, metadata } = await BackupService.createBackup(vaultKey);
      setLastBackup(metadata);
      setBackupUri(uri);
      Alert.alert('Backup Created', `Successfully backed up ${metadata.credentialCount} passwords.`);
    } catch (e: any) {
      Alert.alert('Backup Failed', e.message ?? 'Unable to create backup.');
    } finally {
      setBacking(false);
    }
  };

  const handleShare = async () => {
    if (!backupUri) return;
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Sharing Not Available', 'File sharing is not available on this device.');
      return;
    }
    await Sharing.shareAsync(backupUri, {
      mimeType: 'application/octet-stream',
      dialogTitle: 'Save Encrypted Backup',
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.text }]}>Backup Vault</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Encryption info */}
        <SecurityAlert
          variant="success"
          icon="shield-checkmark-outline"
          title="Fully Encrypted"
          message="Your backup is encrypted with AES-256. Even if someone gets the file, they cannot read your passwords without your master password."
        />

        {/* Last backup */}
        {lastBackup && (
          <View style={[styles.infoCard, { backgroundColor: C.surface, borderColor: C.border }, Shadows.card]}>
            <Text style={[styles.infoTitle, { color: C.text }]}>Last Backup</Text>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color={C.textTertiary} />
              <Text style={[styles.infoText, { color: C.textSecondary }]}>
                {formatDate(lastBackup.createdAt)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="key-outline" size={16} color={C.textTertiary} />
              <Text style={[styles.infoText, { color: C.textSecondary }]}>
                {lastBackup.credentialCount} passwords
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="document-outline" size={16} color={C.textTertiary} />
              <Text style={[styles.infoText, { color: C.textSecondary }]}>
                {formatBytes(lastBackup.sizeBytes)}
              </Text>
            </View>
          </View>
        )}

        {/* What's included */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>What's Included</Text>
          {[
            'All passwords and credentials',
            'Usernames and website URLs',
            'Secure notes',
            'Categories and favorites',
          ].map(item => (
            <View key={item} style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={16} color={C.success} />
              <Text style={[styles.bulletText, { color: C.textSecondary }]}>{item}</Text>
            </View>
          ))}
        </View>

        <PrimaryButton
          title={backing ? 'Creating Backup…' : 'Create Encrypted Backup'}
          onPress={handleBackup}
          loading={backing}
          icon={<Ionicons name="cloud-upload-outline" size={18} color="#fff" />}
        />

        {backupUri && (
          <TouchableOpacity
            onPress={handleShare}
            style={[styles.shareBtn, { borderColor: C.primary, backgroundColor: C.primaryMuted }]}
          >
            <Ionicons name="share-outline" size={18} color={C.primary} />
            <Text style={[styles.shareBtnText, { color: C.primary }]}>Share / Save Backup File</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => router.push('/backup/restore')}
          style={styles.restoreLink}
        >
          <Text style={[styles.restoreLinkText, { color: C.primary }]}>
            Restore from a backup file →
          </Text>
        </TouchableOpacity>
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
  infoCard: {
    borderRadius: Radius.card, borderWidth: 1, padding: Spacing.base, gap: Spacing.sm,
  },
  infoTitle: { fontSize: Typography.size.bodyLg, fontWeight: Typography.weight.extrabold },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoText: { fontSize: Typography.size.sm },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.size.bodyLg, fontWeight: Typography.weight.extrabold },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  bulletText: { fontSize: Typography.size.body },
  shareBtn: {
    alignItems: 'center', borderRadius: Radius.button, borderWidth: 1.5,
    flexDirection: 'row', gap: Spacing.sm, height: 54, justifyContent: 'center',
  },
  shareBtnText: { fontSize: Typography.size.body, fontWeight: Typography.weight.bold },
  restoreLink: { alignItems: 'center', padding: Spacing.sm },
  restoreLinkText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold },
});
