import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Spacing, Radius, Shadows } from '../../src/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
  icon?: IoniconName;
}

export function ConfirmationModal({
  visible, title, message, confirmText = 'Confirm', cancelText = 'Cancel',
  onConfirm, onCancel, isDanger = false, icon,
}: Props) {
  const { C } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={[styles.overlay, { backgroundColor: C.overlay }]}>
        <View style={[
          styles.sheet,
          { backgroundColor: C.surface, borderRadius: Radius.xl },
          Shadows.lg,
        ]}>
          {icon && (
            <View style={[styles.iconWrap, { backgroundColor: isDanger ? C.dangerLight : C.primaryMuted }]}>
              <Ionicons name={icon} size={26} color={isDanger ? C.danger : C.primary} />
            </View>
          )}
          <Text style={[styles.title, { color: C.text }]}>{title}</Text>
          <Text style={[styles.message, { color: C.textSecondary }]}>{message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn, { borderColor: C.border }]}
              onPress={onCancel}
              accessibilityLabel={cancelText}
            >
              <Text style={[styles.btnText, { color: C.text }]}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn, { backgroundColor: isDanger ? C.danger : C.primary }]}
              onPress={onConfirm}
              accessibilityLabel={confirmText}
            >
              <Text style={[styles.btnText, { color: '#fff' }]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  sheet: {
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
    width: '100%',
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 50,
    height: 56,
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    width: 56,
  },
  title: {
    fontSize: Typography.size.subtitle,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.size.body,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  btn: {
    alignItems: 'center',
    borderRadius: Radius.button,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  cancelBtn: { borderWidth: 1.5 },
  confirmBtn: {},
  btnText: { fontSize: Typography.size.body, fontWeight: Typography.weight.bold },
});

export default ConfirmationModal;
