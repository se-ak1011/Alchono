import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View className="flex-1 bg-bg items-center justify-center px-6">
        <Text className="text-4xl mb-4">⚡</Text>
        <Text className="text-text-primary text-xl font-semibold mb-2">Page not found</Text>
        <Text className="text-text-secondary text-sm text-center mb-6">
          This page doesn't exist.
        </Text>
        <Link href="/(tabs)" className="text-accent text-base font-medium">
          Go home
        </Link>
      </View>
    </>
  );
}
