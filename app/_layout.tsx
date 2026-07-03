import 'react-native-gesture-handler';
import '../global.css';

import React, { useEffect, useState } from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
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
        <Stack.Screen name="counsellors" options={{ animation: 'slide_from_right' }} />
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

function SplashOverlay() {
  // Pixel-match the native splash so the native→JS handoff is invisible:
  // the expo-splash-screen plugin renders splash-icon.png at 400pt wide,
  // centered. Draw exactly that, and only fade the tagline in on top.
  const { width, height } = Dimensions.get('window');
  const logo = Math.min(400, width);
  return (
    <Animated.View
      exiting={FadeOut.duration(400)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0E0F10',
        zIndex: 999,
      }}
    >
      <Image
        source={require('../assets/splash-icon.png')}
        style={{
          position: 'absolute',
          top: (height - logo) / 2,
          left: (width - logo) / 2,
          width: logo,
          height: logo,
          resizeMode: 'contain',
        }}
      />
      <Animated.Text
        entering={FadeIn.duration(600).delay(150)}
        style={{
          position: 'absolute',
          top: (height + logo) / 2 - 12,
          left: 0,
          right: 0,
          color: '#FFFFFF',
          fontSize: 24,
          fontFamily: 'Inter_700Bold',
          textAlign: 'center',
          lineHeight: 34,
          letterSpacing: 0.5,
        }}
      >
        It Drives,{'\n'}You Pay.
      </Animated.Text>
    </Animated.View>
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
  const [overlayVisible, setOverlayVisible] = useState(true);

  // Start auth init immediately — parallel with font loading, not after it.
  useAuthListener();

  useEffect(() => {
    // Proceed if fonts are ready (or errored — fall back to system fonts)
    // and auth has initialised. Either way, always hide within 10s.
    const ready = (fontsLoaded || !!fontError) && isInitialized;
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
      // Hold the branded overlay a beat so the tagline can land.
      const t = setTimeout(() => setOverlayVisible(false), 1500);
      return () => clearTimeout(t);
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
          <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0E0F10' }}>
            <StatusBar style="light" backgroundColor="#0E0F10" />
            <RootLayoutNav />
            {overlayVisible && <SplashOverlay />}
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
