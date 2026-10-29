import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
}

// Used for Realtime only. Authentication is handled by the backend API, so the client
// does not manage its own session; call setRealtimeAuth() with the backend-issued JWT.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export const setRealtimeAuth = (token: string | null) => {
  supabase.realtime.setAuth(token);
};

export default supabase;
