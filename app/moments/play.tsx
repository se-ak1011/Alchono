import React, { useEffect, useState } from 'react';
import { View, Image, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Feather } from '@expo/vector-icons';
import { getMomentPlaybackUrl } from '@/hooks/useMoments';
import { CaptionOverlay } from '@/components/ui/CaptionOverlay';

/**
 * Fullscreen viewer for a moment — plays videos, shows photos large.
 *
 * Uses expo-video (the supported player in SDK 52; expo-av's Video is
 * deprecated). The signed video URL is minted lazily on open and handed to
 * the player via replace(); the player's own statusChange is the source of
 * truth for success/failure so playback problems are surfaced precisely.
 */
export default function PlayMomentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { uri, momentId, type, poster, caption, captionPos } = useLocalSearchParams<{ uri?: string; momentId?: string; type?: string; poster?: string; caption?: string; captionPos?: string }>();
  const isVideo = type === 'video';
  const [playbackUri, setPlaybackUri] = useState(uri ?? '');
  const [loading, setLoading] = useState(isVideo);
  const [error, setError] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const fail = (detail: string) => { setLoading(false); setError(true); setErrorDetail(detail); };

  // The player is created once with no source; the remote URL arrives below.
  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
  });

  // 1) Mint the short-lived signed video URL after the user taps (videos only).
  useEffect(() => {
    if (!isVideo || playbackUri || !momentId) return;
    setLoading(true);
    let active = true;
    const timeout = setTimeout(() => {
      if (active) fail('Timed out fetching the video link (15s). Check your connection, or the video service may need redeploying.');
    }, 15_000);
    getMomentPlaybackUrl(momentId)
      .then((url) => { if (active) setPlaybackUri(url); })
      .catch((e) => {
        if (!active) return;
        // Most common cause is the good-feed function lacking the "play"
        // action (needs redeploy), or the moment not being approved/shared.
        const message = e instanceof Error ? e.message : String(e ?? '');
        fail(message ? `Couldn't get the video link: ${message}` : "Couldn't get the video link (video unavailable).");
      });
    return () => { active = false; clearTimeout(timeout); };
  }, [isVideo, momentId, playbackUri, retryKey]);

  // 2) Hand the URL to the player and start playback.
  useEffect(() => {
    if (!isVideo || !playbackUri) return;
    setLoading(true);
    setError(false);
    setErrorDetail(null);
    player.replace({ uri: playbackUri });
    player.play();
  }, [isVideo, playbackUri, player]);

  // 3) The player's own status is the definitive success/failure signal.
  useEffect(() => {
    if (!isVideo) return;
    const sub = player.addListener('statusChange', ({ status, error: playerError }) => {
      if (status === 'readyToPlay') {
        setLoading(false);
        setError(false);
        setErrorDetail(null);
      } else if (status === 'loading') {
        setLoading(true);
      } else if (status === 'error') {
        fail(playerError?.message ? `Playback error: ${playerError.message}` : 'The video could not be decoded on this device.');
      }
    });
    return () => sub.remove();
  }, [isVideo, player]);

  // Safety net: the link arrived but playback never became ready.
  useEffect(() => {
    if (!playbackUri || !loading || error) return;
    const timeout = setTimeout(() => {
      fail('The video link loaded but playback never started (20s). The file may be corrupt or an unsupported format.');
    }, 20_000);
    return () => clearTimeout(timeout);
  }, [error, loading, playbackUri]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {isVideo && poster ? (
        <Image source={{ uri: poster }} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} resizeMode="contain" />
      ) : null}

      {isVideo ? (
        playbackUri ? (
          <VideoView
            player={player}
            style={{ flex: 1 }}
            contentFit="contain"
            nativeControls
            allowsFullscreen
          />
        ) : null
      ) : playbackUri ? (
        <Image source={{ uri: playbackUri }} style={{ flex: 1 }} resizeMode="contain" />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#817B91' }}>Nothing to play.</Text>
        </View>
      )}

      <CaptionOverlay caption={caption} position={captionPos} />
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
