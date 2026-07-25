import React, { useEffect, useState } from 'react';
import { View, Image, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { getMomentPlaybackUrl } from '@/hooks/useMoments';

/** Fullscreen viewer for a moment — plays videos, shows photos large. */
export default function PlayMomentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { uri, momentId, type, poster } = useLocalSearchParams<{ uri?: string; momentId?: string; type?: string; poster?: string }>();
  const [playbackUri, setPlaybackUri] = useState(uri ?? '');
  const [loading, setLoading] = useState(type === 'video');
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (type !== 'video' || playbackUri || !momentId) return;
    setLoading(true);
    let active = true;
    const timeout = setTimeout(() => {
      if (active) { setLoading(false); setError(true); }
    }, 15_000);
    getMomentPlaybackUrl(momentId)
      .then((url) => { if (active) setPlaybackUri(url); })
      .catch(() => { setLoading(false); setError(true); });
    return () => { active = false; clearTimeout(timeout); };
  }, [momentId, playbackUri, retryKey, type]);

  useEffect(() => {
    if (!playbackUri || !loading || error) return;
    const timeout = setTimeout(() => {
      setLoading(false);
      setError(true);
    }, 20_000);
    return () => clearTimeout(timeout);
  }, [error, loading, playbackUri]);

  const handlePlaybackStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setLoading(false);
      setError(false);
    } else if (status.error) {
      setLoading(false);
      setError(true);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {type === 'video' && poster ? (
        <Image source={{ uri: poster }} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} resizeMode="contain" />
      ) : null}
      {playbackUri ? (
        type === 'video' ? (
          <Video
            source={{ uri: playbackUri }}
            shouldPlay
            useNativeControls
            usePoster={!!poster}
            posterSource={poster ? { uri: poster } : undefined}
            onLoadStart={() => { setLoading(true); setError(false); }}
            onLoad={() => setLoading(false)}
            onPlaybackStatusUpdate={handlePlaybackStatus}
            onReadyForDisplay={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            resizeMode={ResizeMode.CONTAIN}
            style={{ flex: 1 }}
          />
        ) : (
          <Image source={{ uri: playbackUri }} style={{ flex: 1 }} resizeMode="contain" />
        )
      ) : type !== 'video' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#817B91' }}>Nothing to play.</Text>
        </View>
      ) : null}

      {loading && !error && (
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#ECE9F1' }}>Loading video…</Text>
        </View>
      )}
      {error && (
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ color: '#ECE9F1', textAlign: 'center' }}>This video could not be played.</Text>
          {momentId && <Pressable onPress={() => { setPlaybackUri(''); setLoading(true); setError(false); setRetryKey((value) => value + 1); }} style={{ marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: '#302B3A' }}><Text style={{ color: '#ECE9F1' }}>Try again</Text></Pressable>}
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
