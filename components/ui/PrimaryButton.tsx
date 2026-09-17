import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, type ViewStyle, type TextStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Radius, Spacing } from '../../src/constants/theme';

interface Props {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function PrimaryButton({ onPress, title, loading, disabled, style, textStyle, icon }: Props) {
  const { C } = useTheme();
  const isDisabled = loading || disabled;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        styles.btn,
        { backgroundColor: C.primary, borderRadius: Radius.button },
        isDisabled && { opacity: 0.6 },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : (
          <>
            {icon}
            <Text style={[styles.text, textStyle]}>{title}</Text>
          </>
        )
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
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

export default PrimaryButton;
