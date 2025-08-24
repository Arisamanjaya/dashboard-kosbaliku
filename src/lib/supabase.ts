import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ Optimize for Vercel deployment
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  // ✅ Connection optimization for Vercel
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'supabase-js-web',
    },
  },
  // ✅ Reduce timeout for faster failures
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ✅ Add connection warming for Vercel
if (typeof window !== 'undefined') {
  // Warm up connection on client side
  Promise.resolve(supabase.from('kos').select('kos_id').limit(1)).then(() => {
    console.log('🔥 Supabase connection warmed up');
  }).catch(() => {
    // Silent fail for warmup
  });
}