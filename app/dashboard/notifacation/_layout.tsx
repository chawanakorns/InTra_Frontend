import { Stack } from "expo-router";

export default function NotificationLayout() {
  return (
    <Stack>
      <Stack.Screen name="notification" options={{ title: 'Notification', headerShown: false }} />
    </Stack>
  );
}