import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

// Warn in development instead of crashing – lets the Landing page render
// so developers can see the UI even before Supabase is configured.
if (
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes('YOUR_PROJECT_ID')
) {
  console.warn(
    '[SkillForge] Supabase environment variables are not configured.\n' +
    'Edit frontend/.env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    'Authentication and API features will not work until these are set.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'skillforge-auth',
      flowType: 'pkce',
    },
    global: {
      headers: {
        'X-Client-Info': 'skillforge/1.0.0',
      },
    },
    db: {
      schema: 'public',
    },
  }
);

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Check if Supabase is properly configured
export const isSupabaseConfigured = () =>
  Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT_ID')
  );
