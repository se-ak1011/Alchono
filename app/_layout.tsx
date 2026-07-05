import 'react-native-gesture-handler';
import '../global.css';

import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useAuthListener } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, profile, isInitialized } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const inPro = segments[0] === 'pro';

    if (!session && !inAuth) {
      router.replace('/(auth)/login');
    } else if (
      session &&
      (profile as any)?.is_professional &&
      !inPro &&
      // The device-level account switcher is the one shared screen.
      !(segments[0] === 'admin' && (segments as string[])[1] === 'accounts')
    ) {
      // Professionals live in their own portal, not the member app.
      router.replace('/pro' as any);
    } else if (session && !profile?.onboarding_completed && !inOnboarding) {
      router.replace('/onboarding');
    } else if (session && profile?.onboarding_completed && (inAuth || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [session, profile, isInitialized, segments]);

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen
          name="session/morning-reflection"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="session/choosing"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="support/sos"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="session/urge"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="goals/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="messages/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="messages/[requestId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="admin/reports" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="admin/good-feed" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="timeline" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="summary" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="evidence" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="counsellors" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="constellation" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="letters/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="letters/write"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="letters/[id]"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="ecosystem" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="toolkit/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="toolkit/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="toolkit/c/[cat]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="support/help-now" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="support/recovery" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="support/coach" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="support/community" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="support/mentors" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="support/resources" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="pro" />
        <Stack.Screen name="admin/professionals" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="admin/accounts" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="session/good-feed" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="session/odd-one-out" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="session/word-search" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="session/games" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="session/memory-match" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="session/simon" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="session/stroop" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="session/post-game" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </AuthGate>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const isInitialized = useAuthStore((s) => s.isInitialized);

  // Start auth init immediately — parallel with font loading, not after it.
  useAuthListener();

  useEffect(() => {
    // Proceed if fonts are ready (or errored — fall back to system fonts)
    // and auth has initialised. Either way, always hide within 10s.
    const ready = (fontsLoaded || !!fontError) && isInitialized;
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, isInitialized]);

  useEffect(() => {
    // Absolute safety net: never stay on the splash screen past 10 seconds.
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  // Wait for fonts (or a font error) before rendering — avoids FOUC.
  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#09070C' }}>
            <StatusBar style="light" backgroundColor="#09070C" />
            <RootLayoutNav />
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
