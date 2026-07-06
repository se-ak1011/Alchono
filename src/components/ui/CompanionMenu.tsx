import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

type CompanionMenuProps = {
  visible: boolean;
  onClose: () => void;
};

type CompanionMenuOption = {
  label: string;
  helper: string;
  route: string;
};

const OPTIONS: CompanionMenuOption[] = [
  { label: 'Talk', helper: 'AI Coach', route: '/support/coach' },
  { label: 'Journal', helper: 'Journal', route: '/(tabs)/journal' },
  { label: 'Toolkit', helper: 'Toolkit', route: '/toolkit' },
  { label: 'Reset', helper: 'Games / reset', route: '/session/games' },
  { label: 'Insights', helper: 'Insights', route: '/(tabs)/insights' },
  { label: 'Care Team', helper: 'Profile care team', route: '/profile/care-team' },
  { label: 'Profile', helper: 'Profile', route: '/(tabs)/profile' },
];

export function CompanionMenu({ visible, onClose }: CompanionMenuProps) {
  const router = useRouter();

  const openRoute = async (route: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push(route as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end" pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close companion menu"
          onPress={onClose}
          className="absolute inset-0 bg-black/20"
        />
        <View className="px-4 pb-6">
          <View
            className="bg-surface rounded-3xl border border-white/10 px-5 pt-5 pb-4"
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.28,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 14 },
            }}
          >
            <Text className="text-text-primary text-xl font-semibold tracking-tight">
              How can I help?
            </Text>
            <Text className="text-text-muted text-sm mt-1 mb-4 leading-relaxed">
              Choose a quiet next step, or keep exploring.
            </Text>

            <View className="gap-2">
              {OPTIONS.map((option) => (
                <Pressable
                  key={option.route}
                  accessibilityRole="button"
                  onPress={() => openRoute(option.route)}
                  className="flex-row items-center justify-between rounded-2xl bg-surface-2 border border-white/5 px-4 py-3 active:border-white/15"
                >
                  <View>
                    <Text className="text-text-primary text-base font-medium">
                      {option.label}
                    </Text>
                    <Text className="text-text-muted text-xs mt-0.5">
                      {option.helper}
                    </Text>
                  </View>
                  <Text className="text-text-muted text-base">→</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              className="items-center rounded-2xl px-4 py-3 mt-3 active:bg-white/5"
            >
              <Text className="text-text-muted text-sm font-medium">Never mind</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
