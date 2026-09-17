import React, { useState } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet, Text, type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Radius, Spacing } from '../../src/constants/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

/**
 * A password input with show/hide toggle.
 * Never logs the value — parents are responsible for not logging state.
 */
export function PasswordInput({ label, error, leftIcon, style, ...rest }: Props) {
  const { C } = useTheme();
  const [show, setShow] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: C.textSecondary }]}>{label}</Text>
      )}
      <View style={[
        styles.row,
        { borderColor: error ? C.danger : C.border, backgroundColor: C.surface },
      ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          {...rest}
          secureTextEntry={!show}
          style={[styles.input, { color: C.text }, style]}
          placeholderTextColor={C.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={() => setShow(v => !v)}
          hitSlop={10}
          accessibilityLabel={show ? 'Hide password' : 'Show password'}
          style={styles.eyeBtn}
        >
          <Ionicons
            name={show ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={C.textTertiary}
          />
        </TouchableOpacity>
      </View>
      {error && (
        <Text style={[styles.error, { color: C.danger }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.xs,
  },
  row: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: Spacing.md,
  },
  leftIcon: { marginRight: Spacing.sm },
  input: {
    fontFamily: Typography.fontFamilyInput,
    flex: 1,
    fontSize: Typography.size.body,
    height: '100%',
    paddingVertical: 0,
    letterSpacing: 0.3,
  },
  eyeBtn: { padding: Spacing.xs },
  error: {
    fontSize: Typography.size.xs,
    marginTop: Spacing.xs,
  },
});

export default PasswordInput;
