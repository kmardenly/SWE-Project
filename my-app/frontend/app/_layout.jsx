import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Gaegu_400Regular, Gaegu_700Bold } from '@expo-google-fonts/gaegu';
import { Gafata_400Regular } from '@expo-google-fonts/gafata';
import { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);
const DARK = '#5c3d3d';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '../lib/supabaseClient';
import {UserProvider} from '@/context/UserContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const isGroupChatsRoute = pathname?.startsWith('/home/group-chats');
  const showPostButton = pathname !== '/' && pathname !== '/post' && !isGroupChatsRoute;
  const [fontsLoaded] = useFonts({
    'Gaegu': Gaegu_400Regular,
    'Gaegu-Bold': Gaegu_700Bold,
    'Gafata' : Gafata_400Regular,
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

          {showPostButton && (
            <Pressable
              style={({ pressed }) => [styles.postButton, pressed && styles.postButtonPressed]}
              onPress={() => router.push('/post')}>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: responsive(36, 28, 48),
    paddingVertical: responsive(14, 10, 18),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  postButtonPressed: {
    backgroundColor: '#f4ecec',
    transform: [{ scale: 0.98 }],
  },
  postButtonText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(22, 18, 26),
    color: DARK,
    letterSpacing: 0.5,
  },
});
