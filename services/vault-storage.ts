import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const VAULT_ITEMS_KEY = "passwordguardian.vault-items";

export type VaultCategory =
  | "logins"
  | "cards"
  | "notes"
  | "identity"
  | "wifi"
  | "other";

export type VaultStrength = "Weak" | "Fair" | "Good" | "Strong";

export type VaultItem = {
  id: string;
  title: string;
  username: string;
  password: string;
  category: VaultCategory;
  notes: string;
  strength: VaultStrength;
  createdAt: string;
  updatedAt: string;
};

function canUseBrowserStorage() {
  return Platform.OS === "web" && typeof globalThis.localStorage !== "undefined";
}

async function getRawItems() {
  if (canUseBrowserStorage()) {
    return globalThis.localStorage.getItem(VAULT_ITEMS_KEY);
  }

  if (await SecureStore.isAvailableAsync()) {
    return SecureStore.getItemAsync(VAULT_ITEMS_KEY);
  }

  return null;
}

async function setRawItems(value: string) {
  if (canUseBrowserStorage()) {
    globalThis.localStorage.setItem(VAULT_ITEMS_KEY, value);
    return;
  }

  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.setItemAsync(VAULT_ITEMS_KEY, value);
    return;
  }

  throw new Error("Secure storage is not available on this device.");
}

function isVaultCategory(value: unknown): value is VaultCategory {
  return (
    value === "logins" ||
    value === "cards" ||
    value === "notes" ||
    value === "identity" ||
    value === "wifi" ||
    value === "other"
  );
}

function isVaultStrength(value: unknown): value is VaultStrength {
  return (
    value === "Weak" ||
    value === "Fair" ||
    value === "Good" ||
    value === "Strong"
  );
}

function isVaultItem(value: unknown): value is VaultItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.username === "string" &&
    typeof item.password === "string" &&
    isVaultCategory(item.category) &&
    typeof item.notes === "string" &&
    isVaultStrength(item.strength) &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
}

export async function getVaultItems() {
  const rawItems = await getRawItems();

  if (!rawItems) {
    return [];
  }

  try {
    const parsedItems: unknown = JSON.parse(rawItems);

    return Array.isArray(parsedItems) ? parsedItems.filter(isVaultItem) : [];
  } catch {
    return [];
  }
}

export async function saveVaultItem(item: VaultItem) {
  const currentItems = await getVaultItems();
  const nextItems = [
    item,
    ...currentItems.filter((currentItem) => currentItem.id !== item.id),
  ];

  await setRawItems(JSON.stringify(nextItems));
}

export async function deleteVaultItem(id: string) {
  const currentItems = await getVaultItems();
  const nextItems = currentItems.filter((item) => item.id !== id);
  await setRawItems(JSON.stringify(nextItems));
}

export async function updateVaultItem(id: string, updates: Partial<Omit<VaultItem, "id" | "createdAt">>) {
  const currentItems = await getVaultItems();
  const nextItems = currentItems.map((item) =>
    item.id === id
      ? { ...item, ...updates, updatedAt: new Date().toISOString() }
      : item
  );
  await setRawItems(JSON.stringify(nextItems));
}
