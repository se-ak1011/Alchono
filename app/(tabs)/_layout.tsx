import React from 'react';
import { Tabs } from 'expo-router';
import { View, Pressable, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  HomeIcon,
  SupportIcon,
  InsightsIcon,
  ProfileIcon,
} from '@/components/icons/TabIcons';

const TABS = [
  { name: 'index', label: 'Home', Icon: HomeIcon },
  { name: 'support', label: 'Support', Icon: SupportIcon },
  { name: 'insights', label: 'Insights', Icon: InsightsIcon },
  { name: 'profile', label: 'Profile', Icon: ProfileIcon },
] as const;

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: '#161718',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        paddingBottom: insets.bottom,
        paddingTop: 10,
        paddingHorizontal: 8,
        flexDirection: 'row',
      }}
    >
      {state.routes.map((route: any, index: number) => {
        const tab = TABS[index];
        const isFocused = state.index === index;

        return (
          <TabItem
            key={route.key}
            tab={tab}
            isFocused={isFocused}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          />
        );
      })}
    </View>
  );
}

function TabItem({
  tab,
  isFocused,
  onPress,
}: {
  tab: (typeof TABS)[number];
  isFocused: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.88, { damping: 12, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 300 });
      }}
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={{ flex: 1, alignItems: 'center' }}
    >
      <Animated.View style={[animatedStyle, { alignItems: 'center', paddingVertical: 6 }]}>
        <tab.Icon
          size={26}
          color={isFocused ? '#C4C9D0' : '#5E6472'}
          strokeWidth={isFocused ? 2 : 1.75}
        />
        <Text
          style={{
            fontSize: 12,
            marginTop: 4,
            fontFamily: isFocused ? 'Inter_600SemiBold' : 'Inter_400Regular',
            color: isFocused ? '#C4C9D0' : '#5E6472',
          }}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="support" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
