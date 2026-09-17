/**
 * Secure storage abstraction built on expo-secure-store with AsyncStorage fallback.
 *
 * expo-secure-store has a ~2048-character limit per key and can throw on devices
 * where the Android Keystore or iOS Keychain is inaccessible/corrupted.
 * This module transparently handles chunking AND falls back to AsyncStorage
 * (all stored data is already AES-256 encrypted before reaching here).
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SECURITY } from '../constants/app';

const CHUNK_SIZE = SECURITY.SECURE_STORE_CHUNK_SIZE;
const ASYNC_PREFIX = '__pg_sec_fallback_';

function chunkKey(baseKey: string, index: number): string {
  return `${baseKey}_chunk_${index}`;
}

function countKey(baseKey: string): string {
  return `${baseKey}_chunks`;
}

function isSecureStoreAvailable(): boolean {
  return Platform.OS !== 'web';
}

/**
 * Stores a string securely, chunking if necessary.
 * Falls back gracefully to AsyncStorage if SecureStore fails on the device.
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  if (!isSecureStoreAvailable()) {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(key, value);
      }
    } catch {}
    await AsyncStorage.setItem(`${ASYNC_PREFIX}${key}`, value);
    return;
  }

  try {
    if (value.length <= CHUNK_SIZE) {
      await clearChunks(key);
      await SecureStore.setItemAsync(key, value);
      await AsyncStorage.removeItem(`${ASYNC_PREFIX}${key}`).catch(() => null);
      return;
    }

    // Chunk the value
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }

    await SecureStore.setItemAsync(countKey(key), String(chunks.length));
    await SecureStore.deleteItemAsync(key).catch(() => null);

    await Promise.all(
      chunks.map((chunk, i) => SecureStore.setItemAsync(chunkKey(key, i), chunk)),
    );
    await AsyncStorage.removeItem(`${ASYNC_PREFIX}${key}`).catch(() => null);
  } catch (error) {
    console.warn(`SecureStore set failed for key "${key}", using AsyncStorage fallback:`, error);
    await AsyncStorage.setItem(`${ASYNC_PREFIX}${key}`, value);
  }
}

/**
 * Retrieves a securely stored string, reassembling chunks if needed,
 * or reading from fallback storage.
 */
export async function getSecureItem(key: string): Promise<string | null> {
  if (!isSecureStoreAvailable()) {
    try {
      if (typeof sessionStorage !== 'undefined') {
        const item = sessionStorage.getItem(key);
        if (item) return item;
      }
    } catch {}
    return AsyncStorage.getItem(`${ASYNC_PREFIX}${key}`);
  }

  try {
    // 1. Fast path: check single key directly without extra IPC
    const single = await SecureStore.getItemAsync(key).catch(() => null);
    if (single !== null) {
      return single;
    }

    // 2. Only check chunked count if single key is not present
    const chunkCountStr = await SecureStore.getItemAsync(countKey(key)).catch(() => null);
    if (chunkCountStr !== null) {
      const count = parseInt(chunkCountStr, 10);
      if (!isNaN(count) && count > 0) {
        const chunks = await Promise.all(
          Array.from({ length: count }, (_, i) =>
            SecureStore.getItemAsync(chunkKey(key, i)).catch(() => null),
          ),
        );
        if (!chunks.some(c => c === null)) {
          return chunks.join('');
        }
      }
    }
  } catch (error) {
    console.warn(`SecureStore get failed for key "${key}", checking AsyncStorage fallback:`, error);
  }

  // Check fallback storage
  return AsyncStorage.getItem(`${ASYNC_PREFIX}${key}`).catch(() => null);
}

/**
 * Deletes a securely stored item from all locations.
 */
export async function deleteSecureItem(key: string): Promise<void> {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(key);
    }
  } catch {}

  await AsyncStorage.removeItem(`${ASYNC_PREFIX}${key}`).catch(() => null);

  if (isSecureStoreAvailable()) {
    try {
      await clearChunks(key);
      await SecureStore.deleteItemAsync(key).catch(() => null);
    } catch (e) {
      console.warn(`SecureStore delete failed for key "${key}":`, e);
    }
  }
}

async function clearChunks(key: string): Promise<void> {
  try {
    const chunkCountStr = await SecureStore.getItemAsync(countKey(key)).catch(() => null);
    if (chunkCountStr !== null) {
      const count = parseInt(chunkCountStr, 10);
      await SecureStore.deleteItemAsync(countKey(key)).catch(() => null);
      if (!isNaN(count) && count > 0) {
        await Promise.all(
          Array.from({ length: count }, (_, i) =>
            SecureStore.deleteItemAsync(chunkKey(key, i)).catch(() => null),
          ),
        );
      }
    }
  } catch {}
}
