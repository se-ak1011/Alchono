import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { queryClient } from '@/lib/queryClient';
import { updateIfSaved } from '@/lib/accountSwitcher';

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
      // Keep account-switcher snapshots fresh across token rotations.
      updateIfSaved(session).catch(() => {});

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
      const { data: created, error: healError } = await supabase
        .from('profiles')
        .upsert({ id: userId }, { onConflict: 'id' })
        .select()
        .maybeSingle();

      // FK violation here means the auth user itself no longer exists
      // (account wiped server-side while this device kept its token).
      // The session is a zombie — kill it so the user lands on login.
      if (healError?.code === '23503') {
        await supabase.auth.signOut().catch(() => {});
        return;
      }
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
  // Signup is pure account creation now — just email + password. The username
  // (and everything else) is chosen in onboarding, so the first screens the
  // user sees are about them, not a form. The handle_new_user trigger creates
  // the profile row; onboarding fills in the username.
  return async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };
}

// --- Passwordless (email OTP) -------------------------------------------------
// Members sign in with a 6-digit code emailed to them — no password to forget.
// The same flow creates the account on first use (shouldCreateUser), so "Start
// here" and "Welcome back" both just ask for an email. Verifying the code both
// signs them in and confirms the email.
//
// NOTE: the code only lands in the email if the Supabase email templates
// ("Magic Link" and "Confirm signup") include the {{ .Token }} variable — set
// once in the Supabase dashboard under Authentication → Emails.

export function useSendOtp() {
  return async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  };
}

export function useVerifyOtp() {
  return async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;
    return data;
  };
}
