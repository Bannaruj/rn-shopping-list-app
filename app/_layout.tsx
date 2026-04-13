import { Theme } from '@/constants/Theme';
import { FamilyProvider, useFamily } from '@/contexts/FamilyContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { familyId, isLoading } = useFamily();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inJoinGroup = segments[0] === 'join';

    if (!familyId && !inJoinGroup) {
      // Redirect to join page if not joined
      router.replace('/join');
    } else if (familyId && inJoinGroup) {
      // Redirect to tabs if joined
      router.replace('/' as any);
    }
  }, [familyId, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background }}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="join" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <FamilyProvider>
      <RootLayoutNav />
      <StatusBar style="auto" />
    </FamilyProvider>
  );
}
