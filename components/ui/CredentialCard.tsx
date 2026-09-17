import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Spacing, Radius, Shadows } from '../../src/constants/theme';
import { CategoryIcons, CategoryColors, getStrengthColor } from '../../src/constants/theme';
import { faviconUrl } from '../../src/utils/format';
import type { Credential } from '../../src/types/models';

interface Props {
  credential: Credential;
  onPress: () => void;
  onFavoritePress?: () => void;
}

export function CredentialCard({ credential, onPress, onFavoritePress }: Props) {
  const { C, scheme } = useTheme();
  const catColor   = CategoryColors[credential.categoryId] ?? C.textTertiary;
  const catIcon    = CategoryIcons[credential.categoryId] ?? 'key-outline';
  const strColor   = getStrengthColor(credential.passwordStrength, scheme);
  const domain     = credential.website ? new URL(
    credential.website.startsWith('http') ? credential.website : `https://${credential.website}`
  ).hostname.replace('www.', '') : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={`Open ${credential.title}`}
      style={[
        styles.card,
        {
          backgroundColor: C.surface,
          borderColor: C.border,
          borderRadius: Radius.lg,
        },
        Shadows.card,
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: `${catColor}18` }]}>
        {domain ? (
          <Image
            source={{ uri: faviconUrl(domain, 64) }}
            style={styles.favicon}
            contentFit="contain"
            placeholder={{ uri: 'data:image/png;base64,iVBORw0KGgo=' }}
            transition={200}
          />
        ) : (
          <Ionicons name={catIcon as any} size={22} color={catColor} />
        )}
      </View>

      {/* Text */}
      <View style={styles.textWrap}>
        <Text numberOfLines={1} style={[styles.title, { color: C.text }]}>
          {credential.title}
        </Text>
        <Text numberOfLines={1} style={[styles.username, { color: C.textSecondary }]}>
          {credential.username}
        </Text>
      </View>

      {/* Right */}
      <View style={styles.right}>
        {credential.isCompromised ? (
          <View style={[styles.badge, { backgroundColor: C.dangerLight }]}>
            <Ionicons name="warning-outline" size={11} color={C.danger} />
            <Text style={[styles.badgeText, { color: C.danger }]}>Breach</Text>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: `${strColor}18` }]}>
            <View style={[styles.dot, { backgroundColor: strColor }]} />
            <Text style={[styles.badgeText, { color: strColor }]}>
              {credential.passwordStrength === 'very-weak' ? 'V.Weak'
                : credential.passwordStrength.charAt(0).toUpperCase() + credential.passwordStrength.slice(1)}
            </Text>
          </View>
        )}
        {onFavoritePress && (
          <TouchableOpacity onPress={onFavoritePress} hitSlop={8} accessibilityLabel="Toggle favorite">
            <Ionicons
              name={credential.favorite ? 'star' : 'star-outline'}
              size={17}
              color={credential.favorite ? '#D89B3D' : C.textTertiary}
            />
          </TouchableOpacity>
        )}
        <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 70,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: Radius.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
    overflow: 'hidden',
  },
  favicon: { width: 28, height: 28 },
  textWrap: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: 'CocomatPro-Bold',
    fontSize: Typography.size.bodyLg,
    fontWeight: Typography.weight.bold,
    lineHeight: 22,
  },
  username: {
    fontFamily: 'CocomatPro-Regular',
    fontSize: Typography.size.base,
    marginTop: 1,
  },
  right: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    alignItems: 'center',
    borderRadius: Radius.full,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold },
});

export default CredentialCard;
