/**
 * Root Layout — Protected navigation with AuthProvider.
 *
 * Shows auth screens when not logged in, main tabs when logged in.
 * Splash screen stays visible while auth state is loading.
 *
 * </UV>
 */

import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
import { Colors } from '../constants/theme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function ProtectedRoutes() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'sign-in' || segments[0] === 'sign-up';

    if (!session && !inAuthGroup) {
      // Not signed in → redirect to sign-in
      router.replace('/sign-in');
    } else if (session && inAuthGroup) {
      // Signed in but on auth screen → redirect to home
      router.replace('/');
    }
  }, [session, loading, segments]);

  // Show loading indicator while auth state is resolving
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  // Prevent flash: don't render app content if not authenticated and not on auth screen
  const inAuthGroup = segments[0] === 'sign-in' || segments[0] === 'sign-up';
  if (!session && !inAuthGroup) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.light.background }} />
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.light.background },
      }}
    >
      <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
      <Stack.Screen name="sign-up" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="create-group"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="group/[id]/index" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen
        name="group/[id]/add-expense"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="group/[id]/settle"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ProtectedRoutes />
    </AuthProvider>
  );
}
