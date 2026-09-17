/**
 * TotpService — RFC 6238 Time-based One-Time Password (TOTP) generator.
 * Pure TypeScript implementation using CryptoJS HMAC-SHA1.
 * Standard 30-second interval, 6 digits, Base32 secret key.
 */
import CryptoJS from 'crypto-js';
import HmacSHA1 from 'crypto-js/hmac-sha1';

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Converts a Base32 string to a CryptoJS WordArray.
 */
function base32ToWordArray(base32: string): CryptoJS.lib.WordArray | null {
  const cleaned = base32.toUpperCase().replace(/[\s-=]/g, '');
  if (!cleaned) return null;

  let bits = '';
  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_CHARS.indexOf(cleaned.charAt(i));
    if (val === -1) return null;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }

  if (bytes.length === 0) return null;

  const words: number[] = [];
  for (let i = 0; i < bytes.length; i++) {
    words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8);
  }

  return CryptoJS.lib.WordArray.create(words, bytes.length);
}

/**
 * Extracts a Uint8Array / number array from a CryptoJS WordArray.
 */
function wordArrayToBytes(wordArray: CryptoJS.lib.WordArray): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < wordArray.sigBytes; i++) {
    const byte = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    bytes.push(byte);
  }
  return bytes;
}

export const TotpService = {
  /**
   * Validates whether a string is a valid Base32 secret key.
   */
  isValidSecret(secret: string): boolean {
    const cleaned = secret.toUpperCase().replace(/[\s-=]/g, '');
    if (cleaned.length < 8) return false;
    for (let i = 0; i < cleaned.length; i++) {
      if (BASE32_CHARS.indexOf(cleaned.charAt(i)) === -1) return false;
    }
    return true;
  },

  /**
   * Returns remaining seconds in the current 30-second TOTP window (1 to 30).
   */
  getRemainingSeconds(): number {
    const step = 30;
    const epoch = Math.floor(Date.now() / 1000);
    return step - (epoch % step);
  },

  /**
   * Generates the current 6-digit TOTP code for a given secret key.
   * Returns null if the secret is invalid.
   */
  generateCode(secret: string, timestamp = Date.now()): string | null {
    try {
      const keyWords = base32ToWordArray(secret);
      if (!keyWords) return null;

      const epochSeconds = Math.floor(timestamp / 1000);
      const timeStep = 30;
      const counter = Math.floor(epochSeconds / timeStep);

      // Convert 64-bit integer counter to WordArray (8 bytes, big-endian)
      const high = Math.floor(counter / 0x100000000);
      const low = counter & 0xffffffff;
      const counterWords = CryptoJS.lib.WordArray.create([high, low], 8);

      // Compute HMAC-SHA1
      const hmac = HmacSHA1(counterWords, keyWords);
      const hmacBytes = wordArrayToBytes(hmac);

      if (hmacBytes.length < 20) return null;

      // RFC 4226 dynamic truncation
      const offset = hmacBytes[19] & 0x0f;
      const binaryCode =
        ((hmacBytes[offset] & 0x7f) << 24) |
        ((hmacBytes[offset + 1] & 0xff) << 16) |
        ((hmacBytes[offset + 2] & 0xff) << 8) |
        (hmacBytes[offset + 3] & 0xff);

      const otp = (binaryCode % 1000000).toString().padStart(6, '0');
      return otp;
    } catch {
      return null;
    }
  },

  /**
   * Formats a 6-digit code with a space in the middle: e.g. "482 910"
   */
  formatCode(code: string): string {
    if (code.length === 6) {
      return `${code.slice(0, 3)} ${code.slice(3)}`;
    }
    return code;
  },
};

export default TotpService;
