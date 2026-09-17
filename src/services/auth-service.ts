/**
 * AuthService — master password setup, verification, and biometric management.
 *
 * Security principles:
 *  - Master password is NEVER stored, only the PBKDF2-derived verifier.
 *  - Biometric unlock stores only an encrypted session token, not the password.
 *  - All vault key material uses envelope encryption (see crypto-service.ts).
 */
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CryptoService } from '../crypto/crypto-service';
import { setSecureItem, getSecureItem, deleteSecureItem } from '../storage/secure-storage';
import { STORAGE_KEYS, SECURITY } from '../constants/app';
import type { VaultKeyMaterial, AppSettings } from '../types/models';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuthResult {
  success: boolean;
  error?: string;
  vaultKey?: string; // Only present on success — hex VEK, held in memory only
}

// ─── Biometric prompt state ──────────────────────────────────────────────────
let isPromptingBiometrics = false;

// ─── AuthService ──────────────────────────────────────────────────────────────
export const AuthService = {
  /**
   * Returns true while the native biometric dialog is open or settling.
   * Used to prevent false background lock transitions in AppState listeners.
   */
  isBiometricPromptActive(): boolean {
    return isPromptingBiometrics;
  },
  /**
   * Creates a new vault with the given master password.
   * Generates: salt, VEK, KEK, wraps VEK with KEK, stores key material.
   * Returns the in-memory VEK to bootstrap the first session.
   */
  async createVault(masterPassword: string): Promise<string> {
    const salt         = CryptoService.generateSalt();
    const kek          = CryptoService.deriveKey(masterPassword, salt);
    const vaultKey     = CryptoService.generateVaultKey();
    const wrappedVEK   = CryptoService.wrapVaultKey(vaultKey, kek);
    const verifier     = CryptoService.createVerifier(kek);

    const keyMaterial: VaultKeyMaterial = {
      salt,
      wrappedVaultKey: wrappedVEK,
      verifier,
      iterations: SECURITY.PBKDF2_ITERATIONS,
      algorithm: 'PBKDF2-SHA256',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setSecureItem(STORAGE_KEYS.VAULT_KEY_MATERIAL, JSON.stringify(keyMaterial));
    await setSecureItem(STORAGE_KEYS.BIOMETRIC_VAULT_KEY, vaultKey);
    await AsyncStorage.setItem(STORAGE_KEYS.FIRST_TIME, 'done');

    return vaultKey;
  },

  /**
   * Verifies a master password attempt and returns the VEK on success.
   * Returns AuthResult — never throws.
   */
  async unlockWithPassword(masterPassword: string): Promise<AuthResult> {
    try {
      const raw = await getSecureItem(STORAGE_KEYS.VAULT_KEY_MATERIAL);
      if (!raw) return { success: false, error: 'No vault found on this device.' };

      const material: VaultKeyMaterial = JSON.parse(raw);
      const isValid = CryptoService.verifyPassword(
        masterPassword, material.salt, material.verifier, material.iterations,
      );

      if (!isValid) {
        return { success: false, error: 'Incorrect master password.' };
      }

      const kek      = CryptoService.deriveKey(masterPassword, material.salt, material.iterations);
      const vaultKey = CryptoService.unwrapVaultKey(material.wrappedVaultKey, kek);

      if (!vaultKey) {
        return { success: false, error: 'Vault key could not be decrypted.' };
      }

      // Keep hardware biometric key synced
      await setSecureItem(STORAGE_KEYS.BIOMETRIC_VAULT_KEY, vaultKey);

      return { success: true, vaultKey };
    } catch {
      return { success: false, error: 'Unable to unlock your vault.' };
    }
  },

  /**
   * Unlocks the vault directly using biometrics (fingerprint/face).
   * Retrieves the securely cached VEK from hardware-backed keystore upon successful biometric authentication.
   */
  async unlockWithBiometrics(promptMessage = 'Unlock Password Guardian with your fingerprint'): Promise<AuthResult> {
    try {
      const available = await AuthService.isBiometricAvailable();
      if (!available) {
        return { success: false, error: 'Biometric authentication not available on this device.' };
      }

      const authenticated = await AuthService.authenticateWithBiometrics(promptMessage);
      if (!authenticated) {
        return { success: false, error: 'Biometric verification cancelled.' };
      }

      const vaultKey = await getSecureItem(STORAGE_KEYS.BIOMETRIC_VAULT_KEY);
      if (!vaultKey) {
        return { success: false, error: 'Please unlock once with your master password to enable fingerprint.' };
      }

      return { success: true, vaultKey };
    } catch {
      return { success: false, error: 'Biometric unlock failed.' };
    }
  },

  /**
   * Checks whether a hardware biometric session key is saved in secure storage.
   */
  async hasBiometricKey(): Promise<boolean> {
    try {
      const key = await getSecureItem(STORAGE_KEYS.BIOMETRIC_VAULT_KEY);
      return !!key && key.length > 0;
    } catch {
      return false;
    }
  },

  /**
   * Clears the hardware biometric session key.
   * After logout, fingerprint unlock is disabled until the user logs in again with master password.
   */
  async logout(): Promise<void> {
    await deleteSecureItem(STORAGE_KEYS.BIOMETRIC_VAULT_KEY);
  },

  /**
   * Checks if a vault has been created on this device.
   */
  async hasVault(): Promise<boolean> {
    try {
      const material = await getSecureItem(STORAGE_KEYS.VAULT_KEY_MATERIAL);
      return !!material;
    } catch {
      return false;
    }
  },

  /**
   * Returns true if biometric authentication is available and enrolled.
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled   = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch {
      return false;
    }
  },

  /**
   * Returns the types of biometric authentication available.
   */
  async getBiometricType(): Promise<'fingerprint' | 'face' | 'iris' | 'none'> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face';
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'iris';
      return 'none';
    } catch {
      return 'none';
    }
  },

  /**
   * Prompts the user for biometric authentication.
   * Returns true if authenticated successfully.
   */
  async authenticateWithBiometrics(promptMessage = 'Unlock your vault'): Promise<boolean> {
    try {
      isPromptingBiometrics = true;
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Use Password',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch {
      return false;
    } finally {
      // Delay releasing flag so AppState change listener doesn't falsely lock
      setTimeout(() => {
        isPromptingBiometrics = false;
      }, 600);
    }
  },

  /**
   * Changes the master password. Steps:
   * 1. Verify current password
   * 2. Derive new KEK
   * 3. Re-wrap VEK with new KEK
   * 4. Update key material in storage
   */
  async changeMasterPassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const raw = await getSecureItem(STORAGE_KEYS.VAULT_KEY_MATERIAL);
      if (!raw) return { success: false, error: 'No vault found.' };

      const material: VaultKeyMaterial = JSON.parse(raw);
      const oldKek = CryptoService.deriveKey(currentPassword, material.salt, material.iterations);

      // Verify current password
      const verifier = CryptoService.createVerifier(oldKek);
      if (verifier !== material.verifier) {
        return { success: false, error: 'Current password is incorrect.' };
      }

      // Unwrap existing VEK
      const vaultKey = CryptoService.unwrapVaultKey(material.wrappedVaultKey, oldKek);
      if (!vaultKey) return { success: false, error: 'Failed to read vault key.' };

      // Derive new KEK with a fresh salt
      const newSalt     = CryptoService.generateSalt();
      const newKek      = CryptoService.deriveKey(newPassword, newSalt);
      const newWrapped  = CryptoService.wrapVaultKey(vaultKey, newKek);
      const newVerifier = CryptoService.createVerifier(newKek);

      const updated: VaultKeyMaterial = {
        ...material,
        salt:            newSalt,
        wrappedVaultKey: newWrapped,
        verifier:        newVerifier,
        updatedAt:       new Date().toISOString(),
      };

      await setSecureItem(STORAGE_KEYS.VAULT_KEY_MATERIAL, JSON.stringify(updated));
      await setSecureItem(STORAGE_KEYS.BIOMETRIC_VAULT_KEY, vaultKey);
      return { success: true };
    } catch {
      return { success: false, error: 'Unable to change master password.' };
    }
  },

  /**
   * Permanently deletes all vault data from this device.
   * This action is IRREVERSIBLE.
   */
  async deleteVault(): Promise<void> {
    await deleteSecureItem(STORAGE_KEYS.VAULT_KEY_MATERIAL);
    await deleteSecureItem(STORAGE_KEYS.VAULT_CREDENTIALS);
    await deleteSecureItem(STORAGE_KEYS.BIOMETRIC_VAULT_KEY);
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.APP_SETTINGS,
      STORAGE_KEYS.ACTIVITY_LOG,
      STORAGE_KEYS.BREACH_SCAN_RESULT,
      STORAGE_KEYS.BACKUP_METADATA,
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.FIRST_TIME,
    ]);
  },

  /**
   * Returns whether the user has completed onboarding.
   */
  async isFirstTime(): Promise<boolean> {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_TIME);
    return val === null;
  },
};

export default AuthService;
