import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { queryClient } from '@/lib/queryClient';

export function useAuthListener() {
  const { setSession, setProfile, setInitialized } = useAuthStore();
  const resetAppStore = useAppStore((s) => s.reset);

  useEffect(() => {
    let initialized = false;
    const markInitialized = () => {
      if (!initialized) {
        initialized = true;
        setInitialized(true);
      }
    };

    // Safety net: always escape the splash screen within 8 seconds even if
    // AsyncStorage or the network hangs on cold launch.
    const fallbackTimer = setTimeout(markInitialized, 8000);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id);
        }
      })
      .catch(() => {
        // Storage or network error — proceed to login screen
      })
      .finally(() => {
        clearTimeout(fallbackTimer);
        markInitialized();
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Always update the session so the JWT stays current.
      setSession(session);

      if (event === 'SIGNED_IN') {
        // Clear stale data from a previous account before loading the new one.
        queryClient.clear();
        resetAppStore();
        if (session?.user) await fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        queryClient.clear();
        resetAppStore();
        setProfile(null);
      }
      // TOKEN_REFRESHED / INITIAL_SESSION / USER_UPDATED: just update the JWT
      // (setSession above). Do NOT re-fetch the profile — that would race with
      // any in-progress profile write (e.g. onboarding completion) and could
      // overwrite onboarding_completed:true with the stale DB value, causing
      // AuthGate to bounce the user back to onboarding.
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
        return;
      }

      // Logged-in user with no profile row (deleted during testing, or the
      // signup trigger failed). Recreate it so every FK-dependent write
      // (goals, sessions, posts) works again.
      const { data: created } = await supabase
        .from('profiles')
        .upsert({ id: userId }, { onConflict: 'id' })
        .select()
        .maybeSingle();
      setProfile(created ?? null);
    } catch {
      // Non-fatal — user can still reach the app, profile loads on next nav
    }
  }
}

export function useSignIn() {
  return async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };
}

export function useSignUp() {
  return async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      // The handle_new_user trigger may have already created the profile row.
      // Use upsert so the username is saved regardless of trigger timing.
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: data.user.id, username }, { onConflict: 'id' });
      if (upsertError) throw upsertError;
    }
    return data;
  };
}

export function useSignOut() {
  const { reset } = useAuthStore();
  return async () => {
    await supabase.auth.signOut();
    reset();
  };
}
