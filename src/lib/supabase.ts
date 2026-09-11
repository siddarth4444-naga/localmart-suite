import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Safe storage adapter to prevent "ReferenceError: window is not defined" in SSR/Node/Metro bundling
const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window === 'undefined' && Platform.OS === 'web') {
      return null;
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window === 'undefined' && Platform.OS === 'web') {
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof window === 'undefined' && Platform.OS === 'web') {
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

export const isSupabaseLive = !!process.env.EXPO_PUBLIC_SUPABASE_URL && !process.env.EXPO_PUBLIC_SUPABASE_URL.includes('your-project');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: typeof window !== 'undefined' || Platform.OS !== 'web',
    persistSession: typeof window !== 'undefined' || Platform.OS !== 'web',
    detectSessionInUrl: false,
  },
});

