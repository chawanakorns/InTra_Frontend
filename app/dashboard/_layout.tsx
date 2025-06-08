import { Feather, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#6366F1",
          tabBarInactiveTintColor: "#666",
          tabBarStyle: {
            height: 40 + insets.bottom,
            paddingBottom: 8 + insets.bottom,
            paddingTop: 8,
          },
        }}
      >
        <Tabs.Screen
          name="home/index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Feather name="home" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="itinerary/calendar"
          options={{
            title: "Calendar",
            tabBarIcon: ({ color }) => (
              <Feather name="calendar" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="bookmark/bookmarks"
          options={{
            title: "Bookmarks",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="bookmark" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile/profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <Feather name="user" size={24} color={color} />
            ),
          }}
        />

        {/* Hide other routes from tabs */}
        <Tabs.Screen
          name="home/recommendations"
          options={{
            href: null, // This hides it from the tab bar
          }}
        />
        <Tabs.Screen
          name="profile/setting"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
