import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Spacing } from '../../src/constants/theme';

interface Props {
  message?: string;
}

export function LoadingState({ message = 'Loading…' }: Props) {
  const { C } = useTheme();
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={[styles.text, { color: C.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
    justifyContent: 'center',
    paddingVertical: Spacing.section,
  },
  text: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.medium,
  },
});

export default LoadingState;
