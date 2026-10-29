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

// Default export is the client used for all data queries.
// - SUPABASE_USE_SERVICE_ROLE=true  -> service-role client (bypasses RLS). Required once RLS is enabled
//   (see backend/sql/001_enable_rls_and_realtime.sql) and needs a valid SUPABASE_SERVICE_ROLE_KEY.
// - otherwise                       -> anon client (works only while RLS is disabled).
// The anon client is always exposed as the named `supabase` export for Supabase Auth flows.
const useServiceRole = String(process.env.SUPABASE_USE_SERVICE_ROLE || '').toLowerCase() === 'true';

module.exports = useServiceRole ? supabaseAdmin : supabase;
module.exports.supabase = supabase;
module.exports.supabaseAdmin = supabaseAdmin;
