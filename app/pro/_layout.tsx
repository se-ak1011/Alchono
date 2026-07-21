import React from 'react';
import { Tabs } from 'expo-router';
import { View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { HomeIcon, ProfileIcon } from '@/components/icons/TabIcons';

const PRO_TABS: Record<string, { label: string; Icon: typeof HomeIcon }> = {
  index: { label: 'Clients', Icon: HomeIcon },
  profile: { label: 'Profile', Icon: ProfileIcon },
};

function ProTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: '#363040',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        paddingBottom: insets.bottom,
        paddingTop: 10,
        paddingHorizontal: 8,
        flexDirection: 'row',
      }}
    >
      {state.routes
        .filter((r: any) => PRO_TABS[r.name])
        .map((route: any) => {
          const tab = PRO_TABS[route.name];
          const isFocused =
            state.routes[state.index]?.name === route.name;
          return (
            <Pressable
              key={route.key}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}
            >
              <tab.Icon
                size={26}
                color={isFocused ? '#A489DE' : '#817B91'}
                strokeWidth={isFocused ? 2 : 1.75}
              />
              <Text
                style={{
                  fontSize: 12,
                  marginTop: 4,
                  fontFamily: isFocused ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  color: isFocused ? '#A489DE' : '#817B91',
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
    </View>
  );
}

export default function ProLayout() {
  return (
    <Tabs tabBar={(props) => <ProTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="add/[username]" options={{ href: null }} />
    </Tabs>
  );
}
