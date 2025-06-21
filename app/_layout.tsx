import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { UserProfileProvider } from "./context/UserProfileContext"; // ✅ import the provider

export default function Rootlayout() {
  useFonts({
    'outfit': require('./../assets/fonts/Outfit-Regular.ttf'),
    'outfit-medium': require('./../assets/fonts/Outfit-Medium.ttf'),
    'outfit-bold': require('./../assets/fonts/Outfit-Bold.ttf'),
    'cinzelDeco': require('./../assets/fonts/CinzelDecorative-Regular.ttf'),
    'cinzelDeco-bold': require('./../assets/fonts/CinzelDecorative-Bold.ttf'),
    'cinzelDeco-black': require('./../assets/fonts/CinzelDecorative-Black.ttf'),
  });

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <UserProfileProvider> {/* ✅ Wrap all screens with context */}
          <Stack screenOptions={{ headerShown: false }} />
        </UserProfileProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
