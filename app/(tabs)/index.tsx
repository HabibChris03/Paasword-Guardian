/**
 * Screen 07 — Dashboard / Home Tab
 * Security score, quick stats, recent items, quick actions.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { CredentialCard } from '../../components/ui/CredentialCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { useVaultContext } from '../../src/context/vault-context';
import { VaultService } from '../../src/services/vault-service';
import { SecurityService } from '../../src/services/security-service';
import { getGreeting } from '../../src/utils/format';
import { CategoryColors, CategoryIcons, Typography, Spacing, Radius, Shadows } from '../../src/constants/theme';
import type { Credential, SecurityReport } from '../../src/types/models';

const QUICK_ACTIONS = [
  { id: 'add',       label: 'Add Password', icon: 'add-circle-outline',     route: '/vault/add' },
  { id: 'generator', label: 'Generator',    icon: 'dice-outline',            route: '/vault/generator' },
  { id: 'breach',    label: 'Breach Scan',  icon: 'shield-half-outline',     route: '/security/breach-monitor' },
  { id: 'backup',    label: 'Backup',       icon: 'cloud-upload-outline',    route: '/backup/backup' },
] as const;

export default function HomeScreen() {
  const { C } = useTheme();
  const router = useRouter();
  const { vaultKey, settings } = useVaultContext();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [report, setReport]           = useState<SecurityReport | null>(null);
  const [refreshing, setRefreshing]   = useState(false);

  const load = useCallback(async () => {
    const creds = await VaultService.getCredentials();
    setCredentials(creds);
    if (vaultKey) {
      const r = await SecurityService.generateReport(vaultKey);
      setReport(r);
    }
  }, [vaultKey]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const score       = report?.score ?? 100;
  const scoreColor  = score >= 75 ? C.success : score >= 50 ? C.warning : C.danger;
  const scoreLabel  = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : score >= 40 ? 'Needs Work' : 'At Risk';
  const recent      = credentials.slice(0, 5);
  const greeting    = getGreeting();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: C.textSecondary }]}>{greeting}</Text>
          <Text style={[styles.vaultName, { color: C.text }]}>
            {settings?.profileName ?? 'My Vault'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.avatar, { backgroundColor: C.primary }]}
          onPress={() => router.push('/(tabs)/settings')}
          accessibilityLabel="Open settings"
        >
          <Ionicons name="person-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {/* Security Score Card */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push('/(tabs)/security')}
          style={[styles.scoreCard, { backgroundColor: C.primary }, Shadows.lg]}
        >
          <View>
            <Text style={styles.scoreLabel}>Security Score</Text>
            <Text style={styles.scoreNumber}>{score}<Text style={styles.scoreOf}>/100</Text></Text>
            <Text style={styles.scoreStatus}>{scoreLabel}</Text>
          </View>
          <View style={styles.scoreRight}>
            <View style={styles.shieldWrap}>
              <Ionicons name="shield-checkmark" size={40} color="rgba(255,255,255,0.25)" />
            </View>
            {report && (
              <View style={styles.scoreStats}>
                <Text style={styles.scoreStat}>{report.strongPasswords} strong</Text>
                <Text style={styles.scoreStat}>{report.weakPasswords} weak</Text>
              </View>
            )}
          </View>
          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${score}%` as any }]} />
          </View>
          {report && report.issues.length > 0 && (
            <Text style={styles.scoreHint}>
              {SecurityService.getScoreDescription(score, report.issues)}
            </Text>
          )}
        </TouchableOpacity>

        {/* Stats row */}
        {credentials.length > 0 && (
          <View style={styles.statsRow}>
            {[
              { label: 'Total',   val: credentials.length,                      icon: 'key-outline' },
              { label: 'Strong',  val: report?.strongPasswords ?? 0,            icon: 'shield-checkmark-outline' },
              { label: 'Favorites', val: credentials.filter(c => c.favorite).length, icon: 'star-outline' },
            ].map(s => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Ionicons name={s.icon as any} size={18} color={C.primary} />
                <Text style={[styles.statVal, { color: C.text }]}>{s.val}</Text>
                <Text style={[styles.statLabel, { color: C.textSecondary }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map(a => (
              <TouchableOpacity
                key={a.id}
                activeOpacity={0.8}
                onPress={() => router.push(a.route as any)}
                style={[styles.actionBtn, { backgroundColor: C.surface, borderColor: C.border }]}
              >
                <View style={[styles.actionIcon, { backgroundColor: C.primaryMuted }]}>
                  <Ionicons name={a.icon as any} size={22} color={C.primary} />
                </View>
                <Text style={[styles.actionLabel, { color: C.text }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Passwords */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Recent Passwords</Text>
            {credentials.length > 5 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/vault')} accessibilityLabel="View all">
                <Text style={[styles.seeAll, { color: C.primary }]}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {recent.length > 0 ? (
            <View style={styles.cardList}>
              {recent.map(cred => (
                <CredentialCard
                  key={cred.id}
                  credential={cred}
                  onPress={() => router.push(`/vault/${cred.id}` as any)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="lock-open-outline"
              title="No passwords yet"
              message="Tap the + button to add your first password"
            />
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: C.primary }, Shadows.lg]}
        onPress={() => router.push('/vault/add')}
        accessibilityLabel="Add new password"
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    alignItems: 'center', flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
  },
  greeting: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium },
  vaultName: { fontSize: Typography.size.headingLg, fontWeight: Typography.weight.extrabold },
  avatar: {
    alignItems: 'center', borderRadius: Radius.full,
    height: 38, justifyContent: 'center', width: 38,
  },
  content: { paddingBottom: 100, gap: Spacing.xl, paddingHorizontal: Spacing.base },
  scoreCard: {
    borderRadius: Radius.card, padding: Spacing.base, gap: Spacing.sm, overflow: 'hidden',
  },
  scoreLabel: { color: 'rgba(255,255,255,0.75)', fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  scoreNumber: { color: '#fff', fontSize: Typography.size.hero, fontWeight: Typography.weight.extrabold, lineHeight: 46 },
  scoreOf: { fontSize: Typography.size.title, fontWeight: Typography.weight.medium },
  scoreStatus: { color: 'rgba(255,255,255,0.85)', fontSize: Typography.size.bodyLg, fontWeight: Typography.weight.bold },
  scoreRight: { position: 'absolute', right: Spacing.base, top: Spacing.base, alignItems: 'flex-end', gap: 4 },
  shieldWrap: {},
  scoreStats: { alignItems: 'flex-end', gap: 2 },
  scoreStat: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.size.xs, fontWeight: Typography.weight.medium },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, height: 5, overflow: 'hidden',
  },
  progressFill: { backgroundColor: 'rgba(255,255,255,0.85)', height: '100%', borderRadius: 4 },
  scoreHint: { color: 'rgba(255,255,255,0.75)', fontSize: Typography.size.sm },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1, flex: 1,
    gap: 4, paddingVertical: Spacing.base,
  },
  statVal: { fontSize: Typography.size.headingLg, fontWeight: Typography.weight.extrabold },
  statLabel: { fontSize: Typography.size.xs, fontWeight: Typography.weight.medium },
  section: { gap: Spacing.md },
  sectionRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { fontSize: Typography.size.subtitle, fontWeight: Typography.weight.extrabold },
  seeAll: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actionBtn: {
    alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1,
    gap: Spacing.sm, padding: Spacing.md,
    width: '48%',
  },
  actionIcon: {
    alignItems: 'center', borderRadius: Radius.md,
    height: 48, justifyContent: 'center', width: 48,
  },
  actionLabel: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  cardList: { gap: Spacing.sm },
  fab: {
    alignItems: 'center',
    borderRadius: Radius.full,
    bottom: 90,
    height: 58,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.base,
    width: 58,
  },
});
