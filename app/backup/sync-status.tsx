import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { BackupService } from '../../src/services/backup-service';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { formatDate, formatBytes } from '../../src/utils/format';
import type { BackupMetadata } from '../../src/types/models';

export default function SyncStatusScreen() {
  const router = useRouter();
  const { C } = useTheme();
  
  const [history, setHistory] = useState<BackupMetadata[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await BackupService.getBackupHistory();
      setHistory(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.text }]}>Sync & Backups</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.cloudCard, { backgroundColor: C.primary }]}>
          <Ionicons name="cloud-upload-outline" size={48} color="#FFF" style={{ marginBottom: Spacing.md }} />
          <Text style={styles.cloudTitle}>Cloud Sync</Text>
          <Text style={styles.cloudSubtitle}>Coming Soon</Text>
          <Text style={styles.cloudDesc}>
            Securely sync your encrypted vault across all your devices using your preferred cloud provider.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Manual Backup</Text>
          <Text style={[styles.descText, { color: C.textSecondary, marginBottom: Spacing.md }]}>
            Create an encrypted file backup to save locally or share manually.
          </Text>
          <PrimaryButton 
            title="Create New Backup"
            onPress={() => router.push('/backup/backup')}
          />
        </View>

        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: C.text, marginBottom: Spacing.sm }]}>
            Backup History
          </Text>
          
          {history.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={[styles.emptyText, { color: C.textSecondary }]}>
                No backups created yet.
              </Text>
            </View>
          ) : (
            history.map((item) => (
              <View 
                key={item.id} 
                style={[styles.historyItem, { backgroundColor: C.surface, borderColor: C.border }]}
              >
                <View style={styles.historyTop}>
                  <Text style={[styles.historyDate, { color: C.text }]}>
                    {formatDate(item.createdAt)}
                  </Text>
                  <Text style={[styles.historySize, { color: C.textSecondary }]}>
                    {formatBytes(item.sizeBytes)}
                  </Text>
                </View>
                <Text style={[styles.historyMeta, { color: C.textTertiary }]}>
                  {item.credentialCount} items • {item.destination.toUpperCase()}
                </Text>
              </View>
            ))
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
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: Typography.size.subtitle,
    fontWeight: Typography.weight.bold,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.base,
  },
  cloudCard: {
    padding: Spacing.xl,
    borderRadius: Radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudTitle: {
    color: '#FFF',
    fontSize: Typography.size.heading,
    fontWeight: Typography.weight.bold,
  },
  cloudSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  cloudDesc: {
    color: '#FFF',
    fontSize: Typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: Typography.size.bodyLg,
    fontWeight: Typography.weight.bold,
  },
  descText: {
    fontSize: Typography.size.sm,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  historySection: {
    marginTop: Spacing.sm,
  },
  emptyCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.size.body,
  },
  historyItem: {
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.bold,
  },
  historySize: {
    fontSize: Typography.size.sm,
  },
  historyMeta: {
    fontSize: Typography.size.xs,
  },
});
