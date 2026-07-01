import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function useAuthListener() {
  const { setSession, setProfile, setInitialized } = useAuthStore();

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
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
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
        .single();
      setProfile(data);
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
