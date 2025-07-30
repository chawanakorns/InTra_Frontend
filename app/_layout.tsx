// file: app/dashboard/_layout.tsx

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { UserProfileProvider } from "../context/UserProfileContext";
// --- NEW: Import the NotificationProvider ---
import { NotificationProvider } from "../context/NotificationContext";

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
    // --- WRAP with NotificationProvider ---
    <NotificationProvider>
      <UserProfileProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </UserProfileProvider>
    </NotificationProvider>
  );
}