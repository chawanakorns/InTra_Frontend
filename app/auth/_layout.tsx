import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in/index" />
      <Stack.Screen name="sign-up/index" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="personalize/kindOfusers" />
      <Stack.Screen name="personalize/typeOfactivities" />
      <Stack.Screen name="personalize/kindOfcuisine" />
      <Stack.Screen name="personalize/typeOfdining" />
      <Stack.Screen name="personalize/prefersTimes" />
    </Stack>
  );
}