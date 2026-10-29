const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

if (!env.supabaseUrl || !env.supabaseKey) {
  throw new Error('Supabase URL and Anon Key are required in config/supabase.js');
}

if (!env.supabaseServiceRoleKey) {
  throw new Error('FATAL: SUPABASE_SERVICE_ROLE_KEY is required in config/supabase.js. Cannot fall back to Anon key.');
}

// Initialize Standard Supabase Client (Anon Key)
const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Dedicated Supabase Admin Client (Service Role Key)
const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Default export is the service-role client: all server-side data access bypasses RLS,
// which is enabled on every public table. The anon client is only for Supabase Auth
// flows (sign in/up, refresh, reset) and is exposed as the named `supabase` export.
module.exports = supabaseAdmin;
module.exports.supabase = supabase;
module.exports.supabaseAdmin = supabaseAdmin;
