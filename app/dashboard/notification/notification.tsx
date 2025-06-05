import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

export const notificationsData = [
  {
    id: "1",
    title: "InTra",
    message:
      "Don't forget! Your trip to Chiang Mai starts tomorrow. Check your itinerary now!",
    timeGroup: "today",
  },
  {
    id: "2",
    title: "InTra",
    message:
      "Discover popular spots! Visit the Night Bazaar and Khao Soi Khun Yai in Chiang Mai today.",
    timeGroup: "today",
  },
  {
    id: "3",
    title: "InTra",
    message:
      "Tip for tomorrow: Bring sunscreen for your Doi Suthep hike in Chiang Mai. Enjoy your trip!",
    timeGroup: "today",
  },
  {
    id: "4",
    title: "InTra",
    message:
      "Don't forget! Your trip to Chiang Mai starts tomorrow. Check your itinerary now!",
    timeGroup: "week",
  },
  {
    id: "5",
    title: "InTra",
    message:
      "Discover popular spots! Visit the Night Bazaar and Khao Soi Khun Yai in Chiang Mai today.",
    timeGroup: "week",
  },
  {
    id: "6",
    title: "InTra",
    message:
      "Tip for tomorrow: Bring sunscreen for your Doi Suthep hike in Chiang Mai. Enjoy your trip!",
    timeGroup: "week",
  },
];

export default function NotificationsScreen() {
  const router = useRouter();

  const renderItem = ({ item }) => (
    <View style={styles.notification}>
      <View style={styles.dot} />
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>In</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Today's Notifications */}
      <Text style={styles.sectionTitle}>Today</Text>
      <FlatList
        data={notificationsData.filter((item) => item.timeGroup === "today")}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false}
      />

      {/* 1 Week Ago */}
      <Text style={styles.sectionTitle}>1 weeks ago</Text>
      <FlatList
        data={notificationsData.filter((item) => item.timeGroup === "week")}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 12,
  },
  notification: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  dot: {
    width: 10,
    height: 10,
    backgroundColor: "red",
    borderRadius: 5,
    marginTop: 10,
    marginRight: 10,
  },
  avatar: {
    backgroundColor: "#93C5FD",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: "#333",
  },
});
