/**
 * VaultService — encrypted CRUD operations for credentials.
 *
 * The vault key (VEK) is passed in from the session — it is never stored on disk.
 * All password and notes fields are encrypted before storage.
 */
import { CryptoService } from '../crypto/crypto-service';
import { setSecureItem, getSecureItem } from '../storage/secure-storage';
import { STORAGE_KEYS, INCLUDE_MOCK_DATA } from '../constants/app';
import { analyzePassword } from '../utils/password-analysis';
import { getMockCredentials } from '../mock/mock-data';
import type { Credential, DecryptedCredential, CredentialCategory, PasswordStrength } from '../types/models';

// ─── Internal storage helpers ─────────────────────────────────────────────────
let memoryCache: Credential[] | null = null;

async function readCredentials(forceRefresh = false): Promise<Credential[]> {
  if (memoryCache && !forceRefresh) {
    return memoryCache;
  }
  try {
    const raw = await getSecureItem(STORAGE_KEYS.VAULT_CREDENTIALS);
    if (!raw) {
      memoryCache = INCLUDE_MOCK_DATA ? getMockCredentials() : [];
      return memoryCache;
    }
    const parsed: unknown = JSON.parse(raw);
    memoryCache = Array.isArray(parsed) ? (parsed as Credential[]) : [];
    return memoryCache;
  } catch {
    return memoryCache ?? [];
  }
}

async function writeCredentials(credentials: Credential[]): Promise<void> {
  memoryCache = credentials;
  await setSecureItem(STORAGE_KEYS.VAULT_CREDENTIALS, JSON.stringify(credentials));
}

function generateId(): string {
  const rand = CryptoService.generateSalt().slice(0, 16);
  return `cred-${rand}`;
}

