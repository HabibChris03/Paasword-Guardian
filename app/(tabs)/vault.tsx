/**
 * Screen 08 — All Passwords (Vault Tab)
 * Filtered list, category tabs, search, sort.
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { CredentialCard } from '../../components/ui/CredentialCard';
import { SearchBar } from '../../components/ui/SearchBar';
import { FilterChip } from '../../components/ui/FilterChip';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { VaultService } from '../../src/services/vault-service';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import type { Credential, CredentialCategory } from '../../src/types/models';

type Filter = 'all' | CredentialCategory | 'favorites';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',           label: 'All' },
  { id: 'favorites',     label: '★ Favorites' },
  { id: 'social',        label: 'Social' },
  { id: 'banking',       label: 'Banking' },
  { id: 'work',          label: 'Work' },
  { id: 'email',         label: 'Email' },
  { id: 'shopping',      label: 'Shopping' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'development',   label: 'Dev' },
  { id: 'other',         label: 'Other' },
];

export default function VaultScreen() {
  const { C } = useTheme();
  const router = useRouter();
  const [all,         setAll]         = useState<Credential[]>([]);
  const [filter,      setFilter]      = useState<Filter>('all');
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const load = useCallback(async () => {
    const creds = await VaultService.getCredentials();
    setAll(creds);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleFavorite = async (id: string) => {
    await VaultService.toggleFavorite(id);
    load();
  };

  const displayed = all.filter(c => {
    const matchesFilter =
      filter === 'all'      ? true :
      filter === 'favorites' ? c.favorite :
      c.categoryId === filter;

    if (!matchesFilter) return false;

    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q)    ||
      c.username.toLowerCase().includes(q)  ||
      c.website.toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingState message="Loading your vault…" />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: C.text }]}>Vault</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => router.push('/vault/search')}
            style={[styles.headerBtn, { backgroundColor: C.surfaceSecondary }]}
            accessibilityLabel="Search passwords"
          >
            <Ionicons name="search-outline" size={20} color={C.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/vault/add')}
            style={[styles.headerBtn, { backgroundColor: C.primary }]}
            accessibilityLabel="Add password"
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>

      {/* Category filters */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTERS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.filtersRow}
        renderItem={({ item }) => (
          <FilterChip
            label={item.label}
            selected={filter === item.id}
            onPress={() => setFilter(item.id)}
          />
        )}
        style={styles.filtersScroll}
      />

      {/* Credentials */}
      <FlatList
        data={displayed}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        ListHeaderComponent={
          <Text style={[styles.count, { color: C.textSecondary }]}>
            {displayed.length} {displayed.length === 1 ? 'password' : 'passwords'}
          </Text>
        }
        renderItem={({ item }) => (
          <CredentialCard
            credential={item}
            onPress={() => router.push(`/vault/${item.id}` as any)}
            onFavoritePress={() => handleFavorite(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="lock-open-outline"
            title={search ? 'No results' : 'No passwords yet'}
            message={search ? `No passwords match "${search}"` : 'Tap + to add your first password'}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    alignItems: 'center', flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  headerTitle: { fontSize: Typography.size.headingLg, fontWeight: Typography.weight.extrabold },
  headerRight: { flexDirection: 'row', gap: Spacing.sm },
  headerBtn: {
    alignItems: 'center', borderRadius: Radius.full,
    height: 36, justifyContent: 'center', width: 36,
  },
  searchWrap: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  filtersScroll: { flexGrow: 0 },
  filtersRow: { paddingHorizontal: Spacing.base, gap: Spacing.xs, paddingBottom: Spacing.md },
  list: { paddingHorizontal: Spacing.base, paddingBottom: 90, paddingTop: Spacing.sm },
  count: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, marginBottom: Spacing.sm },
});
