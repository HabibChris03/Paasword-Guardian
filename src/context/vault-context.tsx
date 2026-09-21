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
import { View, Text, StyleSheet, AppState, useColorScheme, type AppStateStatus } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { VaultState, AppSettings } from '../types/models';
import { SettingsService } from '../services/settings-service';
import { AuthService } from '../services/auth-service';
import { VaultService } from '../services/vault-service';
import { NotificationService } from '../services/notification-service';
import { Colors } from '../constants/theme';
import * as ScreenCapture from 'expo-screen-capture';

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
  const [vaultState,         setVaultState]         = useState<VaultState>('locked');
  const [vaultKey,           setVaultKey]           = useState<string | null>(null);
  const [settings,           setSettings]           = useState<AppSettings | null>(null);
  const [isPrivacyObscured,  setIsPrivacyObscured]  = useState<boolean>(false);

  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];

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

  // Block screenshots and screen recordings throughout the app
  useEffect(() => {
    const isProtectionEnabled = settings?.screenshotProtection ?? true;
    if (isProtectionEnabled) {
      ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    } else {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    }
  }, [settings?.screenshotProtection]);

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

  // Auto-lock on background & Privacy Shield
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      // Privacy / Multitasking Shield:
      // Obscures screen in OS app switcher or when backgrounded to prevent visual credential leakage
      if (nextState !== 'active' && !AuthService.isBiometricPromptActive()) {
        if (settings?.screenshotProtection ?? true) {
          setIsPrivacyObscured(true);
        }
      } else if (nextState === 'active') {
        setIsPrivacyObscured(false);
      }

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
      {isPrivacyObscured && (
        <View style={[styles.privacyShield, { backgroundColor: colors.background }]} pointerEvents="auto">
          <View style={styles.shieldContent}>
            <View style={[styles.shieldIconContainer, { backgroundColor: colors.primarySurface, shadowColor: colors.shadow }]}>
              <Ionicons name="shield-checkmark" size={52} color={colors.primary} />
            </View>
            <Text style={[styles.shieldTitle, { color: colors.text }]}>Password Guardian</Text>
            <Text style={[styles.shieldSubtitle, { color: colors.textSecondary }]}>Privacy Shield Active</Text>
          </View>
        </View>
      )}
    </VaultContext.Provider>
  );
}

export function useVaultContext(): VaultContextValue {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVaultContext must be used within VaultProvider');
  return ctx;
}

const styles = StyleSheet.create({
  privacyShield: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  shieldIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  shieldTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'CocomatPro-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  shieldSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },
});
