import { Feather, MaterialIcons } from '@expo/vector-icons';
import React from 'react';

export const tabIcons = {
  index: ({ color }: { color: string }) => <Feather name="home" size={24} color={color} />,
  calendar: ({ color }: { color: string }) => <Feather name="calendar" size={24} color={color} />,
  bookmarks: ({ color }: { color: string }) => <MaterialIcons name="bookmark" size={24} color={color} />,
  profile: ({ color }: { color: string }) => <Feather name="user" size={24} color={color} />,
};