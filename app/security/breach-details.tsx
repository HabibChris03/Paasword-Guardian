import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { BreachService } from '../../src/services/breach-service';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { LoadingState } from '../../components/ui/LoadingState';
import { formatDate } from '../../src/utils/format';
import type { BreachResult } from '../../src/types/models';

export default function BreachDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { C } = useTheme();

  const [breach, setBreach] = useState<BreachResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBreachDetails();
  }, [id]);

  const loadBreachDetails = async () => {
    try {
      if (typeof id === 'string') {
        const scan = await BreachService.getLastScanResult();
        const found = scan?.results.find(r => r.id === id) ?? null;
        setBreach(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!breach) return;
    try {
      await BreachService.markResolved(breach.id);
      router.back();
    } catch (err) {
      console.error('Failed to resolve breach', err);
    }
  };

  if (loading) {
    return <LoadingState message="Loading details..." />;
  }

  if (!breach) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={{ color: C.text, fontSize: Typography.size.body }}>Breach not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCritical = breach.severity === 'critical' || breach.severity === 'high';
  const badgeBg = isCritical ? C.dangerLight : C.warningLight;
  const badgeColor = isCritical ? C.danger : C.warning;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Breach Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.topRow}>
            <View style={[styles.iconWrap, { backgroundColor: badgeBg }]}>
              <Ionicons name="alert-circle" size={28} color={badgeColor} />
            </View>
            <View style={styles.topInfo}>
              <Text style={[styles.title, { color: C.text }]}>{breach.credentialTitle}</Text>
              <Text style={[styles.breachName, { color: C.textSecondary }]}>
                {breach.breachName}
              </Text>
            </View>
          </View>

          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>
              {breach.severity.toUpperCase()} RISK
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Breach Information</Text>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: C.textSecondary }]}>Date Detected</Text>
            <Text style={[styles.value, { color: C.text }]}>
              {formatDate(breach.detectedAt)}
            </Text>
          </View>

          {breach.breachDate && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: C.textSecondary }]}>Breach Occurred</Text>
              <Text style={[styles.value, { color: C.text }]}>
                {formatDate(breach.breachDate)}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: C.textSecondary }]}>Status</Text>
            <Text style={[styles.value, { color: breach.isResolved ? C.success : C.danger }]}>
              {breach.isResolved ? 'Resolved' : 'Action Required'}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={[styles.label, { color: C.textSecondary, marginBottom: Spacing.xs }]}>
            Exposed Data
          </Text>
          <View style={styles.tagsRow}>
            {breach.exposedData.map((data, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: C.surfaceSecondary }]}>
                <Text style={[styles.tagText, { color: C.text }]}>{data}</Text>
              </View>
            ))}
          </View>

          {breach.description && (
            <>
              <View style={styles.divider} />
              <Text style={[styles.label, { color: C.textSecondary, marginBottom: Spacing.xs }]}>
                Description
              </Text>
              <Text style={[styles.description, { color: C.text }]}>{breach.description}</Text>
            </>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Recommended Action</Text>
          <Text style={[styles.description, { color: C.textSecondary }]}>
            1. Immediately change the password for {breach.credentialTitle}.{'\n'}
            2. If you used this password on any other sites, change those immediately.{'\n'}
            3. Enable Two-Factor Authentication (2FA) if supported on that account.
          </Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title="Change Password Now"
            onPress={() => router.push(`/vault/edit/${breach.credentialId}` as any)}
          />
          {!breach.isResolved && (
            <SecondaryButton
              title="Mark as Resolved"
              onPress={handleResolve}
              style={{ marginTop: Spacing.sm }}
            />
          )}
        </View>
      </ScrollView>
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
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: Typography.size.subtitle,
    fontWeight: Typography.weight.bold,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: Spacing.base,
    gap: Spacing.base,
  },
  card: {
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topInfo: {
    flex: 1,
  },
  title: {
    fontSize: Typography.size.title,
    fontWeight: Typography.weight.bold,
  },
  breachName: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    marginTop: Spacing.md,
  },
  badgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  section: {
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.size.bodyLg,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  label: {
    fontSize: Typography.size.sm,
  },
  value: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8EAE8',
    marginVertical: Spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  tagText: {
    fontSize: Typography.size.xs,
  },
  description: {
    fontSize: Typography.size.sm,
    lineHeight: 20,
  },
  actions: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
});
