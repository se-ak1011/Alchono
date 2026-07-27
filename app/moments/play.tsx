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
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const fail = (detail: string) => { setLoading(false); setError(true); setErrorDetail(detail); };

  useEffect(() => {
    if (type !== 'video' || playbackUri || !momentId) return;
    setLoading(true);
    let active = true;
    const timeout = setTimeout(() => {
      if (active) fail('Timed out fetching the video link (15s). Check your connection, or the video service may need redeploying.');
    }, 15_000);
    getMomentPlaybackUrl(momentId)
      .then((url) => { if (active) setPlaybackUri(url); })
      .catch((e) => {
        if (!active) return;
        // The most common cause is the good-feed function lacking the "play"
        // action (needs redeploy), or the moment not being approved/shared.
        const message = e instanceof Error ? e.message : String(e ?? '');
        fail(message ? `Couldn't get the video link: ${message}` : "Couldn't get the video link (video unavailable).");
      });
    return () => { active = false; clearTimeout(timeout); };
  }, [momentId, playbackUri, retryKey, type]);

  useEffect(() => {
    if (!playbackUri || !loading || error) return;
    const timeout = setTimeout(() => {
      fail('The video link loaded but playback never started (20s). The file may be corrupt or an unsupported format.');
    }, 20_000);
    return () => clearTimeout(timeout);
  }, [error, loading, playbackUri]);

  const handlePlaybackStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setLoading(false);
      setError(false);
      setErrorDetail(null);
    } else if (status.error) {
      fail(`Playback error: ${status.error}`);
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
            onLoadStart={() => { setLoading(true); setError(false); setErrorDetail(null); }}
            onLoad={() => setLoading(false)}
            onPlaybackStatusUpdate={handlePlaybackStatus}
            onReadyForDisplay={() => setLoading(false)}
            onError={(e) => fail(typeof e === 'string' ? `Playback error: ${e}` : 'The video could not be decoded on this device.')}
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
          <Text style={{ color: '#ECE9F1', textAlign: 'center', fontSize: 16 }}>This video could not be played.</Text>
          {errorDetail ? (
            <Text style={{ color: '#817B91', textAlign: 'center', fontSize: 13, marginTop: 8, lineHeight: 18 }}>{errorDetail}</Text>
          ) : null}
          {momentId && <Pressable onPress={() => { setPlaybackUri(''); setLoading(true); setError(false); setErrorDetail(null); setRetryKey((value) => value + 1); }} style={{ marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: '#302B3A' }}><Text style={{ color: '#ECE9F1' }}>Try again</Text></Pressable>}
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
