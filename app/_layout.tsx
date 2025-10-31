// file: app/dashboard/_layout.tsx

import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import React, { useContext, useEffect } from 'react';
import { ActivityIndicator, View } from "react-native";
import { AuthContext, AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ThemeProvider } from '../context/ThemeContext';
import { UserProfileProvider, useUserProfile } from "../context/UserProfileContext";

import { registerForPushNotificationsAsync } from '../services/notificationService';

function NotificationHandler() {
    const { profile } = useUserProfile();
    useEffect(() => {
        if (profile) {
            console.log("User is logged in, registering for push notifications.");
            registerForPushNotificationsAsync();
        } else {
            console.log("User is not logged in, skipping push notification registration.");
        }
    }, [profile]);
    return null;
}

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'outfit': require('./../assets/fonts/Outfit-Regular.ttf'),
    'outfit-medium': require('./../assets/fonts/Outfit-Medium.ttf'),
    'outfit-bold': require('./../assets/fonts/Outfit-Bold.ttf'),
    'cinzelDeco': require('./../assets/fonts/CinzelDecorative-Regular.ttf'),
    'cinzelDeco-bold': require('./../assets/fonts/CinzelDecorative-Bold.ttf'),
    'cinzelDeco-black': require('./../assets/fonts/CinzelDecorative-Black.ttf'),
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <UserProfileProvider>
            <NotificationHandler />
            <InnerRoutes />
          </UserProfileProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

function InnerRoutes() {
  const router = useRouter();
  const { user, initializing } = useContext(AuthContext);

  useEffect(() => {
    if (initializing) return;
    try {
  if (user) router.replace('/dashboard' as any);
  else router.replace('/' as any);
    } catch (err) {
      console.warn('Router replace failed', err);
    }
  }, [initializing, user, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}