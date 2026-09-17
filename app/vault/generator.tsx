import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Clipboard from 'expo-clipboard';

import { useTheme } from '../../hooks/useTheme';
import { CryptoService } from '../../src/crypto/crypto-service';
import { Typography, Spacing, Radius, Shadows } from '../../src/constants/theme';
import PrimaryButton from '../../components/ui/PrimaryButton';
import PasswordStrengthMeter from '../../components/ui/PasswordStrengthMeter';

export default function GeneratorScreen() {
  const router = useRouter();
  const { fromMode } = useLocalSearchParams<{ fromMode?: string }>();
  const { C } = useTheme();

  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);

  const [clipboardToast, setClipboardToast] = useState<{ visible: boolean; timeLeft: number }>({
    visible: false,
    timeLeft: 0,
  });

  const clearClipboardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    generatePassword();
    return () => {
      clearTimeouts();
    };
  }, [length, useUppercase, useLowercase, useNumbers, useSymbols]);

  const clearTimeouts = () => {
    if (clearClipboardTimeoutRef.current) clearTimeout(clearClipboardTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  const generatePassword = () => {
    if (!useUppercase && !useLowercase && !useNumbers && !useSymbols) {
      setUseLowercase(true);
      return;
    }

    const newPassword = CryptoService.generatePassword({
      length,
      useUppercase,
      useLowercase,
      useNumbers,
      useSymbols,
    });
    setPassword(newPassword);
  };

  const handleCopy = async () => {
    if (!password) return;
    await Clipboard.setStringAsync(password);

    clearTimeouts();

    let seconds = 30;
    setClipboardToast({ visible: true, timeLeft: seconds });

    countdownIntervalRef.current = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) {
        setClipboardToast({ visible: false, timeLeft: 0 });
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      } else {
        setClipboardToast({ visible: true, timeLeft: seconds });
      }
    }, 1000);

    clearClipboardTimeoutRef.current = setTimeout(async () => {
      await Clipboard.setStringAsync('');
      setClipboardToast({ visible: false, timeLeft: 0 });
    }, 30000);
  };

  const handleUsePassword = () => {
    if (!password) return;
    if (fromMode === 'add') {
      router.replace({ pathname: '/vault/add', params: { generatedPassword: password } } as any);
    } else {
      handleCopy();
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.text }]}>Password Generator</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={generatePassword}>
          <Ionicons name="refresh" size={22} color={C.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Password Display Box */}
        <View style={[styles.passwordBox, { backgroundColor: C.surface, borderColor: C.border }, Shadows.sm]}>
          <Text style={[styles.passwordText, { color: C.text }]} selectable>
            {password}
          </Text>

          <View style={styles.strengthWrap}>
            <PasswordStrengthMeter password={password} showLabel={false} />
          </View>

          <View style={styles.passwordActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: C.surfaceSecondary, borderColor: C.border }]}
              onPress={handleCopy}
            >
              <Ionicons name="copy-outline" size={18} color={C.text} />
              <Text style={[styles.actionText, { color: C.text }]}>Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: C.primaryMuted, borderColor: C.primary }]}
              onPress={generatePassword}
            >
              <Ionicons name="refresh-outline" size={18} color={C.primary} />
              <Text style={[styles.actionText, { color: C.primary }]}>Regenerate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Options Card */}
        <View style={[styles.optionsCard, { backgroundColor: C.surface, borderColor: C.border }, Shadows.sm]}>
          <Text style={[styles.cardTitle, { color: C.text }]}>Options</Text>

          {/* Length Slider */}
          <View style={styles.sliderGroup}>
            <View style={styles.sliderHeader}>
              <Text style={[styles.optionLabel, { color: C.text }]}>Length</Text>
              <Text style={[styles.lengthValue, { color: C.primary }]}>{length}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={8}
              maximumValue={64}
              step={1}
              value={length}
              onValueChange={setLength}
              minimumTrackTintColor={C.primary}
              maximumTrackTintColor={C.border}
              thumbTintColor={C.primary}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: C.divider }]} />

          {/* Character Toggles */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={[styles.optionLabel, { color: C.text }]}>Uppercase Letters</Text>
              <Text style={[styles.optionSub, { color: C.textSecondary }]}>A-Z</Text>
            </View>
            <Switch
              value={useUppercase}
              onValueChange={setUseUppercase}
              trackColor={{ false: C.border, true: C.primary }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: C.divider }]} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={[styles.optionLabel, { color: C.text }]}>Lowercase Letters</Text>
              <Text style={[styles.optionSub, { color: C.textSecondary }]}>a-z</Text>
            </View>
            <Switch
              value={useLowercase}
              onValueChange={setUseLowercase}
              trackColor={{ false: C.border, true: C.primary }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: C.divider }]} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={[styles.optionLabel, { color: C.text }]}>Numbers</Text>
              <Text style={[styles.optionSub, { color: C.textSecondary }]}>0-9</Text>
            </View>
            <Switch
              value={useNumbers}
              onValueChange={setUseNumbers}
              trackColor={{ false: C.border, true: C.primary }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: C.divider }]} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={[styles.optionLabel, { color: C.text }]}>Special Characters</Text>
              <Text style={[styles.optionSub, { color: C.textSecondary }]}>!@#$%^&*</Text>
            </View>
            <Switch
              value={useSymbols}
              onValueChange={setUseSymbols}
              trackColor={{ false: C.border, true: C.primary }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        {/* Use Password Action */}
        <PrimaryButton
          title={fromMode ? 'Use This Password' : 'Copy Password'}
          onPress={handleUsePassword}
          style={styles.primaryButton}
        />
      </ScrollView>

      {/* Floating Clipboard Toast */}
      {clipboardToast.visible && (
        <View style={[styles.toastContainer, { backgroundColor: C.text }, Shadows.md]}>
          <Ionicons name="clipboard" size={18} color={C.surface} />
          <Text style={[styles.toastText, { color: C.surface }]}>
            Copied! Clipboard clears in {clipboardToast.timeLeft}s
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
  },
  refreshButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: Typography.size.subtitle,
    fontWeight: Typography.weight.bold,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.base,
  },
  passwordBox: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.base,
    alignItems: 'center',
  },
  passwordText: {
    fontSize: Typography.size.heading,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
    letterSpacing: 1,
    marginVertical: Spacing.md,
  },
  strengthWrap: {
    width: '100%',
    marginVertical: Spacing.sm,
  },
  passwordActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  actionText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  optionsCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: Typography.size.bodyLg,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  sliderGroup: {
    gap: Spacing.xs,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lengthValue: {
    fontSize: Typography.size.bodyLg,
    fontWeight: Typography.weight.bold,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  toggleTextWrap: {
    gap: 2,
  },
  optionLabel: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.medium,
  },
  optionSub: {
    fontSize: Typography.size.xs,
  },
  primaryButton: {
    marginTop: Spacing.sm,
  },
  toastContainer: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.full,
  },
  toastText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
});
