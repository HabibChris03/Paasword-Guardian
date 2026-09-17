import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing } from '../../src/constants/theme';
import { analyzePassword, strengthToProgress } from '../../src/utils/password-analysis';
import { getStrengthColor, getStrengthLabel } from '../../src/constants/theme';

interface Props {
  password: string;
  showLabel?: boolean;
  showSegments?: boolean;
}

export function PasswordStrengthMeter({ password, showLabel = true, showSegments = true }: Props) {
  const { C, scheme } = useTheme();
  const analysis  = analyzePassword(password);
  const color     = getStrengthColor(analysis.strength, scheme);
  const label     = getStrengthLabel(analysis.strength);
  const progress  = strengthToProgress(analysis.strength);
  const segments  = 4;
  const filled    = Math.ceil(progress * segments);

  if (!password) return null;

  return (
    <View style={styles.wrapper}>
      {showLabel && (
        <View style={styles.header}>
          <Text style={[styles.labelText, { color: C.textSecondary }]}>Password strength</Text>
          <Text style={[styles.strengthText, { color }]}>{label}</Text>
        </View>
      )}
      {showSegments && (
        <View style={styles.segmentRow}>
          {Array.from({ length: segments }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                { backgroundColor: i < filled ? color : C.border },
              ]}
            />
          ))}
        </View>
      )}
      {analysis.issues.length > 0 && (
        <Text style={[styles.hint, { color: C.textTertiary }]}>
          {analysis.issues[0]}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', gap: 6 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  strengthText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 5,
  },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  hint: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
});

export default PasswordStrengthMeter;
