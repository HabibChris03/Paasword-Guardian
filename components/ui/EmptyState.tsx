import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Spacing } from '../../src/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  icon?: IoniconName;
  title: string;
  message: string;
  style?: ViewStyle;
}

export function EmptyState({ icon = 'lock-closed-outline', title, message, style }: Props) {
  const { C } = useTheme();
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconWrap, { backgroundColor: C.surfaceSecondary }]}>
        <Ionicons name={icon} size={36} color={C.textTertiary} />
      </View>
      <Text style={[styles.title, { color: C.text }]}>{title}</Text>
      <Text style={[styles.message, { color: C.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 50,
    height: 72,
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    width: 72,
  },
  title: {
    fontSize: Typography.size.subtitle,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.size.body,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default EmptyState;
