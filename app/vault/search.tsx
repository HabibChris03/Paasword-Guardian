import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { VaultService } from '../../src/services/vault-service';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import type { Credential } from '../../src/types/models';

import CredentialCard from '../../components/ui/CredentialCard';
import FilterChip from '../../components/ui/FilterChip';
import EmptyState from '../../components/ui/EmptyState';

type FilterType = 'all' | 'favorites' | 'weak' | 'recent';

export default function SearchScreen() {
  const router = useRouter();
  const { C } = useTheme();
  const searchInputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [allCredentials, setAllCredentials] = useState<Credential[]>([]);
  const [results, setResults] = useState<Credential[]>([]);

  useEffect(() => {
    // Auto-focus search input on mount
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const creds = await VaultService.getCredentials();
      setAllCredentials(creds);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    performSearch();
  }, [searchQuery, activeFilter, allCredentials]);

  const performSearch = async () => {
    try {
      let baseResults = allCredentials;

      if (searchQuery.trim()) {
        baseResults = await VaultService.search(searchQuery);
      }

      let filtered = baseResults;
      if (activeFilter === 'favorites') {
        filtered = filtered.filter(c => c.favorite);
      } else if (activeFilter === 'weak') {
        filtered = filtered.filter(c => c.passwordStrength === 'weak' || c.passwordStrength === 'very-weak');
      } else if (activeFilter === 'recent') {
        filtered = [...filtered]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10);
      }

      setResults(filtered);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleCredentialPress = (id: string) => {
    router.push(`/vault/${id}` as any);
  };

  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      {/* Search Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>

        <View style={[styles.searchContainer, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Ionicons name="search" size={20} color={C.textSecondary} style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: C.text }]}
            placeholder="Search passwords..."
            placeholderTextColor={C.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={C.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          <FilterChip
            label="All"
            selected={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
          />
          <FilterChip
            label="★ Favorites"
            selected={activeFilter === 'favorites'}
            onPress={() => setActiveFilter('favorites')}
          />
          <FilterChip
            label="Weak Passwords"
            selected={activeFilter === 'weak'}
            onPress={() => setActiveFilter('weak')}
          />
          <FilterChip
            label="Recently Added"
            selected={activeFilter === 'recent'}
            onPress={() => setActiveFilter('recent')}
          />
        </ScrollView>
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        {results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CredentialCard
                credential={item}
                onPress={() => handleCredentialPress(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            keyboardShouldPersistTaps="handled"
          />
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              title={searchQuery ? 'No results found' : 'Nothing here'}
              message={searchQuery ? `We couldn't find anything matching "${searchQuery}"` : 'Try searching for a website or username'}
              icon="search-outline"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    fontFamily: Typography.fontFamilyInput,
    flex: 1,
    fontSize: Typography.size.body,
    height: '100%',
  },
  clearButton: {
    padding: Spacing.xs,
  },
  filtersContainer: {
    paddingVertical: Spacing.sm,
  },
  filtersScroll: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
  },
  resultsContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
});
