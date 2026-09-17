/**
 * Native Crypto Polyfill for React Native.
 * Ensures `globalThis.crypto.getRandomValues` is available so libraries like
 * crypto-js can generate secure random numbers without throwing:
 * "Native crypto module could not be used to get secure random number."
 */
import * as Crypto from 'expo-crypto';

if (typeof globalThis.crypto === 'undefined') {
  // @ts-ignore
  globalThis.crypto = {};
}

// @ts-ignore
if (typeof globalThis.crypto.getRandomValues !== 'function') {
  // @ts-ignore
  globalThis.crypto.getRandomValues = function <T extends ArrayBufferView | null>(array: T): T {
    if (!array) return array;
    const uint8 = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    const randomBytes = Crypto.getRandomBytes(uint8.byteLength);
    uint8.set(randomBytes);
    return array;
  };
}

export {};
