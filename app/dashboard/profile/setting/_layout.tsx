import { Stack } from 'expo-router';
import React from 'react';

export default function SettingLayout() {
  return (
    <Stack>
      <Stack.Screen name="setting" options={{ title: 'Settings', headerShown: false }} />
    </Stack>
  );
}