import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Spacing, Radius } from '../../src/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type Variant = 'info' | 'warning' | 'danger' | 'success';

interface Props {
  variant: Variant;
  title: string;
  message: string;
  icon?: IoniconName;
  actionText?: string;
  onAction?: () => void;
}

const ICONS: Record<Variant, IoniconName> = {
  info:    'information-circle-outline',
  warning: 'warning-outline',
  danger:  'alert-circle-outline',
  success: 'checkmark-circle-outline',
};

export function SecurityAlert({ variant, title, message, icon, actionText, onAction }: Props) {
  const { C } = useTheme();
  const colors: Record<Variant, { bg: string; text: string; border: string }> = {
    info:    { bg: C.infoLight,    text: C.info,    border: C.info },
    warning: { bg: C.warningLight, text: C.warning, border: C.warning },
    danger:  { bg: C.dangerLight,  text: C.danger,  border: C.danger },
    success: { bg: C.successLight, text: C.success, border: C.success },
  };
  const vc = colors[variant];

  return (
    <View style={[
      styles.container,
      { backgroundColor: vc.bg, borderColor: `${vc.border}40`, borderRadius: Radius.lg },
    ]}>
      <Ionicons name={icon ?? ICONS[variant]} size={20} color={vc.text} />
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: vc.text }]}>{title}</Text>
        <Text style={[styles.message, { color: vc.text, opacity: 0.85 }]}>{message}</Text>
        {actionText && onAction && (
          <TouchableOpacity onPress={onAction} style={styles.actionBtn}>
            <Text style={[styles.actionText, { color: vc.text }]}>{actionText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  textWrap: { flex: 1, gap: 2 },
  title: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
  },
  message: {
    fontSize: Typography.size.sm,
    lineHeight: 18,
  },
  actionBtn: { marginTop: Spacing.xs },
  actionText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    textDecorationLine: 'underline',
  },
});

export default SecurityAlert;
