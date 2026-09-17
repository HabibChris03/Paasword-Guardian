/**
 * useSettings — hook for reading and writing app settings.
 */
import { useState, useEffect, useCallback } from 'react';
import { SettingsService } from '../src/services/settings-service';
import { useVaultContext } from '../src/context/vault-context';
import type { AppSettings } from '../src/types/models';

export function useSettings() {
  const { settings, refreshSettings } = useVaultContext();
  const [saving, setSaving] = useState(false);

  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K, value: AppSettings[K],
  ): Promise<void> => {
    setSaving(true);
    try {
      await SettingsService.updateSettings({ [key]: value });
      await refreshSettings();
    } finally {
      setSaving(false);
    }
  }, [refreshSettings]);

  const updateSettings = useCallback(async (
    partial: Partial<AppSettings>,
  ): Promise<void> => {
    setSaving(true);
    try {
      await SettingsService.updateSettings(partial);
      await refreshSettings();
    } finally {
      setSaving(false);
    }
  }, [refreshSettings]);

  return { settings, saving, updateSetting, updateSettings, refreshSettings };
}
