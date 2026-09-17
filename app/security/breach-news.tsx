/**
 * Screen — Data Breach News & Incident Intelligence
 * Real-time feeds and disclosures for website and application breaches.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  ScrollView,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { BreachService } from '../../src/services/breach-service';
import { Typography, Spacing, Radius, Shadows } from '../../src/constants/theme';
import { EmptyState } from '../../components/ui/EmptyState';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import type { BreachNewsItem } from '../../src/types/models';

type FilterType = 'all' | 'vault' | 'passwords' | 'recent' | 'mega';

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(0)}K`;
  }
  return num.toLocaleString();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Unknown';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function BreachNewsScreen() {
  const { C } = useTheme();
  const router = useRouter();

  const [news, setNews] = useState<BreachNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedBreach, setSelectedBreach] = useState<BreachNewsItem | null>(null);

  const loadData = useCallback(async (force = false) => {
    try {
      const items = await BreachService.fetchBreachNews(force);
      setNews(items);
    } catch {
      // Handled in service fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
  };

  const vaultAlertCount = useMemo(() => {
    return news.filter(n => !!n.matchedVaultCredentialId).length;
  }, [news]);

  const filteredNews = useMemo(() => {
    let result = news;

    // Filter type
    if (activeFilter === 'vault') {
      result = result.filter(n => !!n.matchedVaultCredentialId);
    } else if (activeFilter === 'passwords') {
      result = result.filter(n =>
        n.dataClasses.some(dc => dc.toLowerCase().includes('password'))
      );
    } else if (activeFilter === 'recent') {
      result = result.filter(n => {
        const year = parseInt((n.breachDate || n.addedDate || '').slice(0, 4), 10);
        return year >= 2024;
      });
    } else if (activeFilter === 'mega') {
      result = result.filter(n => n.pwnCount >= 10_000_000);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        n =>
          n.title.toLowerCase().includes(q) ||
          n.domain.toLowerCase().includes(q) ||
          n.name.toLowerCase().includes(q) ||
          n.dataClasses.some(dc => dc.toLowerCase().includes(q))
      );
    }

    return result;
  }, [news, activeFilter, searchQuery]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Breach News & Alerts</Text>
          <Text style={[styles.headerSubtitle, { color: C.textSecondary }]}>
            Live threat intelligence on apps & sites
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setRefreshing(true);
            loadData(true);
          }}
          style={styles.refreshButton}
          accessibilityLabel="Refresh breaches"
        >
          <Ionicons name="refresh" size={20} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Ionicons name="search-outline" size={18} color={C.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: C.text }]}
            placeholder="Search affected apps, sites, or data…"
            placeholderTextColor={C.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={C.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <FilterChip
            label="All"
            active={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
          />
          <FilterChip
            label={vaultAlertCount > 0 ? `🚨 Vault Alerts (${vaultAlertCount})` : 'Vault Alerts'}
            active={activeFilter === 'vault'}
            highlight={vaultAlertCount > 0}
            onPress={() => setActiveFilter('vault')}
          />
          <FilterChip
            label="🔑 Passwords Exposed"
            active={activeFilter === 'passwords'}
            onPress={() => setActiveFilter('passwords')}
          />
          <FilterChip
            label="📅 2024–2026"
            active={activeFilter === 'recent'}
            onPress={() => setActiveFilter('recent')}
          />
          <FilterChip
            label="💥 10M+ Leaked"
            active={activeFilter === 'mega'}
            onPress={() => setActiveFilter('mega')}
          />
        </ScrollView>
      </View>

      {/* Intelligence Feed */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={[styles.loadingText, { color: C.textSecondary }]}>
            Fetching latest breach disclosures…
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNews}
          keyExtractor={item => item.name || item.domain}
          renderItem={({ item }) => (
            <BreachCard
              item={item}
              onPress={() => setSelectedBreach(item)}
              onFixCredential={() => {
                if (item.matchedVaultCredentialId) {
                  router.push(`/vault/${item.matchedVaultCredentialId}` as any);
                }
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.feedHeader}>
              <Text style={[styles.feedCountText, { color: C.textSecondary }]}>
                Showing {filteredNews.length} verified breach incidents
              </Text>
              <View style={styles.sourceTag}>
                <Ionicons name="shield-checkmark" size={12} color={C.primary} />
                <Text style={[styles.sourceText, { color: C.primary }]}>
                  HIBP Intelligence
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No Breaches Found"
              message={
                searchQuery
                  ? `No breach records match "${searchQuery}" in this category.`
                  : activeFilter === 'vault'
                  ? 'Great news! None of your saved vault credentials match any publicly reported data breaches.'
                  : 'No breach reports found for the selected filter.'
              }
            />
          }
        />
      )}

      {/* Detailed Breach Report Modal */}
      {selectedBreach && (
        <BreachDetailModal
          breach={selectedBreach}
          visible={!!selectedBreach}
          onClose={() => setSelectedBreach(null)}
          onFixCredential={() => {
            const credId = selectedBreach.matchedVaultCredentialId;
            setSelectedBreach(null);
            if (credId) {
              router.push(`/vault/${credId}` as any);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Filter Chip Component ──────────────────────────────────────────────────
function FilterChip({
  label,
  active,
  highlight,
  onPress,
}: {
  label: string;
  active: boolean;
  highlight?: boolean;
  onPress: () => void;
}) {
  const { C } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? C.primary : highlight ? C.dangerLight : C.surface,
          borderColor: active ? C.primary : highlight ? C.danger : C.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          {
            color: active ? '#FFFFFF' : highlight ? C.danger : C.text,
            fontWeight: active || highlight ? Typography.weight.bold : Typography.weight.medium,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Breach News Card ───────────────────────────────────────────────────────
function BreachCard({
  item,
  onPress,
  onFixCredential,
}: {
  item: BreachNewsItem;
  onPress: () => void;
  onFixCredential: () => void;
}) {
  const { C } = useTheme();
  const [imageError, setImageError] = useState(false);

  const hasPasswordLeaked = item.dataClasses.some(dc =>
    dc.toLowerCase().includes('password')
  );

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: C.surface,
          borderColor: item.matchedVaultCredentialId ? C.danger : C.border,
          borderWidth: item.matchedVaultCredentialId ? 1.5 : 1,
        },
        Shadows.sm,
      ]}
    >
      {/* Vault Alert Ribbon if user has an account for this service */}
      {item.matchedVaultCredentialId && (
        <View style={[styles.alertRibbon, { backgroundColor: C.dangerLight }]}>
          <Ionicons name="warning" size={15} color={C.danger} />
          <Text style={[styles.alertRibbonText, { color: C.danger }]}>
            Account in Vault: {item.matchedCredentialTitle || item.title}
          </Text>
          <TouchableOpacity
            onPress={onFixCredential}
            style={[styles.fixBtn, { backgroundColor: C.danger }]}
          >
            <Text style={styles.fixBtnText}>Update</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Card Header: Logo, Title, Domain, Pwn Count */}
      <View style={styles.cardHeader}>
        <View style={[styles.logoContainer, { backgroundColor: C.surfaceSecondary, borderColor: C.border }]}>
          {item.logoUrl && !imageError ? (
            <Image
              source={{ uri: item.logoUrl }}
              style={styles.logoImage}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <Ionicons name="shield-outline" size={22} color={C.primary} />
          )}
        </View>

        <View style={styles.titleArea}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={[styles.breachTitle, { color: C.text }]}>
              {item.title}
            </Text>
            {item.isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={C.success}
                style={styles.verifiedIcon}
              />
            )}
          </View>
          {item.domain ? (
            <Text numberOfLines={1} style={[styles.domainText, { color: C.textSecondary }]}>
              {item.domain}
            </Text>
          ) : null}
        </View>

        <View style={[styles.pwnBadge, { backgroundColor: hasPasswordLeaked ? C.dangerLight : C.primaryMuted }]}>
          <Text style={[styles.pwnCountText, { color: hasPasswordLeaked ? C.danger : C.primaryDark }]}>
            {formatNumber(item.pwnCount)}
          </Text>
          <Text style={[styles.pwnLabel, { color: hasPasswordLeaked ? C.danger : C.primaryDark }]}>
            accounts
          </Text>
        </View>
      </View>

      {/* Excerpt Description */}
      <Text numberOfLines={2} style={[styles.descriptionText, { color: C.textSecondary }]}>
        {item.description}
      </Text>

      {/* Compromised Data Tags */}
      <View style={styles.tagsContainer}>
        {item.dataClasses.slice(0, 4).map(tag => {
          const isPass = tag.toLowerCase().includes('password');
          return (
            <View
              key={tag}
              style={[
                styles.tagChip,
                {
                  backgroundColor: isPass ? C.dangerLight : C.surfaceSecondary,
                  borderColor: isPass ? `${C.danger}40` : C.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: isPass ? C.danger : C.textSecondary },
                ]}
              >
                {tag}
              </Text>
            </View>
          );
        })}
        {item.dataClasses.length > 4 && (
          <Text style={[styles.moreTagsText, { color: C.textTertiary }]}>
            +{item.dataClasses.length - 4} more
          </Text>
        )}
      </View>

      {/* Footer Info */}
      <View style={[styles.cardFooter, { borderTopColor: C.divider }]}>
        <Text style={[styles.dateText, { color: C.textTertiary }]}>
          Breached: {formatDate(item.breachDate)}
        </Text>
        <View style={styles.readMoreContainer}>
          <Text style={[styles.readMoreText, { color: C.primary }]}>Read Incident Report</Text>
          <Ionicons name="chevron-forward" size={14} color={C.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Detailed Report Modal ──────────────────────────────────────────────────
function BreachDetailModal({
  breach,
  visible,
  onClose,
  onFixCredential,
}: {
  breach: BreachNewsItem;
  visible: boolean;
  onClose: () => void;
  onFixCredential: () => void;
}) {
  const { C } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalSafe, { backgroundColor: C.background }]}>
        {/* Modal Header */}
        <View style={[styles.modalHeader, { borderBottomColor: C.border }]}>
          <View style={styles.modalTitleContainer}>
            <Text numberOfLines={1} style={[styles.modalTitle, { color: C.text }]}>
              {breach.title}
            </Text>
            <Text style={[styles.modalSubtitle, { color: C.textSecondary }]}>
              Incident Security Disclosure
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color={C.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          {/* Vault Alert Notice */}
          {breach.matchedVaultCredentialId && (
            <View style={[styles.modalAlertCard, { backgroundColor: C.dangerLight, borderColor: C.danger }]}>
              <Ionicons name="alert-circle" size={24} color={C.danger} />
              <View style={styles.modalAlertTextContainer}>
                <Text style={[styles.modalAlertTitle, { color: C.danger }]}>
                  Action Recommended
                </Text>
                <Text style={[styles.modalAlertDesc, { color: C.text }]}>
                  You have an account saved for {breach.matchedCredentialTitle || breach.title}. We strongly recommend changing your password.
                </Text>
                <TouchableOpacity
                  onPress={onFixCredential}
                  style={[styles.modalActionBtn, { backgroundColor: C.danger }]}
                >
                  <Text style={styles.modalActionBtnText}>Open Vault Credential</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Key Metrics Card */}
          <View style={[styles.metricsGrid, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: C.text }]}>
                {formatNumber(breach.pwnCount)}
              </Text>
              <Text style={[styles.metricLabel, { color: C.textSecondary }]}>
                Accounts Compromised
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: C.divider }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: C.text }]}>
                {formatDate(breach.breachDate)}
              </Text>
              <Text style={[styles.metricLabel, { color: C.textSecondary }]}>
                Incident Date
              </Text>
            </View>
          </View>

          {/* Compromised Data Classes */}
          <View style={styles.modalSection}>
            <Text style={[styles.modalSectionTitle, { color: C.text }]}>
              Compromised Data Categories
            </Text>
            <View style={styles.modalTagsGrid}>
              {breach.dataClasses.map(dataClass => {
                const isPass = dataClass.toLowerCase().includes('password');
                return (
                  <View
                    key={dataClass}
                    style={[
                      styles.modalTagChip,
                      {
                        backgroundColor: isPass ? C.dangerLight : C.surface,
                        borderColor: isPass ? C.danger : C.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isPass ? 'key-outline' : 'document-text-outline'}
                      size={14}
                      color={isPass ? C.danger : C.textSecondary}
                    />
                    <Text
                      style={[
                        styles.modalTagText,
                        { color: isPass ? C.danger : C.text },
                      ]}
                    >
                      {dataClass}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Detailed Description */}
          <View style={styles.modalSection}>
            <Text style={[styles.modalSectionTitle, { color: C.text }]}>
              Incident Details & Analysis
            </Text>
            <View style={[styles.descriptionCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={[styles.fullDescriptionText, { color: C.text }]}>
                {breach.description}
              </Text>
            </View>
          </View>

          {/* External Links */}
          {breach.disclosureUrl && (
            <TouchableOpacity
              onPress={() => Linking.openURL(breach.disclosureUrl!)}
              style={[styles.linkButton, { backgroundColor: C.primarySurface, borderColor: C.border }]}
            >
              <Ionicons name="open-outline" size={18} color={C.primary} />
              <Text style={[styles.linkButtonText, { color: C.primary }]}>
                Read Official Security Disclosure Notice
              </Text>
            </TouchableOpacity>
          )}

          <PrimaryButton
            title="Close Report"
            onPress={onClose}
            style={styles.closeBtn}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
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
    marginRight: Spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.size.subtitle,
    fontWeight: Typography.weight.bold,
  },
  headerSubtitle: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  refreshButton: {
    padding: Spacing.xs,
  },
  searchSection: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamilyInput,
    fontSize: Typography.size.body,
    height: '100%',
  },
  filterSection: {
    paddingVertical: Spacing.xs,
  },
  filterScroll: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: Typography.size.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.size.body,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  feedCountText: {
    fontSize: Typography.size.xs,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  card: {
    borderRadius: Radius.card,
    padding: Spacing.base,
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  alertRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -Spacing.base,
    marginTop: -Spacing.base,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs + 2,
    gap: Spacing.xs,
  },
  alertRibbonText: {
    flex: 1,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  fixBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  fixBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoContainer: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 34,
    height: 34,
  },
  titleArea: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breachTitle: {
    fontSize: Typography.size.bodyLg,
    fontWeight: Typography.weight.bold,
  },
  verifiedIcon: {
    marginTop: 1,
  },
  domainText: {
    fontSize: Typography.size.xs,
    marginTop: 1,
  },
  pwnBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  pwnCountText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  pwnLabel: {
    fontSize: 10,
    marginTop: -2,
  },
  descriptionText: {
    fontSize: Typography.size.sm,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  tagChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: Typography.weight.medium,
  },
  moreTagsText: {
    fontSize: 11,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs + 2,
    borderTopWidth: 1,
    marginTop: 2,
  },
  dateText: {
    fontSize: Typography.size.xs,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  readMoreText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: Typography.size.title,
    fontWeight: Typography.weight.bold,
  },
  modalSubtitle: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalContent: {
    padding: Spacing.base,
    gap: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  modalAlertCard: {
    flexDirection: 'row',
    padding: Spacing.base,
    borderRadius: Radius.card,
    borderWidth: 1,
    gap: Spacing.md,
  },
  modalAlertTextContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  modalAlertTitle: {
    fontSize: Typography.size.bodyLg,
    fontWeight: Typography.weight.bold,
  },
  modalAlertDesc: {
    fontSize: Typography.size.sm,
    lineHeight: 18,
  },
  modalActionBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.base,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: '100%',
  },
  metricVal: {
    fontSize: Typography.size.subtitle,
    fontWeight: Typography.weight.bold,
  },
  metricLabel: {
    fontSize: Typography.size.xs,
    marginTop: 4,
  },
  modalSection: {
    gap: Spacing.sm,
  },
  modalSectionTitle: {
    fontSize: Typography.size.bodyLg,
    fontWeight: Typography.weight.bold,
  },
  modalTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  modalTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  modalTagText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  descriptionCard: {
    padding: Spacing.base,
    borderRadius: Radius.card,
    borderWidth: 1,
  },
  fullDescriptionText: {
    fontSize: Typography.size.body,
    lineHeight: 22,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.button,
    borderWidth: 1,
  },
  linkButtonText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  closeBtn: {
    marginTop: Spacing.md,
  },
});
