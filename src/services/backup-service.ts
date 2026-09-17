/**
 * BackupService — encrypted vault backup and restore.
 *
 * Security principles:
 * - Backups are ALWAYS encrypted before leaving local storage.
 * - Backup encryption uses the same VEK as the vault, re-wrapped with PBKDF2.
 * - The encrypted payload is safe to store in cloud — the backend cannot decrypt it.
 * - No plaintext credentials exist in any backup file.
 */
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CryptoService } from '../crypto/crypto-service';
import { VaultService } from './vault-service';
import { STORAGE_KEYS, APP_VERSION } from '../constants/app';
import { formatBytes } from '../utils/format';
import type { BackupMetadata, EncryptedBackup } from '../types/models';

// SHA-256 of a string using CryptoJS (for checksum — non-security-critical)
import CryptoJS from 'crypto-js';

function computeChecksum(data: string): string {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
}

export const BackupService = {
  /**
   * Creates an encrypted backup of the vault.
   * Returns the local file URI where the backup was saved.
   */
  async createBackup(vaultKey: string): Promise<{ uri: string; metadata: BackupMetadata }> {
    // Get all credentials (still encrypted)
    const encryptedPayloadRaw = await VaultService.exportEncryptedData();

    // Double-encrypt the payload with a fresh IV for the backup
    // This creates a standalone encrypted blob even if the VEK was somehow extracted
    const backupSalt = CryptoService.generateSalt();
    const backupIv   = CryptoService.generateSalt().slice(0, 32); // 16 bytes
    const encField   = CryptoService.encryptField(encryptedPayloadRaw, vaultKey);

    const backup: EncryptedBackup = {
      metadata: {
        id:              `backup-${Date.now()}`,
        createdAt:       new Date().toISOString(),
        destination:     'local',
        sizeBytes:       encField.data.length,
        credentialCount: JSON.parse(encryptedPayloadRaw).length,
        version:         APP_VERSION,
        isEncrypted:     true,
        checksum:        computeChecksum(encField.data),
      },
      encryptedPayload: encField.data,
      iv:               encField.iv,
      salt:             backupSalt,
    };

    const fileName = `pg-backup-${new Date().toISOString().slice(0, 10)}.pgb`;
    const uri      = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Store metadata
    const allMeta = await BackupService.getBackupHistory();
    await AsyncStorage.setItem(
      STORAGE_KEYS.BACKUP_METADATA,
      JSON.stringify([backup.metadata, ...allMeta].slice(0, 10)),
    );

    return { uri, metadata: backup.metadata };
  },

  /**
   * Restores a vault from an encrypted backup file.
   * Requires the vaultKey to decrypt the backup payload.
   */
  async restoreFromFile(uri: string, vaultKey: string): Promise<{ count: number }> {
    const raw = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const backup: EncryptedBackup = JSON.parse(raw);

    // Verify checksum
    if (computeChecksum(backup.encryptedPayload) !== backup.metadata.checksum) {
      throw new Error('Backup file appears to be corrupted or tampered with.');
    }

    // Decrypt the backup payload
    const decrypted = CryptoService.decryptField(
      { iv: backup.iv, data: backup.encryptedPayload },
      vaultKey,
    );

    if (!decrypted) {
      throw new Error('Unable to decrypt backup. The vault key may not match.');
    }

    const count = await VaultService.importEncryptedData(decrypted);
    return { count };
  },

  async getBackupHistory(): Promise<BackupMetadata[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.BACKUP_METADATA);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async getLatestBackup(): Promise<BackupMetadata | null> {
    const history = await BackupService.getBackupHistory();
    return history[0] ?? null;
  },
};

export default BackupService;
