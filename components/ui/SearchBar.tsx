import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Radius, Spacing, Shadows } from '../../src/constants/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search passwords…', onFocus, onBlur, autoFocus }: Props) {
  const { C } = useTheme();
  return (
    <View style={[
      styles.container,
      { backgroundColor: C.surface, borderColor: C.border },
      Shadows.sm,
    ]}>
      <Ionicons name="search-outline" size={20} color={C.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textTertiary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus={autoFocus}
        style={[styles.input, { color: C.text }]}
        accessibilityLabel="Search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={18} color={C.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    height: 46,
    paddingHorizontal: Spacing.md,
  },
  input: {
    fontFamily: Typography.fontFamilyInput,
    flex: 1,
    fontSize: Typography.size.body,
    height: '100%',
    paddingVertical: 0,
  },
});

export default SearchBar;
