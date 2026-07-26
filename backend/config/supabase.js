const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

if (!env.supabaseUrl || !env.supabaseKey) {
  throw new Error('Supabase URL and Key are required in config/supabase.js');
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
  env.supabaseServiceRoleKey || env.supabaseKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

module.exports = supabase;
module.exports.supabase = supabase;
module.exports.supabaseAdmin = supabaseAdmin;
