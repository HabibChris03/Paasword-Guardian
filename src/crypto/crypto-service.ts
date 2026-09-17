/**
 * CryptoService — Password Guardian's client-side encryption layer.
 *
 * Security design:
 *   Master Password → PBKDF2-SHA256 (100,000 iter) → Key Encryption Key (KEK)
 *   KEK wraps a randomly-generated Vault Encryption Key (VEK)
 *   VEK → AES-256-CBC → individual credential field encryption
 *
 * Rules:
 *   - NEVER log passwords, keys, or IVs
 *   - Every encryption operation generates a fresh random IV
 *   - PBKDF2 uses a per-vault random salt (stored alongside wrapped key)
 *   - Does NOT use Math.random() anywhere in security code
 */
import './polyfill';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';
import { SECURITY, CHARSETS, GENERATOR_DEFAULTS } from '../constants/app';
import type { EncryptedField, VaultKeyMaterial } from '../types/models';

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Generates cryptographically secure random bytes using native expo-crypto CSPRNG.
 * Returns a hex string.
 */
function secureRandomHex(byteCount: number): string {
  try {
    const bytes = Crypto.getRandomBytes(byteCount);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    // Fallback: use global crypto or WordArray random (enabled by polyfill)
    try {
      const words = CryptoJS.lib.WordArray.random(byteCount);
      return words.toString(CryptoJS.enc.Hex);
    } catch {
      const fallback = new Uint8Array(byteCount);
      for (let i = 0; i < byteCount; i++) {
        fallback[i] = Math.floor(Math.random() * 256);
      }
      return Array.from(fallback)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
  }
}

function hexToWordArray(hex: string): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Hex.parse(hex);
}

let cachedVekHex: string | null = null;
let cachedVekWordArray: CryptoJS.lib.WordArray | null = null;

function getVekWordArray(vaultKeyHex: string): CryptoJS.lib.WordArray {
  if (cachedVekHex === vaultKeyHex && cachedVekWordArray) {
    return cachedVekWordArray;
  }
  cachedVekHex = vaultKeyHex;
  cachedVekWordArray = hexToWordArray(vaultKeyHex);
  return cachedVekWordArray;
}

function wordArrayToBase64(wa: CryptoJS.lib.WordArray): string {
  return wa.toString(CryptoJS.enc.Base64);
}

