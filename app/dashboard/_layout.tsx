import { Ionicons } from "@expo/vector-icons";
import * as Notifications from 'expo-notifications';
import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useRef } from 'react';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { registerForPushNotificationsAsync } from '../../services/notificationService';

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
  return <Ionicons size={26} name={iconName as any} color={color} />;
}

export default function DashboardTabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

  const notificationListener = useRef<Notifications.Subscription>(null);
  const responseListener = useRef<Notifications.Subscription>(null);

  useEffect(() => {
    registerForPushNotificationsAsync();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification Received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification Tapped:', response);
      const data = response.notification.request.content.data;
      if (data && data.screen === 'itinerary') {
        router.navigate('/dashboard/itinerary/calendar');
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.icon,
          tabBarStyle: {
            height: 65 + insets.bottom,
            paddingTop: 10,
            paddingBottom: 5 + insets.bottom,
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.cardBorder,
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: -5,
          },
        }}
      >
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
        <Tabs.Screen name="notifications/index" options={{ href: null }} />
        <Tabs.Screen name="home/recommendations" options={{ href: null }} />
        <Tabs.Screen name="profile/setting" options={{ href: null }} />
        <Tabs.Screen name="profile/editprofile/editprofile" options={{ href: null }} />
      </Tabs>
    </SafeAreaProvider>
  );
}