import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Spacing, Radius } from '../../src/constants/theme';

interface Props {
  size?: 'sm' | 'md' | 'lg';
}

export function AppLogo({ size = 'md' }: Props) {
  const { C } = useTheme();
  const dim = size === 'sm' ? 48 : size === 'lg' ? 100 : 72;
  const iconSize = size === 'sm' ? 22 : size === 'lg' ? 48 : 34;

  return (
    <View style={[styles.logoContainer, { width: dim, height: dim, borderRadius: dim * 0.3, backgroundColor: C.primary }]}>
      <Ionicons name="shield-checkmark" size={iconSize} color="#fff" />
    </View>
  );
}

export function AppLogoWithText({ size = 'md' }: Props) {
  const { C } = useTheme();
  return (
    <View style={styles.withText}>
      <AppLogo size={size} />
      <View>
        <Text style={[styles.appName, { color: C.text }]}>Password</Text>
        <Text style={[styles.appName, styles.guardian, { color: C.primary }]}>Guardian</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  withText: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  appName: {
    fontSize: Typography.size.headingLg,
    fontWeight: Typography.weight.extrabold,
    lineHeight: 28,
  },
  guardian: {},
});
