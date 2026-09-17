/**
 * Screen 23 — Change Master Password
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { PasswordStrengthMeter } from '../../components/ui/PasswordStrengthMeter';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecurityAlert } from '../../components/ui/SecurityAlert';
import { AuthService } from '../../src/services/auth-service';
import { validateMasterPassword, validatePasswordsMatch } from '../../src/utils/validation';
import { Typography, Spacing, Radius } from '../../src/constants/theme';

export default function MasterKeyScreen() {
  const { C } = useTheme();
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = async () => {
    const errs: Record<string, string> = {};
    if (!current) errs.current = 'Enter your current password';
    const { valid, errors: pwdErrors } = validateMasterPassword(newPwd);
    if (!valid) errs.newPwd = pwdErrors[0];
    if (!validatePasswordsMatch(newPwd, confirm)) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const result = await AuthService.changeMasterPassword(current, newPwd);
    setLoading(false);

    if (result.success) {
      Alert.alert('Password Changed', 'Your master password has been updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      setErrors({ current: result.error ?? 'Incorrect current password.' });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: C.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: C.text }]}>Change Master Password</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SecurityAlert
            variant="warning"
            icon="warning-outline"
            title="Important"
            message="After changing your master password, you may need to re-setup biometric authentication. Your vault data remains intact."
          />

          <View style={styles.form}>
            <PasswordInput
              label="Current Password"
              placeholder="Enter your current password"
              value={current}
              onChangeText={setCurrent}
              error={errors.current}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={C.textTertiary} />}
            />
            <PasswordInput
              label="New Password"
              placeholder="At least 10 characters"
              value={newPwd}
              onChangeText={setNewPwd}
              error={errors.newPwd}
              leftIcon={<Ionicons name="lock-open-outline" size={18} color={C.textTertiary} />}
            />
            {newPwd.length > 0 && <PasswordStrengthMeter password={newPwd} />}
            <PasswordInput
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirm}
              onChangeText={setConfirm}
              error={errors.confirm}
              leftIcon={<Ionicons name="checkmark-circle-outline" size={18} color={C.textTertiary} />}
            />
          </View>

          <PrimaryButton title="Change Password" onPress={handleChange} loading={loading} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    alignItems: 'center', flexDirection: 'row',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
  },
  backBtn: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  title: { flex: 1, fontSize: Typography.size.subtitle, fontWeight: Typography.weight.extrabold, textAlign: 'center' },
  content: { paddingHorizontal: Spacing.base, paddingBottom: 60, gap: Spacing.xl },
  form: { gap: Spacing.base },
});
