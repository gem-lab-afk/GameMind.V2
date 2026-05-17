import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const missingConfigMessage =
  'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env/.env.local.';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : new Proxy(
      {},
      {
        get() {
          throw new Error(missingConfigMessage);
        }
      }
    );
