import '../src/crypto/polyfill';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, Text, TextInput } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { VaultProvider } from '../src/context/vault-context';

SplashScreen.preventAutoHideAsync();

// Apply default font family: Cocomat Pro for Text, Poppins for TextInput
// @ts-ignore
if (Text.defaultProps == null) {
  // @ts-ignore
  Text.defaultProps = {};
}
// @ts-ignore
Text.defaultProps.style = { fontFamily: 'CocomatPro-Regular' };

// @ts-ignore
if (TextInput.defaultProps == null) {
  // @ts-ignore
  TextInput.defaultProps = {};
}
// @ts-ignore
TextInput.defaultProps.style = { fontFamily: 'Poppins_400Regular' };

export default function RootLayout() {
  const scheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    'CocomatPro-Regular': require('../assets/fonts/CocomatPro-Regular.ttf'),
    'CocomatPro-Medium': require('../assets/fonts/CocomatPro-Medium.ttf'),
    'CocomatPro-Bold': require('../assets/fonts/CocomatPro-Bold.ttf'),
    'CocomatPro-Light': require('../assets/fonts/CocomatPro-Light.ttf'),
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <VaultProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="getstarted" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/masterpassword" />
        <Stack.Screen name="auth/biometric-setup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="vault/add"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="vault/[id]"
          options={{ presentation: 'card', headerShown: false }}
        />
        <Stack.Screen
          name="vault/edit/[id]"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="vault/generator"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="vault/search"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="security/breach-monitor"
          options={{ presentation: 'card', headerShown: false }}
        />
        <Stack.Screen
          name="security/security-settings"
          options={{ presentation: 'card', headerShown: false }}
        />
        <Stack.Screen
          name="security/master-key"
          options={{ presentation: 'card', headerShown: false }}
        />
        <Stack.Screen
          name="backup/backup"
          options={{ presentation: 'card', headerShown: false }}
        />
        <Stack.Screen
          name="backup/restore"
          options={{ presentation: 'card', headerShown: false }}
        />
        <Stack.Screen
          name="help/index"
          options={{ presentation: 'card', headerShown: false }}
        />
      </Stack>
    </VaultProvider>
  );
}
