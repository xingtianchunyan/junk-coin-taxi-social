import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Create a Supabase client that uses a custom JWT for Authorization
// Note: Duplicates public URL and anon key to avoid altering the generated client file
const SUPABASE_URL = "https://gwfuygmhcfmbzkewiuuv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZnV5Z21oY2ZtYnprZXdpdXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTQ3ODksImV4cCI6MjA2Njk3MDc4OX0.pe1U9ZqkH48mJpnAuFAPazpmv7aDX2MA_M4BheFyUGs";

export const createSupabaseWithToken = (token: string) => {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
