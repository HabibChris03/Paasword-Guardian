/**
 * SettingsService — persistent app settings management.
 * Uses AsyncStorage for non-sensitive settings data.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, TIMEOUTS } from '../constants/app';
import type { AppSettings } from '../types/models';

const DEFAULT_SETTINGS: AppSettings = {
  autoLockTimeout:            5,
  lockOnBackground:           true,
  biometricEnabled:           false,
  clipboardTimeout:           30,
  passwordRevealTimeout:      15,
  screenshotProtection:       false,
  autoWipeOnFailedAttempts:   false,
  breachMonitoringEnabled:    true,
  securityNotificationsEnabled: true,
  autoBackupEnabled:          false,
  autoBackupFrequency:        'weekly',
  backupDestination:          'local',
  theme:                      'light',
  onboardingComplete:         false,
  biometricSetupComplete:     false,
  profileName:                'My Vault',
  createdAt:                  new Date().toISOString(),
  updatedAt:                  new Date().toISOString(),
};

export const SettingsService = {
  async getSettings(): Promise<AppSettings> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
    const current = await SettingsService.getSettings();
    const updated = { ...current, ...partial, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(updated));
    return updated;
  },

  async resetSettings(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  },

  async markOnboardingComplete(): Promise<void> {
    await SettingsService.updateSettings({ onboardingComplete: true });
  },

  async getProfileName(): Promise<string> {
    const settings = await SettingsService.getSettings();
    return settings.profileName;
  },

  async setProfileName(name: string): Promise<void> {
    await SettingsService.updateSettings({ profileName: name.trim() || 'My Vault' });
  },
};

export default SettingsService;
