import React from 'react';
import { Stack } from 'expo-router';

export default function BackupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="backup" />
      <Stack.Screen name="restore" />
      <Stack.Screen name="sync-status" />
    </Stack>
  );
}
