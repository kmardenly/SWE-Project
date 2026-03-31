import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Gaegu_400Regular, Gaegu_700Bold } from '@expo-google-fonts/gaegu';
import { Gafata_400Regular } from '@expo-google-fonts/gafata';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '../lib/supabaseClient';
import {UserProvider} from '@/context/UserContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
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
        <View style={styles.container}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="home" />
            <Stack.Screen name="post" />
            <Stack.Screen name="register" />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>

          {pathname !== '/' && pathname !== '/post' && (
            <Pressable style={styles.postButton} onPress={() => router.push('/post')}>
              <Text style={styles.postButtonText}>Post</Text>
            </Pressable>
          )}
        </View>
        <StatusBar style="auto" />
      </ThemeProvider>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  postButton: {
    position: 'absolute',
    right: 18,
    bottom: 92,
    minWidth: 90,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
