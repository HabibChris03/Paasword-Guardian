/**
 * VaultContext — global vault state accessible throughout the app.
 *
 * The vaultKey (VEK) is held in memory only, never persisted.
 * When the vault is locked, the vaultKey is cleared from state.
 */
import React, {
  createContext, useContext, useState, useCallback, useEffect, useRef,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { router } from 'expo-router';
import type { VaultState, AppSettings } from '../types/models';
import { SettingsService } from '../services/settings-service';
import { AuthService } from '../services/auth-service';
import { VaultService } from '../services/vault-service';
import { NotificationService } from '../services/notification-service';

interface VaultContextValue {
  vaultState:  VaultState;
  vaultKey:    string | null;   // In-memory only — cleared on lock
  settings:    AppSettings | null;
  unlock:      (key: string) => void;
  lock:        () => void;
  logout:      () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vaultState,  setVaultState]  = useState<VaultState>('locked');
  const [vaultKey,    setVaultKey]    = useState<string | null>(null);
  const [settings,    setSettings]    = useState<AppSettings | null>(null);

  const vaultStateRef   = useRef<VaultState>('locked');
  const vaultKeyRef     = useRef<string | null>(null);
  const appStateRef     = useRef<AppStateStatus>(AppState.currentState);
  const backgroundTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshSettings = useCallback(async () => {
    const s = await SettingsService.getSettings();
    setSettings(s);
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const unlock = useCallback((key: string) => {
    vaultKeyRef.current = key;
    vaultStateRef.current = 'unlocked';
    setVaultKey(key);
    setVaultState('unlocked');
    NotificationService.addEvent('vault-unlocked', 'Vault Unlocked', 'Your vault was unlocked successfully.', { severity: 'info' });
  }, []);

  const lock = useCallback(() => {
    VaultService.clearCache();
    vaultKeyRef.current = null;
    vaultStateRef.current = 'locked';
    setVaultKey(null);
    setVaultState('locked');
  }, []);

  const logout = useCallback(async () => {
    await AuthService.logout();
    VaultService.clearCache();
    vaultKeyRef.current = null;
    vaultStateRef.current = 'locked';
    setVaultKey(null);
    setVaultState('locked');
    NotificationService.addEvent('vault-locked', 'Logged Out', 'You have logged out of your vault.', { severity: 'info' });
  }, []);

  // Auto-lock on background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      // When the native biometric dialog is visible, OS may transition to background.
      // Ignore background transition if biometric prompt is active.
      if (AuthService.isBiometricPromptActive()) {
        return;
      }

      if (!settings) return;

      if (prev === 'active' && nextState === 'background') {
        if (settings.lockOnBackground) {
          const timeoutMs = settings.autoLockTimeout === 0
            ? 0
            : settings.autoLockTimeout * 60_000;

          backgroundTimer.current = setTimeout(() => {
            lock();
            NotificationService.addEvent('vault-locked', 'Vault Locked', 'Your vault was locked automatically.', { severity: 'info' });
          }, timeoutMs === 0 ? 500 : timeoutMs);
        }
      }

      if (nextState === 'active') {
        if (backgroundTimer.current) {
          clearTimeout(backgroundTimer.current);
          backgroundTimer.current = null;
        }

        // If biometric prompt is active, do not interrupt
        if (AuthService.isBiometricPromptActive()) {
          return;
        }

        // Only redirect to login if the vault is actually locked
        if (vaultStateRef.current === 'locked' || !vaultKeyRef.current) {
          AuthService.hasVault().then(has => {
            if (has && !AuthService.isBiometricPromptActive()) {
              router.replace('/auth/login');
            }
          });
        }
      }
    });

    return () => {
      subscription.remove();
      if (backgroundTimer.current) clearTimeout(backgroundTimer.current);
    };
  }, [settings, lock]);

  return (
    <VaultContext.Provider value={{ vaultState, vaultKey, settings, unlock, lock, logout, refreshSettings }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVaultContext(): VaultContextValue {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVaultContext must be used within VaultProvider');
  return ctx;
}