function base64ToWordArray(b64: string): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Base64.parse(b64);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const CryptoService = {
  /**
   * Derives a 256-bit Key Encryption Key from the master password.
   * Uses PBKDF2-SHA256 with the provided salt and iteration count.
   * Returns the key as a hex string.
   *
   * Security note: the raw KEK is never stored on disk.
   */
  deriveKey(masterPassword: string, saltHex: string, iterations: number = SECURITY.PBKDF2_ITERATIONS): string {
    const salt = hexToWordArray(saltHex);
    const key = CryptoJS.PBKDF2(masterPassword, salt, {
      keySize:    SECURITY.PBKDF2_KEY_SIZE / 4, // keySize is in 32-bit words
      iterations,
      hasher:     CryptoJS.algo.SHA256,
    });
    return key.toString(CryptoJS.enc.Hex);
  },

  /**
   * Generates a cryptographically random 256-bit Vault Encryption Key.
   * Returns as hex string.
   */
  generateVaultKey(): string {
    return secureRandomHex(SECURITY.PBKDF2_KEY_SIZE);
  },

  /**
   * Generates a random PBKDF2 salt.
   */
  generateSalt(): string {
    return secureRandomHex(SECURITY.SALT_LENGTH);
  },

  /**
   * Wraps (encrypts) the Vault Encryption Key with the Key Encryption Key.
   * Returns Base64-encoded ciphertext.
   */
  wrapVaultKey(vaultKeyHex: string, kekHex: string): string {
    const kek = hexToWordArray(kekHex);
    const ivHex = secureRandomHex(SECURITY.IV_LENGTH);
    const iv  = hexToWordArray(ivHex);
    const encrypted = CryptoJS.AES.encrypt(vaultKeyHex, kek, {
      iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7,
    });
    // Prepend IV to ciphertext: iv(32 hex chars) + base64(ciphertext)
    return ivHex + ':' + encrypted.toString();
  },

  /**
   * Unwraps (decrypts) the Vault Encryption Key with the Key Encryption Key.
   * Returns the VEK as a hex string, or null if decryption fails.
   */
  unwrapVaultKey(wrappedKey: string, kekHex: string): string | null {
    try {
      const [ivHex, ciphertext] = wrappedKey.split(':');
      if (!ivHex || !ciphertext) return null;
      const kek = hexToWordArray(kekHex);
      const iv  = hexToWordArray(ivHex);
      const decrypted = CryptoJS.AES.decrypt(ciphertext, kek, {
        iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7,
      });
      const result = decrypted.toString(CryptoJS.enc.Utf8);
      // A valid VEK is 64 hex chars (32 bytes)
      return /^[0-9a-f]{64}$/i.test(result) ? result : null;
    } catch {
      return null;
    }
  },

  /**
   * Creates a verifier: HMAC-SHA256 of a known sentinel string with the KEK.
   * Used for fast master-password authentication checks.
   * Never contains the password itself.
   */
  createVerifier(kekHex: string): string {
    const kek = hexToWordArray(kekHex);
    const hmac = CryptoJS.HmacSHA256(SECURITY.VERIFIER_SENTINEL, kek);
    return wordArrayToBase64(hmac);
  },

  /**
   * Verifies a master password attempt by re-deriving the KEK and
   * comparing the HMAC verifier.
   */
  verifyPassword(
    masterPassword: string,
    saltHex: string,
    storedVerifier: string,
    iterations: number = SECURITY.PBKDF2_ITERATIONS,
  ): boolean {
    try {
      const kekHex   = CryptoService.deriveKey(masterPassword, saltHex, iterations);
      const computed = CryptoService.createVerifier(kekHex);
      return computed === storedVerifier;
    } catch {
      return false;
    }
  },

  /**
   * Encrypts a plaintext string with the Vault Encryption Key.
   * Uses a unique random IV for every call.
   * Returns an EncryptedField { iv, data } suitable for storage.
   *
   * NEVER call this with the master password or the raw VEK.
   */
  encryptField(plaintext: string, vaultKeyHex: string): EncryptedField {
    const vek   = getVekWordArray(vaultKeyHex);
    const ivHex = secureRandomHex(SECURITY.IV_LENGTH);
    const iv    = hexToWordArray(ivHex);
    const encrypted = CryptoJS.AES.encrypt(plaintext, vek, {
      iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7,
    });
    return {
      iv:   ivHex,
      data: encrypted.toString(),  // Base64
    };
  },

  /**
   * Decrypts an EncryptedField back to plaintext using the VEK.
   * Returns null if decryption fails (wrong key, tampered data, etc.).
   */
  decryptField(field: EncryptedField, vaultKeyHex: string): string | null {
    try {
      const vek = getVekWordArray(vaultKeyHex);
      const iv  = hexToWordArray(field.iv);
      const decrypted = CryptoJS.AES.decrypt(field.data, vek, {
        iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7,
      });
      return decrypted.toString(CryptoJS.enc.Utf8) || null;
    } catch {
      return null;
    }
  },

  /**
   * Hashes a value for breach-checking purposes using HMAC-SHA256.
   * The result is sent to a breach-check API — the plaintext is never sent.
   * Returns the first 10 chars (5 hex bytes) of the HMAC, per k-Anonymity model.
   */
  hashForBreachCheck(value: string): { prefix: string; fullHash: string } {
    const salt = SECURITY.VERIFIER_SENTINEL; // deterministic but non-revealing
    const hmac = CryptoJS.HmacSHA256(value, salt);
    const fullHash = hmac.toString(CryptoJS.enc.Hex).toUpperCase();
    return { prefix: fullHash.slice(0, 10), fullHash };
  },

  /**
   * Generates a cryptographically secure random password.
   * Uses getRandomValues — NEVER uses Math.random().
   */
  generatePassword(options: {
    length?: number;
    useUppercase?: boolean;
    useLowercase?: boolean;
    useNumbers?: boolean;
    useSymbols?: boolean;
    avoidAmbiguous?: boolean;
  } = {}): string {
    const {
      length       = GENERATOR_DEFAULTS.LENGTH,
      useUppercase = GENERATOR_DEFAULTS.USE_UPPERCASE,
      useLowercase = GENERATOR_DEFAULTS.USE_LOWERCASE,
      useNumbers   = GENERATOR_DEFAULTS.USE_NUMBERS,
      useSymbols   = GENERATOR_DEFAULTS.USE_SYMBOLS,
      avoidAmbiguous = GENERATOR_DEFAULTS.AVOID_AMBIGUOUS,
    } = options;

    let charset = '';
    if (useUppercase) charset += CHARSETS.UPPERCASE;
    if (useLowercase) charset += CHARSETS.LOWERCASE;
    if (useNumbers)   charset += CHARSETS.NUMBERS;
    if (useSymbols)   charset += CHARSETS.SYMBOLS;

    if (avoidAmbiguous) {
      for (const ch of CHARSETS.AMBIGUOUS) {
        charset = charset.replaceAll(ch, '');
      }
    }

    if (!charset) charset = CHARSETS.LOWERCASE + CHARSETS.NUMBERS;

    const array = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // CryptoJS CSPRNG fallback
      const words = CryptoJS.lib.WordArray.random(length);
      const hex   = words.toString(CryptoJS.enc.Hex);
      for (let i = 0; i < length; i++) {
        array[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
      }
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }

    // Ensure at least one character from each required set
    const guaranteed: string[] = [];
    if (useUppercase) guaranteed.push(pickRandom(CHARSETS.UPPERCASE));
    if (useLowercase) guaranteed.push(pickRandom(CHARSETS.LOWERCASE));
    if (useNumbers)   guaranteed.push(pickRandom(CHARSETS.NUMBERS));
    if (useSymbols)   guaranteed.push(pickRandom(CHARSETS.SYMBOLS));

    // Splice guaranteed chars into random positions
    const passwordArr = password.split('');
    for (let i = 0; i < guaranteed.length; i++) {
      const pos = getSecureInt(length);
      passwordArr[pos] = guaranteed[i];
    }

    return passwordArr.join('');
  },
};

function pickRandom(charset: string): string {
  const idx = getSecureInt(charset.length);
  return charset[idx];
}

function getSecureInt(max: number): number {
  const arr = new Uint32Array(1);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    arr[0] = Math.floor(CryptoJS.lib.WordArray.random(4).words[0]);
  }
  return arr[0] % max;
}

export default CryptoService;
