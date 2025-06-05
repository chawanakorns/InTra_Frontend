import { Stack } from "expo-router";

export default function NotificationLayout() {
  return (
    <Stack>
      <Stack.Screen name="notification" options={{ title: 'Settings', headerShown: false }} />
    </Stack>
  );
}