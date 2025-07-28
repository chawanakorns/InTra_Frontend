import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView, StyleSheet, Switch, Text,
  TouchableOpacity, View, Alert
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, sendNotificationToBackend } from '../../services/notification';

export default function SettingsScreen() {
  const router = useRouter();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [securityNotifications, setSecurityNotifications] = useState(true);
  const [reminders, setReminders] = useState(false);
  const [recommendations, setRecommendations] = useState(true);
  const [tips, setTips] = useState(true);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) setPushToken(token);
    });

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      Alert.alert("New Notification", notification.request.content.title + '\n' + notification.request.content.body);
    });

    return () => subscription.remove();
  }, []);

  const triggerTestNotification = async (title: string, body: string) => {
    if (pushToken) {
      await sendNotificationToBackend(pushToken, title, body);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/dashboard/profile/profile')}>
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.sectionSubtitle}>Choose your preferences</Text>

        <View style={styles.notificationItem}>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>Security</Text>
            <Text style={styles.notificationDescription}>Password resets, login attempts</Text>
          </View>
          <Switch value={securityNotifications} onValueChange={(v) => {
            setSecurityNotifications(v);
            if (v) triggerTestNotification("Security Alert", "New login attempt detected");
          }} />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>Reminders</Text>
            <Text style={styles.notificationDescription}>Upcoming travel plans</Text>
          </View>
          <Switch value={reminders} onValueChange={(v) => {
            setReminders(v);
            if (v) triggerTestNotification("Reminder", "Trip starts in 2 days");
          }} />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>Recommendations</Text>
            <Text style={styles.notificationDescription}>Nearby places to explore</Text>
          </View>
          <Switch value={recommendations} onValueChange={(v) => {
            setRecommendations(v);
            if (v) triggerTestNotification("Recommendation", "Don't miss the floating market!");
          }} />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>Tips</Text>
            <Text style={styles.notificationDescription}>Useful advice before departure</Text>
          </View>
          <Switch value={tips} onValueChange={(v) => {
            setTips(v);
            if (v) triggerTestNotification("Travel Tip", "Bring an umbrella, rain expected!");
          }} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginLeft: 10 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  sectionSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  notificationItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  notificationText: { flex: 1 },
  notificationTitle: { fontSize: 16, fontWeight: '600' },
  notificationDescription: { fontSize: 14, color: '#666' },
});
