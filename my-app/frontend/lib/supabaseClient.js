import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';


// Robustly detect web (including Expo web and test environments)
const isWeb =
  Platform.OS === 'web' ||
  typeof window !== 'undefined' ||
  (typeof navigator !== 'undefined' && navigator.product === 'ReactNative');

const getStorage = () => {
  if (isWeb) return undefined;
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (!AsyncStorage) return undefined;
    return AsyncStorage;
  } catch {
    return undefined;
  }
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.trim().length > 0 &&
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.trim().length > 0
    ? createClient(supabaseUrl.trim(), supabaseAnonKey.trim(), {
        auth: {
          storage: getStorage(),
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;