import React from 'react';
import { Stack } from 'expo-router';

/**
 * The bottom tab bar is gone. Home is the companion's world; every destination
 * is reached from the orbit or the hamburger drawer, and returns here. These
 * former tabs are now plain stacked screens (Home is the root), so going into
 * Writing Room / Support / Me / Progress and coming back feels like stepping
 * out and returning to the companion — not switching tabs.
 */
export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#201D28' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="support" />
      <Stack.Screen name="journal" />
      <Stack.Screen name="insights" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
