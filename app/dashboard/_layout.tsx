// file: app/dashboard/profile/_layout.tsx

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect } from 'react'; // <-- IMPORT useEffect
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { registerForPushNotificationsAsync } from '../../services/notificationService'; // <-- IMPORT THE SERVICE

const COLORS = {
  primary: "#6366F1",
  gray: "#9CA3AF",
  lightGray: "#F3F4F6",
  white: "#FFFFFF",
  dark: "#111827",
};

function TabBarIcon({
  name,
  color,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  focused: boolean;
}) {
  const iconName = focused ? name : `${name}-outline`;
  return <Ionicons size={24} name={iconName as any} color={color} />;
}

export default function DashboardTabLayout() {
  const insets = useSafeAreaInsets();

  // --- ADD THIS HOOK ---
  // This hook runs when the component mounts, which is perfect for one-time setup tasks
  // like registering for push notifications after a user logs in.
  useEffect(() => {
    // We call the function to get permission and the token.
    // The service itself handles sending the token to your backend.
    registerForPushNotificationsAsync();
  }, []); // The empty dependency array [] ensures this effect runs only once.
  // --------------------

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.gray,
          tabBarStyle: {
            height: 60 + insets.bottom,
            paddingTop: 10,
            paddingBottom: 5 + insets.bottom,
            backgroundColor: COLORS.white,
            borderTopWidth: 1,
            borderTopColor: COLORS.lightGray,
            elevation: 5,
            shadowColor: COLORS.dark,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: -5,
          },
        }}
      >
        {/* Visible Tabs */}
        <Tabs.Screen
          name="home/index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="home" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="itinerary/calendar"
          options={{
            title: "Itinerary",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="calendar" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="bookmark/bookmarks"
          options={{
            title: "Bookmarks",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="bookmark" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile/profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="person" color={color} focused={focused} />
            ),
          }}
        />

        {/* --- MODIFIED: Notification screen is now hidden from the tab bar --- */}
        <Tabs.Screen
          name="notifications/index" // This still refers to the app/dashboard/notification directory
          options={{
            href: null, // This hides the tab from the navigation bar
          }}
        />

        {/* Other Hidden Routes */}
        <Tabs.Screen name="home/recommendations" options={{ href: null }} />
        <Tabs.Screen name="profile/setting" options={{ href: null }} />
        <Tabs.Screen
          name="profile/editprofile/editprofile"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}