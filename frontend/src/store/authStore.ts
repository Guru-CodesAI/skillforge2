import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/services/supabase';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      role: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          role: user?.role ?? null,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false, role: null });
      },

      initialize: async () => {
        set({ isLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch full user profile from our backend
            const { data: profile, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (!error && profile) {
              set({
                user: profile as User,
                isAuthenticated: true,
                role: profile.role as UserRole,
                isLoading: false,
              });
            } else {
              // PROFILE DOES NOT EXIST YET (new user!)
              // Construct a temporary profile using metadata from Supabase Auth session
              const tempProfile: User = {
                id: session.user.id,
                email: session.user.email ?? '',
                name: session.user.user_metadata?.name ?? 'Developer',
                role: 'user',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              set({
                user: tempProfile,
                isAuthenticated: true,
                role: 'user',
                isLoading: false,
              });
            }
          } else {
            set({ isLoading: false });
          }
        } catch {
          set({ isLoading: false });
        }

        // Subscribe to auth state changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT' || !session) {
            set({ user: null, isAuthenticated: false, role: null, isLoading: false });
          } else if (event === 'TOKEN_REFRESHED' && session) {
            // Token refreshed, update session silently
          } else if (event === 'SIGNED_IN' && session) {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              set({
                user: profile as User,
                isAuthenticated: true,
                role: profile.role as UserRole,
                isLoading: false,
              });
            } else {
              // PROFILE DOES NOT EXIST YET (new user!)
              const tempProfile: User = {
                id: session.user.id,
                email: session.user.email ?? '',
                name: session.user.user_metadata?.name ?? 'Developer',
                role: 'user',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              set({
                user: tempProfile,
                isAuthenticated: true,
                role: 'user',
                isLoading: false,
              });
            }
          }
        });
      },
    }),
    {
      name: 'skillforge-auth-store',
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for security
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    }
  )
);

// Selector hooks
export const useUser = () => useAuthStore((s) => s.user);
export const useIsAdmin = () => useAuthStore((s) => s.role === 'admin');
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