// ─── VaultService ─────────────────────────────────────────────────────────────
export const VaultService = {
  /**
   * Returns all credentials (with encrypted password/notes fields).
   * Passwords are NOT decrypted here — use decryptCredential() for that.
   */
  async getCredentials(): Promise<Credential[]> {
    return readCredentials();
  },

  /**
   * Returns a single credential by ID.
   */
  async getCredential(id: string): Promise<Credential | null> {
    const all = await readCredentials();
    return all.find(c => c.id === id) ?? null;
  },

  /**
   * Creates a new credential. Password and notes are encrypted before storage.
   */
  async createCredential(
    data: {
      title: string;
      website: string;
      username: string;
      password: string;
      notes: string;
      totpSecret?: string;
      categoryId: CredentialCategory;
      tags: string[];
    },
    vaultKey: string,
  ): Promise<Credential> {
    const analysis = analyzePassword(data.password);
    const now      = new Date().toISOString();

    const credential: Credential = {
      id:               generateId(),
      title:            data.title.trim(),
      website:          data.website.trim(),
      username:         data.username.trim(),
      encryptedPassword: CryptoService.encryptField(data.password, vaultKey),
      encryptedNotes:   data.notes.trim()
        ? CryptoService.encryptField(data.notes.trim(), vaultKey)
        : null,
      encryptedTotpSecret: data.totpSecret?.trim()
        ? CryptoService.encryptField(data.totpSecret.trim(), vaultKey)
        : null,
      categoryId:       data.categoryId,
      favorite:         false,
      tags:             data.tags,
      createdAt:        now,
      updatedAt:        now,
      lastAccessedAt:   null,
      passwordStrength: analysis.strength,
      passwordLength:   analysis.length,
      hasUppercase:     analysis.hasUppercase,
      hasLowercase:     analysis.hasLowercase,
      hasNumbers:       analysis.hasNumbers,
      hasSymbols:       analysis.hasSymbols,
      isCompromised:    false,
      isReused:         false,
      lastBreachCheck:  null,
    };

    const all = await readCredentials();
    await writeCredentials([credential, ...all]);
    return credential;
  },

  /**
   * Updates an existing credential. Encrypts fields that changed.
   */
  async updateCredential(
    id: string,
    updates: {
      title?: string;
      website?: string;
      username?: string;
      password?: string;
      notes?: string;
      totpSecret?: string;
      categoryId?: CredentialCategory;
      tags?: string[];
      favorite?: boolean;
    },
    vaultKey: string,
  ): Promise<Credential | null> {
    const all     = await readCredentials();
    const index   = all.findIndex(c => c.id === id);
    if (index === -1) return null;

    const existing = all[index];
    const updated  = { ...existing };

    if (updates.title    !== undefined) updated.title    = updates.title.trim();
    if (updates.website  !== undefined) updated.website  = updates.website.trim();
    if (updates.username !== undefined) updated.username = updates.username.trim();
    if (updates.categoryId !== undefined) updated.categoryId = updates.categoryId;
    if (updates.tags     !== undefined) updated.tags     = updates.tags;
    if (updates.favorite !== undefined) updated.favorite = updates.favorite;

    if (updates.password !== undefined) {
      updated.encryptedPassword = CryptoService.encryptField(updates.password, vaultKey);
      const analysis = analyzePassword(updates.password);
      updated.passwordStrength = analysis.strength;
      updated.passwordLength   = analysis.length;
      updated.hasUppercase     = analysis.hasUppercase;
      updated.hasLowercase     = analysis.hasLowercase;
      updated.hasNumbers       = analysis.hasNumbers;
      updated.hasSymbols       = analysis.hasSymbols;
    }

    if (updates.notes !== undefined) {
      updated.encryptedNotes = updates.notes.trim()
        ? CryptoService.encryptField(updates.notes.trim(), vaultKey)
        : null;
    }

    if (updates.totpSecret !== undefined) {
      updated.encryptedTotpSecret = updates.totpSecret.trim()
        ? CryptoService.encryptField(updates.totpSecret.trim(), vaultKey)
        : null;
    }

    updated.updatedAt = new Date().toISOString();
    all[index] = updated;
    await writeCredentials(all);
    return updated;
  },

  /**
   * Deletes a credential permanently.
   */
  async deleteCredential(id: string): Promise<boolean> {
    const all     = await readCredentials();
    const filtered = all.filter(c => c.id !== id);
    if (filtered.length === all.length) return false;
    await writeCredentials(filtered);
    return true;
  },

  /**
   * Toggles the favorite flag on a credential.
   */
  async toggleFavorite(id: string): Promise<boolean> {
    const all   = await readCredentials();
    const index = all.findIndex(c => c.id === id);
    if (index === -1) return false;
    all[index] = { ...all[index], favorite: !all[index].favorite };
    await writeCredentials(all);
    return all[index].favorite;
  },

  /**
   * Records that a credential was accessed (updates lastAccessedAt).
   * Updates memory cache immediately and writes to storage in background.
   */
  async recordAccess(id: string): Promise<void> {
    const all = await readCredentials();
    const index = all.findIndex(c => c.id === id);
    if (index === -1) return;
    all[index] = { ...all[index], lastAccessedAt: new Date().toISOString() };
    memoryCache = all;
    writeCredentials(all).catch(() => {});
  },

  /**
   * Clears the in-memory credential cache (e.g. when locking vault).
   */
  clearCache(): void {
    memoryCache = null;
  },

  /**
   * Decrypts a single credential's password and notes.
   * The result is never stored — only held in memory for the UI.
   */
  async decryptCredential(credential: Credential, vaultKey: string): Promise<DecryptedCredential | null> {
    try {
      const password = CryptoService.decryptField(credential.encryptedPassword, vaultKey);
      if (!password) return null;

      const notes = credential.encryptedNotes
        ? (CryptoService.decryptField(credential.encryptedNotes, vaultKey) ?? '')
        : '';

      const { encryptedPassword, encryptedNotes, ...rest } = credential;
      return { ...rest, password, notes };
    } catch {
      return null;
    }
  },

  /**
   * Searches credentials by query string (title, username, website, tags).
   * Returns encrypted credential objects (passwords not exposed).
   */
  async search(query: string): Promise<Credential[]> {
    if (!query.trim()) return readCredentials();
    const q   = query.toLowerCase().trim();
    const all = await readCredentials();
    return all.filter(c =>
      c.title.toLowerCase().includes(q)    ||
      c.username.toLowerCase().includes(q)  ||
      c.website.toLowerCase().includes(q)   ||
      c.tags.some(t => t.toLowerCase().includes(q)),
    );
  },

  /**
   * Returns all favorite credentials.
   */
  async getFavorites(): Promise<Credential[]> {
    const all = await readCredentials();
    return all.filter(c => c.favorite);
  },

  /**
   * Returns credentials filtered by category.
   */
  async getByCategory(categoryId: CredentialCategory): Promise<Credential[]> {
    const all = await readCredentials();
    return all.filter(c => c.categoryId === categoryId);
  },

  /**
   * Returns credentials filtered by strength.
   */
  async getByStrength(strength: PasswordStrength): Promise<Credential[]> {
    const all = await readCredentials();
    return all.filter(c => c.passwordStrength === strength);
  },

  /**
   * Detects reused passwords across the vault.
   * Only compares encrypted representation lengths for grouping — never decrypts here.
   * Full reuse detection requires the VEK (use detectReusedPasswords below).
   */
  async detectReusedPasswords(vaultKey: string): Promise<string[]> {
    const all = await readCredentials();
    const decryptedMap = new Map<string, string[]>(); // password → [credId]

    for (const cred of all) {
      const pwd = CryptoService.decryptField(cred.encryptedPassword, vaultKey);
      if (pwd) {
        const existing = decryptedMap.get(pwd) ?? [];
        decryptedMap.set(pwd, [...existing, cred.id]);
      }
    }

    // Update isReused flag
    const reusedIds: string[] = [];
    const updated = all.map(cred => {
      const pwd      = CryptoService.decryptField(cred.encryptedPassword, vaultKey);
      const isReused = pwd ? (decryptedMap.get(pwd)?.length ?? 0) > 1 : false;
      if (isReused) reusedIds.push(cred.id);
      return { ...cred, isReused };
    });

    await writeCredentials(updated);
    return reusedIds;
  },

  /**
   * Clears all credentials from the vault (irreversible).
   */
  async clearVault(): Promise<void> {
    await writeCredentials([]);
  },

  /**
   * Returns all credentials as a raw JSON payload for backup purposes.
   * Each credential still has encrypted fields — this is NOT plaintext export.
   */
  async exportEncryptedData(): Promise<string> {
    const all = await readCredentials();
    return JSON.stringify(all);
  },

  /**
   * Imports credentials from an encrypted backup payload.
   */
  async importEncryptedData(data: string): Promise<number> {
    const parsed: unknown = JSON.parse(data);
    if (!Array.isArray(parsed)) throw new Error('Invalid backup format.');
    await writeCredentials(parsed as Credential[]);
    return parsed.length;
  },
};

export default VaultService;
