import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials are missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.");
}

let client;
try {
  client = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
  );
} catch (e) {
  console.error("Failed to initialize Supabase client. Invalid URL?", e);
  // Fallback so the app doesn't crash completely on load
  client = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export const supabase = client;
