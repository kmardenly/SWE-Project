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

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: getStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);