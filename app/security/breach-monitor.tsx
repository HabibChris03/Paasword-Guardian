/**
 * Screen 17 — Breach Monitoring
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { SecurityAlert } from '../../components/ui/SecurityAlert';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { useVaultContext } from '../../src/context/vault-context';
import { BreachService } from '../../src/services/breach-service';
import { formatDate, timeAgo } from '../../src/utils/format';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import type { BreachScanResult, BreachResult } from '../../src/types/models';

const SEVERITY_COLOR = {
  critical: '#C95C5C',
  high:     '#D89B3D',
  medium:   '#4A7FA5',
  low:      '#9EA89F',
} as const;

export default function BreachMonitorScreen() {
  const { C } = useTheme();
  const router = useRouter();
  const { vaultKey } = useVaultContext();
  const [scanResult, setScanResult] = useState<BreachScanResult | null>(null);
  const [scanning,   setScanning]   = useState(false);
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(async () => {
    const result = await BreachService.getLastScanResult();
    setScanResult(result);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleScan = async () => {
    if (!vaultKey) return;
    setScanning(true);
    const result = await BreachService.scanVault(vaultKey);
    setScanResult(result);
    setScanning(false);
  };

  const handleResolve = async (breachId: string) => {
    await BreachService.markResolved(breachId);
    load();
  };

  if (loading) return <LoadingState message="Loading breach data…" />;

  const activeBreaches = scanResult?.results.filter(r => !r.isResolved) ?? [];
  const resolvedBreaches = scanResult?.results.filter(r => r.isResolved) ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.text }]}>Breach Monitor</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Privacy note */}
        <SecurityAlert
          variant="info"
          icon="shield-checkmark-outline"
          title="Privacy Protected"
          message="We use k-anonymity: only a partial hash of your account data is sent to our service. Your passwords and emails are never transmitted."
        />

        {/* Scan status */}
        {scanResult && (
          <View style={[styles.statusCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={styles.statusRow}>
              <Ionicons
                name={activeBreaches.length > 0 ? 'warning-outline' : 'shield-checkmark-outline'}
                size={22}
                color={activeBreaches.length > 0 ? C.danger : C.success}
              />
              <View style={styles.statusText}>
                <Text style={[styles.statusTitle, { color: C.text }]}>
                  {activeBreaches.length > 0
                    ? `${activeBreaches.length} Active Breach${activeBreaches.length > 1 ? 'es' : ''}`
                    : 'No Active Breaches'}
                </Text>
                <Text style={[styles.statusSub, { color: C.textSecondary }]}>
                  Last scanned: {timeAgo(scanResult.scannedAt)} · {scanResult.totalChecked} accounts checked
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action buttons */}
        <View style={{ gap: Spacing.sm }}>
          <PrimaryButton
            title={scanning ? 'Scanning…' : 'Run Breach Scan'}
            onPress={handleScan}
            loading={scanning}
            icon={<Ionicons name="shield-half-outline" size={18} color="#fff" />}
          />
          <SecondaryButton
            title="Browse Global Breach News"
            onPress={() => router.push('/security/breach-news' as any)}
            icon={<Ionicons name="newspaper-outline" size={18} color={C.primary} />}
          />
        </View>

        {/* Active breaches */}
        {activeBreaches.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Accounts at Risk</Text>
            {activeBreaches.map(breach => (
              <BreachCard
                key={breach.id}
                breach={breach}
                onResolve={() => handleResolve(breach.id)}
                onViewCredential={() => router.push(`/vault/${breach.credentialId}` as any)}
              />
            ))}
          </View>
        )}

        {/* No breaches */}
        {scanResult && activeBreaches.length === 0 && (
          <EmptyState
            icon="shield-checkmark-outline"
            title="All Clear!"
            message="None of your accounts appear in known data breaches. Keep your passwords strong and unique."
          />
        )}

        {/* No scan yet */}
        {!scanResult && (
          <EmptyState
            icon="shield-half-outline"
            title="No scan yet"
            message="Run a breach scan to check if your accounts appear in known data breaches."
          />
        )}

        {/* Resolved */}
        {resolvedBreaches.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>Resolved</Text>
            {resolvedBreaches.map(breach => (
              <View key={breach.id} style={[styles.resolvedCard, { backgroundColor: C.surfaceSecondary, borderColor: C.border }]}>
                <Ionicons name="checkmark-circle-outline" size={18} color={C.success} />
                <Text style={[styles.resolvedText, { color: C.textSecondary }]}>
                  {breach.credentialTitle} — {breach.breachName}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BreachCard({ breach, onResolve, onViewCredential }: {
  breach: BreachResult;
  onResolve: () => void;
  onViewCredential: () => void;
}) {
  const { C } = useTheme();
  const sev = SEVERITY_COLOR[breach.severity];
  return (
    <View style={[styles.breachCard, { backgroundColor: C.surface, borderColor: C.border, borderLeftColor: sev, borderLeftWidth: 4 }]}>
      <View style={styles.breachHeader}>
        <Text style={[styles.breachTitle, { color: C.text }]}>{breach.credentialTitle}</Text>
        <View style={[styles.severityBadge, { backgroundColor: `${sev}20` }]}>
          <Text style={[styles.severityText, { color: sev }]}>{breach.severity.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={[styles.breachName, { color: C.textSecondary }]}>Breach: {breach.breachName}</Text>
      {breach.breachDate && (
        <Text style={[styles.breachDate, { color: C.textTertiary }]}>Date: {formatDate(breach.breachDate)}</Text>
      )}
      <Text style={[styles.breachExposed, { color: C.textSecondary }]}>
        Exposed: {breach.exposedData.join(', ')}
      </Text>
      <View style={styles.breachActions}>
        <TouchableOpacity onPress={onViewCredential} style={[styles.breachBtn, { borderColor: C.primary }]}>
          <Text style={[styles.breachBtnText, { color: C.primary }]}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onResolve} style={[styles.breachBtn, { borderColor: C.border }]}>
          <Text style={[styles.breachBtnText, { color: C.textSecondary }]}>Mark Resolved</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  content: { paddingHorizontal: Spacing.base, paddingBottom: 60, gap: Spacing.lg },
  statusCard: {
    borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  statusText: { flex: 1 },
  statusTitle: { fontSize: Typography.size.body, fontWeight: Typography.weight.bold },
  statusSub: { fontSize: Typography.size.sm, marginTop: 2 },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.size.bodyLg, fontWeight: Typography.weight.extrabold },
  breachCard: {
    borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, gap: Spacing.xs,
  },
  breachHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breachTitle: { fontSize: Typography.size.body, fontWeight: Typography.weight.bold, flex: 1 },
  severityBadge: {
    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  severityText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.extrabold },
  breachName: { fontSize: Typography.size.sm },
  breachDate: { fontSize: Typography.size.xs },
  breachExposed: { fontSize: Typography.size.sm },
  breachActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  breachBtn: {
    borderRadius: Radius.md, borderWidth: 1.5, flex: 1,
    alignItems: 'center', paddingVertical: Spacing.sm,
  },
  breachBtnText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold },
  resolvedCard: {
    alignItems: 'center', borderRadius: Radius.md, borderWidth: 1,
    flexDirection: 'row', gap: Spacing.sm, padding: Spacing.sm,
  },
  resolvedText: { flex: 1, fontSize: Typography.size.sm },
});
