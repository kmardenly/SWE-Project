import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Gaegu_400Regular, Gaegu_700Bold } from '@expo-google-fonts/gaegu';
import { Gafata_400Regular } from '@expo-google-fonts/gafata';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '../lib/supabaseClient';
import {UserProvider} from '@/context/UserContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Gaegu: Gaegu_400Regular,
    'Gaegu-Bold': Gaegu_700Bold,
    Gafata: Gafata_400Regular,
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    const client = supabase;
    if (!client) {
      console.warn(
        'Supabase not configured: add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to my-app/frontend/.env, then restart Expo.'
      );
      return;
    }
    const testConnection = async () => {
      const { data, error } = await client.from('users').select('*').limit(1);
      if (error) {
        console.log('❌ Supabase error:', error.message);
      } else {
        console.log('✅ Supabase connected! Data:', data);
      }
    };
    testConnection();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <UserProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="home" />
          <Stack.Screen name="post" />
          <Stack.Screen name="register" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </UserProvider>
  );
}
