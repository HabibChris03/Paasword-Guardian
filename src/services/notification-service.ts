/**
 * NotificationService — activity log management.
 * Persists activity events in AsyncStorage (no sensitive data in events).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/app';
import type { ActivityEvent, ActivityType } from '../types/models';

function generateId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const MAX_EVENTS = 100;

export const NotificationService = {
  async getEvents(): Promise<ActivityEvent[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  async addEvent(
    type: ActivityType,
    title: string,
    description: string,
    options: Partial<Pick<ActivityEvent, 'credentialId' | 'credentialTitle' | 'severity'>> = {},
  ): Promise<void> {
    try {
      const events = await NotificationService.getEvents();
      const newEvent: ActivityEvent = {
        id:          generateId(),
        type,
        title,
        description,
        timestamp:   new Date().toISOString(),
        isRead:      false,
        severity:    options.severity ?? 'info',
        credentialId:    options.credentialId,
        credentialTitle: options.credentialTitle,
      };
      // Keep most recent MAX_EVENTS events
      const updated = [newEvent, ...events].slice(0, MAX_EVENTS);
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(updated));
    } catch {
      // Never let activity logging break the app
    }
  },

  async markAllRead(): Promise<void> {
    const events  = await NotificationService.getEvents();
    const updated = events.map(e => ({ ...e, isRead: true }));
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(updated));
  },

  async clearEvents(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOG);
  },

  async getUnreadCount(): Promise<number> {
    const events = await NotificationService.getEvents();
    return events.filter(e => !e.isRead).length;
  },
};

export default NotificationService;
