// file: app/dashboard/_layout.tsx

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from "react-native";
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
    <UserProfileProvider>
      <NotificationHandler />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="dashboard" />
      </Stack>
    </UserProfileProvider>
  );
}