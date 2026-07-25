import React, { useState } from 'react';
import { View, Image, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Feather } from '@expo/vector-icons';

/** Fullscreen viewer for a moment — plays videos, shows photos large. */
export default function PlayMomentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { uri, type, poster } = useLocalSearchParams<{ uri?: string; type?: string; poster?: string }>();
  const [loading, setLoading] = useState(type === 'video');
  const [error, setError] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {uri ? (
        type === 'video' ? (
          <Video
            source={{ uri }}
            shouldPlay
            useNativeControls
            usePoster={!!poster}
            posterSource={poster ? { uri: poster } : undefined}
            onLoadStart={() => { setLoading(true); setError(false); }}
            onReadyForDisplay={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            resizeMode={ResizeMode.CONTAIN}
            style={{ flex: 1 }}
          />
        ) : (
          <Image source={{ uri }} style={{ flex: 1 }} resizeMode="contain" />
        )
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#817B91' }}>Nothing to play.</Text>
        </View>
      )}

      {loading && !error && (
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#ECE9F1' }}>Loading video…</Text>
        </View>
      )}
      {error && (
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ color: '#ECE9F1', textAlign: 'center' }}>This video could not be played. Please try again.</Text>
        </View>
      )}

      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{
          position: 'absolute',
          top: insets.top + 8,
          right: 18,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name="x" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}
