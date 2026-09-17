import React from 'react';
import { TouchableOpacity, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Radius, Spacing } from '../../src/constants/theme';

interface Props {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function DangerButton({ onPress, title, disabled, style }: Props) {
  const { C } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        styles.btn,
        { backgroundColor: C.danger, borderRadius: Radius.button },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    width: '100%',
  },
  text: {
    fontFamily: 'CocomatPro-Bold',
    color: '#fff',
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.bold,
  },
});

export default DangerButton;
