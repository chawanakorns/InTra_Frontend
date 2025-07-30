import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const dummyNotifications = [
  { id: "1", title: "Trip Reminder", body: "Your Bangkok trip starts tomorrow!" },
  { id: "2", title: "New Destination", body: "Chiang Mai is trending this week!" },
  { id: "3", title: "Security Tip", body: "Don't forget to enable 2FA." },
];

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      <FlatList
        data={dummyNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  card: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  body: { fontSize: 14, color: "#444" },
});
