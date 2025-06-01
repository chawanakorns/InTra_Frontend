import { Stack } from 'expo-router';
import React from 'react';

export default function RestaurantsLayout() {
  return (
    <Stack>
      <Stack.Screen name="restaurants" options={{ title: 'Restaurants', headerShown: false }} />
      <Stack.Screen name="restaurantDetailScreen" options={{ title: 'Restaurant Details', headerShown: false }} />
    </Stack>
  );
}