/**
 * AuthCallbackPage
 * Handles OAuth redirect from Supabase (GitHub login).
 * Supabase automatically sets the session from the URL fragment;
 * we just wait for it, then redirect the user appropriately.
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import LoadingScreen from '@/components/LoadingScreen';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { initialize } = useAuthStore();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const handleCallback = async () => {
      try {
        // Exchange the code/fragment for a session
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          navigate('/login?error=oauth_failed', { replace: true });
          return;
        }

        // Re-initialize auth store so user profile is loaded
        await initialize();

        // Check if user has completed onboarding (has experience_level set)
        const { data: profile } = await supabase
          .from('users')
          .select('experience_level, skills')
          .eq('id', data.session.user.id)
          .maybeSingle();

        const isOnboarded =
          profile?.experience_level && (profile?.skills?.length ?? 0) > 0;

        navigate(isOnboarded ? '/dashboard' : '/onboarding', { replace: true });
      } catch {
        navigate('/login?error=oauth_failed', { replace: true });
      }
    };

    handleCallback();
  }, [navigate, initialize]);

  return <LoadingScreen />;
}
