import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, type ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Radius, Spacing } from '../../src/constants/theme';

interface Props {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function SecondaryButton({ onPress, title, disabled, style, icon }: Props) {
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
        {
          borderColor: C.border,
          borderRadius: Radius.button,
          backgroundColor: C.surface,
        },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.text, { color: C.text }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 8,
    height: 54,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    width: '100%',
  },
  text: {
    fontFamily: 'CocomatPro-Bold',
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.bold,
  },
});

export default SecondaryButton;
