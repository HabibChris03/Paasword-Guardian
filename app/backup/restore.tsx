/**
 * Screen 20 — Restore from Backup
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../hooks/useTheme';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecurityAlert } from '../../components/ui/SecurityAlert';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { useVaultContext } from '../../src/context/vault-context';
import { BackupService } from '../../src/services/backup-service';
import { Typography, Spacing, Radius } from '../../src/constants/theme';

export default function RestoreScreen() {
  const { C } = useTheme();
  const router = useRouter();
  const { vaultKey } = useVaultContext();
  const [selectedUri,  setSelectedUri]  = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [restoring,    setRestoring]    = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  const handlePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        setSelectedUri(result.assets[0].uri);
        setSelectedName(result.assets[0].name ?? 'Backup file');
      }
    } catch {
      Alert.alert('Error', 'Unable to pick file.');
    }
  };

  const handleRestore = async () => {
    setShowConfirm(false);
    if (!selectedUri || !vaultKey) return;
    setRestoring(true);
    try {
      const { count } = await BackupService.restoreFromFile(selectedUri, vaultKey);
      Alert.alert(
        'Restore Complete',
        `Successfully restored ${count} passwords from backup.`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }],
      );
    } catch (e: any) {
      Alert.alert(
        'Restore Failed',
        e.message ?? 'The backup file may be corrupted or incompatible.',
      );
    } finally {
      setRestoring(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.text }]}>Restore Vault</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <SecurityAlert
          variant="warning"
          icon="warning-outline"
          title="Warning: This will replace your current vault"
          message="Restoring a backup will replace all existing passwords with the backup's contents. Make sure you have a current backup before proceeding."
        />

        {/* File picker */}
        <TouchableOpacity
          onPress={handlePick}
          style={[styles.pickBtn, {
            backgroundColor: selectedUri ? C.primaryMuted : C.surfaceSecondary,
            borderColor: selectedUri ? C.primary : C.border,
          }]}
        >
          <Ionicons
            name={selectedUri ? 'document-text-outline' : 'folder-open-outline'}
            size={28}
            color={selectedUri ? C.primary : C.textTertiary}
          />
          <Text style={[styles.pickText, { color: selectedUri ? C.primary : C.textSecondary }]}>
            {selectedName ?? 'Tap to select backup file (.pgb)'}
          </Text>
          {selectedUri && (
            <TouchableOpacity
              onPress={() => { setSelectedUri(null); setSelectedName(null); }}
              hitSlop={10}
            >
              <Ionicons name="close-circle" size={20} color={C.textTertiary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: C.text }]}>How to Restore</Text>
          {[
            'Select your encrypted backup file (.pgb)',
            'The file is decrypted using your current master password',
            'Your existing vault will be replaced with the backup contents',
            'Biometric settings are preserved',
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: C.primaryMuted }]}>
                <Text style={[styles.stepNumText, { color: C.primary }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: C.textSecondary }]}>{step}</Text>
            </View>
          ))}
        </View>

        <PrimaryButton
          title="Restore from Backup"
          onPress={() => setShowConfirm(true)}
          loading={restoring}
          disabled={!selectedUri}
          icon={<Ionicons name="cloud-download-outline" size={18} color="#fff" />}
        />
      </ScrollView>

      <ConfirmationModal
        visible={showConfirm}
        title="Replace Current Vault?"
        message="This will permanently replace all your current passwords with the selected backup. This cannot be undone."
        confirmText="Restore Backup"
        cancelText="Cancel"
        isDanger
        icon="warning-outline"
        onConfirm={handleRestore}
        onCancel={() => setShowConfirm(false)}
      />
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
  pickBtn: {
    alignItems: 'center', borderRadius: Radius.card, borderWidth: 2, borderStyle: 'dashed',
    flexDirection: 'row', gap: Spacing.md, minHeight: 80, padding: Spacing.base,
  },
  pickText: { flex: 1, fontSize: Typography.size.body, fontWeight: Typography.weight.medium },
  infoSection: { gap: Spacing.md },
  infoTitle: { fontSize: Typography.size.bodyLg, fontWeight: Typography.weight.extrabold },
  stepRow: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.md },
  stepNum: {
    alignItems: 'center', borderRadius: Radius.full,
    height: 24, justifyContent: 'center', width: 24, flexShrink: 0,
  },
  stepNumText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.extrabold },
  stepText: { flex: 1, fontSize: Typography.size.sm, lineHeight: 20, paddingTop: 2 },
});
