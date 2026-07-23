import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { headingShadow } from '@/styles';
import { useUploadMoment } from '@/hooks/useMoments';
import { useAuthStore } from '@/store/authStore';

export default function NewMomentScreen() {
  const router = useRouter();
  const username = useAuthStore((s) => s.profile?.username);
  const { mutate: upload, isPending } = useUploadMoment();
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [caption, setCaption] = useState('');
  const [share, setShare] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [progress, setProgress] = useState(0);

  const isVideo = asset?.type === 'video';

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add a moment.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.7,
      videoMaxDuration: 15,
    });
    if (result.canceled || !result.assets[0]) return;
    const picked = result.assets[0];
    // Storage caps uploads at 50 MB. Reject oversized clips up front with a
    // clear message rather than letting the upload fail at the end.
    if (picked.type === 'video') {
      try {
        const info = await FileSystem.getInfoAsync(picked.uri, { size: true });
        const size = (info as any).size ?? 0;
        if (size > 48 * 1024 * 1024) {
          Alert.alert(
            'Video too large',
            'That clip is over 48 MB — the current upload limit. Try a shorter one; around 10–15 seconds usually fits.',
          );
          return;
        }
      } catch {
        /* size unknown — let the upload try, the server still enforces the cap */
      }
    }
    setAsset(picked);
  };

  const submit = async () => {
    if (!asset || isPending) return;
    let thumbUri: string | undefined;
    if (isVideo) {
      try {
        const t = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 500 });
        thumbUri = t.uri;
      } catch {
        /* no thumb — moderation will hold a shared video without a frame */
      }
    }
    const ext = asset.uri.split('.').pop()?.toLowerCase();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setProgress(0);
    upload(
      {
        uri: asset.uri,
        mediaType: isVideo ? 'video' : 'photo',
        thumbUri,
        caption,
        shared: share,
        anonymous: share ? anonymous : false,
        ext,
        onProgress: setProgress,
      },
      {
        onSuccess: () => {
          Alert.alert(
            share ? 'Shared' : 'Saved',
            share
              ? "It'll appear in the feed once it's passed a quick automatic check."
              : 'Saved to your moments — just for you.',
            [{ text: 'Done', onPress: () => router.back() }],
          );
        },
        onError: (err: any) => {
          setProgress(0);
          const msg = String(err?.message ?? '');
          const tooBig = /413|too large|maximum allowed|exceeded/i.test(msg);
          Alert.alert(
            'Could not upload',
            tooBig
              ? 'That video is over the size limit. Try a shorter clip, or raise the storage limit.'
              : `Please try again in a moment.${msg ? `\n\n${msg}` : ''}`,
          );
        },
      },
    );
  };

  return (
    <SafeArea>
      <ZoneGlow zone="community" intensity={0.55} />
      <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-text-muted text-base">Close</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={90}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 pt-2">
            <Text
              className="text-text-primary text-4xl font-semibold tracking-tight"
              style={headingShadow}
            >
              Add a moment
            </Text>
            <Text className="text-text-secondary text-base mt-2 leading-relaxed">
              Something small and good. Yours to keep, or to share.
            </Text>
          </View>

          {/* Picker / preview */}
          <View className="px-6 mt-6">
            <Pressable
              onPress={pick}
              className="rounded-2xl overflow-hidden border border-white/10 bg-surface items-center justify-center"
              style={{ aspectRatio: 1 }}
            >
              {asset ? (
                <>
                  <Image
                    source={{ uri: asset.uri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                  {isVideo && (
                    <View className="absolute inset-0 items-center justify-center">
                      <View className="w-14 h-14 rounded-full bg-black/50 items-center justify-center">
                        <Text className="text-white text-2xl">▶</Text>
                      </View>
                    </View>
                  )}
                  <View className="absolute bottom-3 right-3 bg-black/60 rounded-full px-3 py-1.5">
                    <Text className="text-white text-xs font-medium">Change</Text>
                  </View>
                </>
              ) : (
                <View className="items-center px-6 py-16">
                  <Text className="text-text-secondary text-base font-medium">
                    + Choose a photo or video
                  </Text>
                  <Text className="text-text-muted text-sm mt-1 text-center">
                    Videos up to 15 seconds.
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {asset && (
            <>
              <View className="px-6 mt-5">
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Add a caption… (optional)"
                  placeholderTextColor="#817B91"
                  multiline
                  maxLength={280}
                  className="bg-surface rounded-2xl px-4 py-4 text-text-primary text-base leading-relaxed border border-white/8 min-h-[80px]"
                  selectionColor="#A489DE"
                  textAlignVertical="top"
                />
              </View>

              {/* Share toggle */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShare((v) => !v);
                }}
                className="mx-6 mt-5 flex-row items-center justify-between bg-surface rounded-2xl px-5 py-4 border border-white/8"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-text-primary text-base font-semibold">
                    Share this moment
                  </Text>
                  <Text className="text-text-muted text-sm mt-0.5 leading-relaxed">
                    {share
                      ? 'Others will see it in the community feed after a quick check.'
                      : 'Off — it stays private, just for you.'}
                  </Text>
                </View>
                <View
                  className={`w-12 h-7 rounded-full px-0.5 justify-center ${
                    share ? 'bg-accent' : 'bg-surface-2 border border-white/10'
                  }`}
                >
                  <View
                    className={`w-6 h-6 rounded-full bg-white ${share ? 'self-end' : 'self-start'}`}
                  />
                </View>
              </Pressable>

              {/* Attribution (only when sharing) */}
              {share && (
                <View className="px-6 mt-3">
                  <Text className="text-text-muted text-xs font-medium tracking-widest uppercase mb-2.5">
                    Post as
                  </Text>
                  <View className="flex-row gap-2">
                    {[
                      { key: false, label: username ? `@${username}` : 'My username' },
                      { key: true, label: 'Anonymous' },
                    ].map((o) => {
                      const active = anonymous === o.key;
                      return (
                        <Pressable
                          key={String(o.key)}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setAnonymous(o.key as boolean);
                          }}
                          className={`px-4 py-2.5 rounded-full border ${
                            active
                              ? 'bg-surface-2 border-accent'
                              : 'bg-surface border-white/10 active:border-white/25'
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              active ? 'text-text-primary' : 'text-text-secondary'
                            }`}
                          >
                            {o.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              <View className="px-6 mt-8">
                <Pressable
                  onPress={submit}
                  disabled={isPending}
                  className={`rounded-2xl py-4 items-center justify-center overflow-hidden relative ${
                    isPending ? 'bg-surface-2' : 'bg-accent active:bg-accent-dark'
                  }`}
                >
                  {isPending && (
                    <View
                      className="absolute left-0 top-0 bottom-0 bg-accent"
                      style={{ width: `${Math.max(5, Math.round(progress * 100))}%` }}
                    />
                  )}
                  <Text
                    className={`text-base font-semibold ${
                      isPending ? 'text-text-primary' : 'text-bg'
                    }`}
                  >
                    {isPending
                      ? `Uploading… ${Math.round(progress * 100)}%`
                      : share
                        ? 'Share it'
                        : 'Save it'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeArea>
  );
}
