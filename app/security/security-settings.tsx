/**
 * Screen 22 — Security Settings
 * Auto-lock, clipboard timeout, breach monitoring, etc.
 */
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { useSettings } from '../../hooks/useSettings';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import type { AutoLockTimeout, ClipboardTimeout } from '../../src/types/models';

const AUTO_LOCK_OPTIONS: { label: string; value: AutoLockTimeout }[] = [
  { label: 'Immediately', value: 0 },
  { label: '1 minute',   value: 1 },
  { label: '5 minutes',  value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour',     value: 60 },
];

const CLIPBOARD_OPTIONS: { label: string; value: ClipboardTimeout }[] = [
  { label: '15 seconds', value: 15 },
  { label: '30 seconds', value: 30 },
  { label: '1 minute',   value: 60 },
  { label: '2 minutes',  value: 120 },
];

export default function SecuritySettingsScreen() {
  const { C } = useTheme();
  const router = useRouter();
  const { settings, updateSettings, saving } = useSettings();

  const handleSave = async () => {
    Alert.alert('Saved', 'Security settings updated.');
  };

  if (!settings) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.text }]}>Security Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Auto-Lock */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Auto-Lock Timeout</Text>
          <Text style={[styles.sectionDesc, { color: C.textSecondary }]}>
            Your vault will lock automatically after this period of inactivity.
          </Text>
          <View style={[styles.optionGroup, { borderColor: C.border, backgroundColor: C.surface }]}>
            {AUTO_LOCK_OPTIONS.map((opt, i) => (
              <React.Fragment key={opt.value}>
                <TouchableOpacity
                  onPress={() => updateSettings({ autoLockTimeout: opt.value })}
                  style={styles.optionRow}
                >
                  <Text style={[styles.optionLabel, { color: C.text }]}>{opt.label}</Text>
                  {settings.autoLockTimeout === opt.value && (
                    <Ionicons name="checkmark" size={18} color={C.primary} />
                  )}
                </TouchableOpacity>
                {i < AUTO_LOCK_OPTIONS.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: C.divider }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Clipboard */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Clipboard Clear Timeout</Text>
          <Text style={[styles.sectionDesc, { color: C.textSecondary }]}>
            Copied passwords are cleared from your clipboard after this duration.
          </Text>
          <View style={[styles.optionGroup, { borderColor: C.border, backgroundColor: C.surface }]}>
            {CLIPBOARD_OPTIONS.map((opt, i) => (
              <React.Fragment key={opt.value}>
                <TouchableOpacity
                  onPress={() => updateSettings({ clipboardTimeout: opt.value })}
                  style={styles.optionRow}
                >
                  <Text style={[styles.optionLabel, { color: C.text }]}>{opt.label}</Text>
                  {settings.clipboardTimeout === opt.value && (
                    <Ionicons name="checkmark" size={18} color={C.primary} />
                  )}
                </TouchableOpacity>
                {i < CLIPBOARD_OPTIONS.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: C.divider }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Toggles */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Security Options</Text>
          <View style={[styles.optionGroup, { borderColor: C.border, backgroundColor: C.surface }]}>
            {[
              { label: 'Lock on Background', key: 'lockOnBackground' as const, desc: 'Lock vault when app goes to background' },
              { label: 'Breach Monitoring', key: 'breachMonitoringEnabled' as const, desc: 'Check if your accounts appear in data breaches' },
              { label: 'Security Notifications', key: 'securityNotificationsEnabled' as const, desc: 'Receive alerts for security events' },
            ].map((item, i) => (
              <React.Fragment key={item.key}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleText}>
                    <Text style={[styles.optionLabel, { color: C.text }]}>{item.label}</Text>
                    <Text style={[styles.optionDesc, { color: C.textTertiary }]}>{item.desc}</Text>
                  </View>
                  <Switch
                    value={settings[item.key] as boolean}
                    onValueChange={v => updateSettings({ [item.key]: v })}
                    trackColor={{ true: C.primary, false: C.border }}
                    thumbColor="#fff"
                  />
                </View>
                {i < 2 && <View style={[styles.divider, { backgroundColor: C.divider }]} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        <PrimaryButton
          title={saving ? 'Saving...' : 'Save Settings'}
          onPress={handleSave}
          disabled={saving}
          style={{ marginTop: Spacing.sm, marginBottom: Spacing.xl }}
        />
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
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.size.bodyLg, fontWeight: Typography.weight.extrabold },
  sectionDesc: { fontSize: Typography.size.sm, lineHeight: 18 },
  optionGroup: { borderRadius: Radius.card, borderWidth: 1, overflow: 'hidden' },
  optionRow: {
    alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, minHeight: 50,
  },
  optionLabel: { fontSize: Typography.size.body, fontWeight: Typography.weight.medium },
  optionDesc: { fontSize: Typography.size.xs, marginTop: 2 },
  divider: { height: 1, marginHorizontal: Spacing.md },
  toggleRow: {
    alignItems: 'center', flexDirection: 'row', gap: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, minHeight: 58,
  },
  toggleText: { flex: 1 },
});
