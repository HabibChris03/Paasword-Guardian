/**
 * Screen 26 — Settings Tab
 * Profile, security settings, preferences, backup, about.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { useVaultContext } from '../../src/context/vault-context';
import { useSettings } from '../../hooks/useSettings';
import AuthService from '../../src/services/auth-service';
import { setSecureItem } from '../../src/storage/secure-storage';
import { APP_VERSION, STORAGE_KEYS } from '../../src/constants/app';
import { Typography, Spacing, Radius } from '../../src/constants/theme';

// Helper to avoid the TS issue with Ionicons name type
type Icon = React.ComponentProps<typeof Ionicons>['name'];

function SettingsRow({
  icon, label, value, onPress, toggle, right, destructive,
}: {
  icon: Icon; label: string; value?: string; onPress?: () => void;
  toggle?: { value: boolean; onChange: (v: boolean) => void };
  right?: React.ReactNode;
  destructive?: boolean;
}) {
  const { C } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !toggle}
      activeOpacity={onPress ? 0.7 : 1}
      style={styles.row}
    >
      <View style={[styles.rowIcon, { backgroundColor: C.primaryMuted }]}>
        <Ionicons name={icon} size={18} color={C.primary} />
      </View>
      <Text style={[
        styles.rowLabel, { color: destructive ? C.danger : C.text },
      ]}>{label}</Text>
      {value && <Text style={[styles.rowValue, { color: C.textTertiary }]}>{value}</Text>}
      {toggle && (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          trackColor={{ true: C.primary, false: C.border }}
          thumbColor="#fff"
        />
      )}
      {right}
      {onPress && !toggle && !right && (
        <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  const { C } = useTheme();
  return (
    <Text style={[styles.sectionHeader, { color: C.textTertiary }]}>{title}</Text>
  );
}

export default function SettingsScreen() {
  const { C } = useTheme();
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const { lock, logout, vaultKey } = useVaultContext();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleBiometricToggle = async (enabled: boolean) => {
    await updateSettings({ biometricEnabled: enabled });
    if (!enabled) {
      await AuthService.logout();
    } else if (vaultKey) {
      await setSecureItem(STORAGE_KEYS.BIOMETRIC_VAULT_KEY, vaultKey);
    }
  };

  const handleLock = () => {
    lock();
    router.replace('/auth/login');
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/auth/login?loggedOut=true');
  };

  const handleDeleteVault = async () => {
    setShowDeleteModal(false);
    await AuthService.deleteVault();
    router.replace('/getstarted');
  };

  const profileName = settings?.profileName ?? 'My Vault';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      <Text style={[styles.headerTitle, { color: C.text }]}>Settings</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Profile */}
        <View style={[styles.profileCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={[styles.profileAvatar, { backgroundColor: C.primary }]}>
            <Ionicons name="person" size={24} color="#fff" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: C.text }]}>{profileName}</Text>
            <Text style={[styles.profileSub, { color: C.textSecondary }]}>Password Guardian Vault</Text>
          </View>
        </View>

        {/* Security */}
        <SectionHeader title="SECURITY" />
        <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <SettingsRow
            icon="key-outline"
            label="Change Master Password"
            onPress={() => router.push('/security/master-key')}
          />
          <View style={[styles.divider, { backgroundColor: C.divider }]} />
          <SettingsRow
            icon="finger-print"
            label="Biometric Unlock"
            toggle={{
              value: settings?.biometricEnabled ?? false,
              onChange: handleBiometricToggle,
            }}
          />
          <View style={[styles.divider, { backgroundColor: C.divider }]} />
          <SettingsRow
            icon="lock-closed-outline"
            label="Auto-Lock Timeout"
            value={settings?.autoLockTimeout === 0 ? 'Never' : `${settings?.autoLockTimeout}m`}
            onPress={() => router.push('/security/security-settings')}
          />
          <View style={[styles.divider, { backgroundColor: C.divider }]} />
          <SettingsRow
            icon="shield-half-outline"
            label="Security Settings"
            onPress={() => router.push('/security/security-settings')}
          />
        </View>

        {/* Backup */}
        <SectionHeader title="BACKUP & RESTORE" />
        <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <SettingsRow
            icon="cloud-upload-outline"
            label="Backup Vault"
            onPress={() => router.push('/backup/backup')}
          />
          <View style={[styles.divider, { backgroundColor: C.divider }]} />
          <SettingsRow
            icon="cloud-download-outline"
            label="Restore Vault"
            onPress={() => router.push('/backup/restore')}
          />
        </View>

        {/* About */}
        <SectionHeader title="ABOUT" />
        <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <SettingsRow
            icon="help-circle-outline"
            label="Help & Security Info"
            onPress={() => router.push('/help/index')}
          />
          <View style={[styles.divider, { backgroundColor: C.divider }]} />
          <SettingsRow
            icon="information-circle-outline"
            label="Version"
            value={APP_VERSION}
          />
        </View>

        {/* Vault Actions */}
        <SectionHeader title="VAULT" />
        <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <SettingsRow
            icon="lock-closed-outline"
            label="Lock Vault"
            onPress={handleLock}
          />
          <View style={[styles.divider, { backgroundColor: C.divider }]} />
          <SettingsRow
            icon="log-out-outline"
            label="Log Out of Vault"
            onPress={() => setShowLogoutModal(true)}
          />
          <View style={[styles.divider, { backgroundColor: C.divider }]} />
          <SettingsRow
            icon="trash-outline"
            label="Delete Vault Permanently"
            onPress={() => setShowDeleteModal(true)}
            destructive
          />
        </View>
      </ScrollView>

      {/* Logout Confirmation */}
      <ConfirmationModal
        visible={showLogoutModal}
        title="Log Out of Vault?"
        message="Logging out will lock your vault and require your master password to sign back in. Fingerprint unlock will be re-enabled after you sign in."
        confirmText="Log Out"
        cancelText="Cancel"
        isDanger={false}
        icon="log-out-outline"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* Delete Vault Confirmation */}
      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Vault?"
        message="This will permanently delete all your passwords and vault data. This action cannot be undone."
        confirmText="Delete Forever"
        cancelText="Cancel"
        isDanger
        icon="trash-outline"
        onConfirm={handleDeleteVault}
        onCancel={() => setShowDeleteModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerTitle: {
    fontSize: Typography.size.headingLg,
    fontWeight: Typography.weight.extrabold,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  content: { paddingBottom: 100, gap: Spacing.sm, paddingHorizontal: Spacing.base },
  profileCard: {
    alignItems: 'center', borderRadius: Radius.card, borderWidth: 1,
    flexDirection: 'row', gap: Spacing.md, padding: Spacing.base, marginBottom: Spacing.sm,
  },
  profileAvatar: {
    alignItems: 'center', borderRadius: Radius.full,
    height: 52, justifyContent: 'center', width: 52,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: Typography.size.subtitle, fontWeight: Typography.weight.extrabold },
  profileSub: { fontSize: Typography.size.sm, marginTop: 2 },
  sectionHeader: {
    fontSize: Typography.size.xs, fontWeight: Typography.weight.extrabold,
    letterSpacing: 0.8, marginTop: Spacing.sm, marginBottom: 2,
  },
  section: {
    borderRadius: Radius.card, borderWidth: 1, overflow: 'hidden',
  },
  row: {
    alignItems: 'center', flexDirection: 'row', gap: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, minHeight: 52,
  },
  rowIcon: {
    alignItems: 'center', borderRadius: Radius.sm,
    height: 32, justifyContent: 'center', width: 32,
  },
  rowLabel: { flex: 1, fontSize: Typography.size.body, fontWeight: Typography.weight.medium },
  rowValue: { fontSize: Typography.size.sm },
  divider: { height: 1, marginHorizontal: Spacing.md },
});
