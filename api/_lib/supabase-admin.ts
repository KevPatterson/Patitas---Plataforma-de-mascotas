import { createClient } from '@supabase/supabase-js';

// Variables de servidor: SIN prefijo VITE_ para no exponerlas al bundle del cliente.
// Se mantiene fallback a VITE_SUPABASE_URL para compatibilidad local si aún no migraste en Vercel.
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase server env vars. Requeridas: SUPABASE_URL (o VITE_SUPABASE_URL) y SUPABASE_SERVICE_ROLE_KEY.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});