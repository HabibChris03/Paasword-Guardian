/**
 * Screen 16 — Security Center Tab
 * Security score, vault health, recommendations, breach alerts.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { SecurityAlert } from '../../components/ui/SecurityAlert';
import { LoadingState } from '../../components/ui/LoadingState';
import { useVaultContext } from '../../src/context/vault-context';
import { SecurityService } from '../../src/services/security-service';
import { BreachService } from '../../src/services/breach-service';
import { Typography, Spacing, Radius, Shadows } from '../../src/constants/theme';
import type { SecurityReport, BreachScanResult } from '../../src/types/models';

export default function SecurityScreen() {
  const { C } = useTheme();
  const router = useRouter();
  const { vaultKey } = useVaultContext();
  const [report,      setReport]     = useState<SecurityReport | null>(null);
  const [breach,      setBreach]     = useState<BreachScanResult | null>(null);
  const [refreshing,  setRefreshing] = useState(false);
  const [loading,     setLoading]    = useState(true);

  const load = useCallback(async () => {
    if (!vaultKey) { setLoading(false); return; }
    const [r, b] = await Promise.all([
      SecurityService.generateReport(vaultKey),
      BreachService.getLastScanResult(),
    ]);
    setReport(r);
    setBreach(b);
    setLoading(false);
  }, [vaultKey]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <LoadingState message="Analyzing your vault…" />;

  const score = report?.score ?? 100;
  const grade = report?.grade ?? 'A';
  const scoreColor = score >= 75 ? C.success : score >= 50 ? C.warning : C.danger;
  const circumference = 2 * Math.PI * 54; // SVG approach via progress arc
  const filled = (score / 100) * circumference;

  const criticalIssues = report?.issues.filter(i => i.severity === 'critical') ?? [];
  const highIssues     = report?.issues.filter(i => i.severity === 'high')     ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: C.text }]}>Security Center</Text>
        <TouchableOpacity onPress={() => router.push('/security/security-settings')} accessibilityLabel="Security settings">
          <Ionicons name="settings-outline" size={22} color={C.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {/* Score Card */}
        <View style={[styles.scoreCard, { backgroundColor: C.surface, borderColor: C.border }, Shadows.card]}>
          <View style={styles.scoreCircleWrap}>
            <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
              <Text style={[styles.scoreNum, { color: C.text }]}>{score}</Text>
              <Text style={[styles.scoreMax, { color: C.textTertiary }]}>/100</Text>
            </View>
            <Text style={[styles.scoreGrade, { color: scoreColor }]}>Grade {grade}</Text>
          </View>
          <View style={styles.scoreDetails}>
            <Text style={[styles.scoreTitle, { color: C.text }]}>
              {SecurityService.getScoreLabel(score)}
            </Text>
            <Text style={[styles.scoreDesc, { color: C.textSecondary }]}>
              {report ? SecurityService.getScoreDescription(score, report.issues) : 'Your vault is secure.'}
            </Text>
          </View>
        </View>

        {/* Breach alert */}
        {breach && breach.affectedCount > 0 && (
          <SecurityAlert
            variant="danger"
            icon="warning-outline"
            title={`${breach.affectedCount} Breach${breach.affectedCount > 1 ? 'es' : ''} Detected`}
            message="Some of your accounts may be compromised. Review them immediately."
            actionText="Review Breaches →"
            onAction={() => router.push('/security/breach-monitor')}
          />
        )}

        {/* Vault Health */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Vault Health</Text>
          <View style={styles.healthGrid}>
            {[
              { label: 'Weak',       val: report?.weakPasswords ?? 0,        color: C.danger },
              { label: 'Reused',     val: report?.reusedPasswords ?? 0,      color: C.warning },
              { label: 'Compromised', val: report?.compromisedPasswords ?? 0, color: C.danger },
              { label: 'Old (90d+)', val: report?.oldPasswords ?? 0,         color: C.info },
            ].map(h => (
              <View key={h.label} style={[styles.healthCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={[styles.healthDot, { backgroundColor: `${h.color}30` }]}>
                  <View style={[styles.healthDotInner, { backgroundColor: h.color }]} />
                </View>
                <Text style={[styles.healthVal, { color: C.text }]}>{h.val}</Text>
                <Text style={[styles.healthLabel, { color: C.textSecondary }]}>{h.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recommendations */}
        {report && report.issues.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>Recommendations</Text>
              <Text style={[styles.issueCount, { color: C.textTertiary }]}>
                {report.issues.length} issues
              </Text>
            </View>
            {report.issues.slice(0, 4).map(issue => (
              <TouchableOpacity
                key={issue.credentialId + issue.type}
                onPress={() => router.push(`/vault/${issue.credentialId}` as any)}
                style={[styles.issueCard, { backgroundColor: C.surface, borderColor: C.border }]}
              >
                <View style={[styles.issueIcon, {
                  backgroundColor: issue.severity === 'critical' ? C.dangerLight
                    : issue.severity === 'high' ? C.warningLight : C.infoLight,
                }]}>
                  <Ionicons
                    name={issue.type === 'compromised' ? 'alert-circle-outline'
                      : issue.type === 'weak' ? 'shield-half-outline'
                      : issue.type === 'reused' ? 'copy-outline'
                      : 'time-outline'}
                    size={18}
                    color={issue.severity === 'critical' ? C.danger
                      : issue.severity === 'high' ? C.warning : C.info}
                  />
                </View>
                <View style={styles.issueText}>
                  <Text numberOfLines={1} style={[styles.issueTitle, { color: C.text }]}>
                    {issue.credentialTitle}
                  </Text>
                  <Text numberOfLines={1} style={[styles.issueDesc, { color: C.textSecondary }]}>
                    {issue.recommendation}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Threat Intelligence & Breach News */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Threat Intelligence</Text>
          <TouchableOpacity
            onPress={() => router.push('/security/breach-news' as any)}
            style={[styles.intelCard, { backgroundColor: C.surface, borderColor: C.border }, Shadows.sm]}
            activeOpacity={0.8}
          >
            <View style={styles.intelHeader}>
              <View style={[styles.intelIcon, { backgroundColor: C.primaryMuted }]}>
                <Ionicons name="newspaper-outline" size={20} color={C.primary} />
              </View>
              <View style={styles.intelTitleArea}>
                <Text style={[styles.intelTitle, { color: C.text }]}>Data Breach News & Alerts</Text>
                <Text style={[styles.intelSub, { color: C.textSecondary }]}>
                  Live incident feeds from Have I Been Pwned
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textTertiary} />
            </View>
            <Text style={[styles.intelDesc, { color: C.textSecondary }]}>
              Stay ahead of leaks affecting popular services. Monitor compromised accounts and verify if your credentials are at risk.
            </Text>
            <View style={styles.intelFooter}>
              <View style={[styles.badgeLive, { backgroundColor: C.primarySurface }]}>
                <View style={[styles.pulseDot, { backgroundColor: C.success }]} />
                <Text style={[styles.badgeLiveText, { color: C.primaryDark }]}>Live Intelligence</Text>
              </View>
              <Text style={[styles.exploreText, { color: C.primary }]}>Explore News →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Actions</Text>
          {[
            { label: 'Data Breach News & Alerts', icon: 'newspaper-outline',    route: '/security/breach-news' },
            { label: 'Run Vault Breach Scan',    icon: 'shield-half-outline',  route: '/security/breach-monitor' },
            { label: 'Change Master Password',   icon: 'key-outline',          route: '/security/master-key' },
            { label: 'Security Settings',        icon: 'settings-outline',     route: '/security/security-settings' },
          ].map(a => (
            <TouchableOpacity
              key={a.label}
              onPress={() => router.push(a.route as any)}
              style={[styles.actionRow, { backgroundColor: C.surface, borderColor: C.border }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: C.primaryMuted }]}>
                <Ionicons name={a.icon as any} size={20} color={C.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: C.text }]}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    alignItems: 'center', flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: Typography.size.headingLg, fontWeight: Typography.weight.extrabold },
  content: { paddingBottom: 100, gap: Spacing.xl, paddingHorizontal: Spacing.base },
  scoreCard: {
    borderRadius: Radius.card, borderWidth: 1,
    flexDirection: 'row', gap: Spacing.base,
    padding: Spacing.base, alignItems: 'center',
  },
  scoreCircleWrap: { alignItems: 'center', gap: 4 },
  scoreCircle: {
    alignItems: 'center', borderRadius: 50, borderWidth: 6,
    height: 90, justifyContent: 'center', width: 90,
  },
  scoreNum: { fontSize: Typography.size.display, fontWeight: Typography.weight.extrabold },
  scoreMax: { fontSize: Typography.size.xs },
  scoreGrade: { fontSize: Typography.size.sm, fontWeight: Typography.weight.extrabold },
  scoreDetails: { flex: 1 },
  scoreTitle: { fontSize: Typography.size.subtitle, fontWeight: Typography.weight.extrabold },
  scoreDesc: { fontSize: Typography.size.sm, lineHeight: 18, marginTop: 4 },
  section: { gap: Spacing.sm },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: Typography.size.subtitle, fontWeight: Typography.weight.extrabold },
  issueCount: { fontSize: Typography.size.sm },
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  healthCard: {
    alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1,
    gap: 4, paddingVertical: Spacing.base, width: '47%',
  },
  healthDot: {
    alignItems: 'center', borderRadius: 22,
    height: 44, justifyContent: 'center', width: 44,
  },
  healthDotInner: { width: 16, height: 16, borderRadius: 8 },
  healthVal: { fontSize: Typography.size.headingLg, fontWeight: Typography.weight.extrabold },
  healthLabel: { fontSize: Typography.size.xs, fontWeight: Typography.weight.medium },
  issueCard: {
    alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1,
    flexDirection: 'row', gap: Spacing.sm,
    padding: Spacing.md,
  },
  issueIcon: { alignItems: 'center', borderRadius: Radius.md, height: 38, justifyContent: 'center', width: 38 },
  issueText: { flex: 1 },
  issueTitle: { fontSize: Typography.size.body, fontWeight: Typography.weight.bold },
  issueDesc: { fontSize: Typography.size.sm, marginTop: 2 },
  actionRow: {
    alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1,
    flexDirection: 'row', gap: Spacing.md, padding: Spacing.md,
  },
  actionIcon: { alignItems: 'center', borderRadius: Radius.md, height: 40, justifyContent: 'center', width: 40 },
  actionLabel: { flex: 1, fontSize: Typography.size.body, fontWeight: Typography.weight.semibold },
  intelCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  intelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  intelIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intelTitleArea: {
    flex: 1,
  },
  intelTitle: {
    fontSize: Typography.size.bodyLg,
    fontWeight: Typography.weight.bold,
  },
  intelSub: {
    fontSize: Typography.size.xs,
    marginTop: 1,
  },
  intelDesc: {
    fontSize: Typography.size.sm,
    lineHeight: 20,
  },
  intelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  badgeLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeLiveText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  exploreText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
});
