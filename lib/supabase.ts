import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://frvohuwjisqbppsefsro.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZydm9odXdqaXNxYnBwc2Vmc3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODQ0NjUsImV4cCI6MjA4NTc2MDQ2NX0.cSmniU8YdN8-CBecf2hbmaE7qX8DWpiVFxkuCQyBwWo';

const isWeb = Platform.OS === 'web';
const isServer = isWeb && typeof window === 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isServer ? undefined : AsyncStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});
