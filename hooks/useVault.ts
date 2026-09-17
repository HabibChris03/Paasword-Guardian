/**
 * useVault — hook for credential CRUD operations.
 * Requires the vault to be unlocked (vaultKey present in context).
 */
import { useState, useCallback } from 'react';
import { useVaultContext } from '../src/context/vault-context';
import { VaultService } from '../src/services/vault-service';
import type { Credential, DecryptedCredential, CredentialCategory } from '../src/types/models';

export function useVault() {
  const { vaultKey } = useVaultContext();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const requireKey = (): string => {
    if (!vaultKey) throw new Error('Vault is locked');
    return vaultKey;
  };

  const getCredentials = useCallback(async (): Promise<Credential[]> => {
    setError(null);
    try {
      return await VaultService.getCredentials();
    } catch {
      setError('Unable to load passwords.');
      return [];
    }
  }, []);

  const decryptCredential = useCallback(async (
    credential: Credential,
  ): Promise<DecryptedCredential | null> => {
    try {
      const key = requireKey();
      return await VaultService.decryptCredential(credential, key);
    } catch {
      setError('Unable to decrypt credential.');
      return null;
    }
  }, [vaultKey]);

  const createCredential = useCallback(async (data: {
    title: string; website: string; username: string; password: string;
    notes: string; categoryId: CredentialCategory; tags: string[];
  }): Promise<Credential | null> => {
    setLoading(true);
    setError(null);
    try {
      const key = requireKey();
      const result = await VaultService.createCredential(data, key);
      return result;
    } catch {
      setError('Unable to save password.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [vaultKey]);

  const updateCredential = useCallback(async (
    id: string,
    updates: Parameters<typeof VaultService.updateCredential>[1],
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const key = requireKey();
      const result = await VaultService.updateCredential(id, updates, key);
      return !!result;
    } catch {
      setError('Unable to update password.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [vaultKey]);

  const deleteCredential = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      return await VaultService.deleteCredential(id);
    } catch {
      setError('Unable to delete credential.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string): Promise<boolean> => {
    try {
      return await VaultService.toggleFavorite(id);
    } catch {
      return false;
    }
  }, []);

  const search = useCallback(async (query: string): Promise<Credential[]> => {
    try {
      return await VaultService.search(query);
    } catch {
      return [];
    }
  }, []);

  return {
    loading, error, getCredentials, decryptCredential,
    createCredential, updateCredential, deleteCredential,
    toggleFavorite, search,
  };
}
