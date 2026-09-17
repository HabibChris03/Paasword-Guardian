/**
 * Screen 24 — Activity / Notifications Tab
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { EmptyState } from '../../components/ui/EmptyState';
import { NotificationService } from '../../src/services/notification-service';
import { timeAgo } from '../../src/utils/format';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import type { ActivityEvent } from '../../src/types/models';

const SEVERITY_COLORS = {
  info:    { icon: 'information-circle-outline', bgKey: 'infoLight',    colorKey: 'info' },
  success: { icon: 'checkmark-circle-outline',   bgKey: 'successLight', colorKey: 'success' },
  warning: { icon: 'warning-outline',            bgKey: 'warningLight', colorKey: 'warning' },
  danger:  { icon: 'alert-circle-outline',       bgKey: 'dangerLight',  colorKey: 'danger' },
} as const;

export default function ActivityScreen() {
  const { C } = useTheme();
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  const load = useCallback(async () => {
    const e = await NotificationService.getEvents();
    setEvents(e);
    await NotificationService.markAllRead();
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleClear = async () => {
    await NotificationService.clearEvents();
    setEvents([]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>Activity</Text>
        {events.length > 0 && (
          <TouchableOpacity onPress={handleClear} accessibilityLabel="Clear all activity">
            <Text style={[styles.clearBtn, { color: C.primary }]}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={events}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        renderItem={({ item }) => {
          const meta = SEVERITY_COLORS[item.severity];
          const bgColor  = (C as any)[meta.bgKey];
          const iconColor = (C as any)[meta.colorKey];
          return (
            <View style={[
              styles.eventCard,
              { backgroundColor: C.surface, borderColor: C.border },
              !item.isRead && { borderLeftWidth: 3, borderLeftColor: C.primary },
            ]}>
              <View style={[styles.eventIcon, { backgroundColor: bgColor }]}>
                <Ionicons name={meta.icon as any} size={20} color={iconColor} />
              </View>
              <View style={styles.eventContent}>
                <Text style={[styles.eventTitle, { color: C.text }]}>{item.title}</Text>
                <Text style={[styles.eventDesc, { color: C.textSecondary }]}>{item.description}</Text>
                <Text style={[styles.eventTime, { color: C.textTertiary }]}>{timeAgo(item.timestamp)}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="No activity yet"
            message="Security events and vault activity will appear here"
          />
        }
      />
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
  title: { fontSize: Typography.size.headingLg, fontWeight: Typography.weight.extrabold },
  clearBtn: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold },
  list: { paddingHorizontal: Spacing.base, paddingBottom: 100 },
  eventCard: {
    borderRadius: Radius.lg, borderWidth: 1,
    flexDirection: 'row', gap: Spacing.md, padding: Spacing.md,
  },
  eventIcon: {
    alignItems: 'center', borderRadius: Radius.md,
    height: 40, justifyContent: 'center', width: 40, flexShrink: 0,
  },
  eventContent: { flex: 1, gap: 2 },
  eventTitle: { fontSize: Typography.size.body, fontWeight: Typography.weight.bold },
  eventDesc: { fontSize: Typography.size.sm, lineHeight: 18 },
  eventTime: { fontSize: Typography.size.xs, marginTop: 2 },
});
