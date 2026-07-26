import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ckhebftuzvbtqhipkxka.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNraGViZnR1enZidHFoaXBreGthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5ODI1NzksImV4cCI6MjEwMDU1ODU3OX0.arcR1_3KhY0CxwGIsse_sDBcokUdOZQxKvNnHFIZ1ZE';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;
