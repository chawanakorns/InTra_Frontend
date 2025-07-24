import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const [securityNotifications, setSecurityNotifications] = useState(true);
  const [smartAlerts, setSmartAlerts] = useState(true);
  const [recommendations, setRecommendations] = useState(true);
  const [tips, setTips] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.sectionSubtitle}>
          Select the kinds of notifications you get about your travel plans.
        </Text>

        <View style={styles.notificationItem}>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>Security Information</Text>
            <Text style={styles.notificationDescription}>Password Resets, Login Attempts</Text>
          </View>
          <Switch
            trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
            thumbColor="#FFFFFF"
            onValueChange={setSecurityNotifications}
            value={securityNotifications}
          />
        </View>
        <View style={styles.notificationItem}>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>Smart Itinerary Alerts</Text>
            <Text style={styles.notificationDescription}>
              Reminds you when to leave for your next activity based on travel time.
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
            thumbColor="#FFFFFF"
            onValueChange={setSmartAlerts}
            value={smartAlerts}
          />
        </View>
        <View style={styles.notificationItem}>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>Opportunity Alerts</Text>
            <Text style={styles.notificationDescription}>
              Nearby events or places that match your preferences.
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
            thumbColor="#FFFFFF"
            onValueChange={setRecommendations}
            value={recommendations}
          />
        </View>
        <View style={styles.notificationItem}>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>Real-Time Adjustments & Tips</Text>
            <Text style={styles.notificationDescription}>
              Suggestions for weather changes or unexpected events.
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
            thumbColor="#FFFFFF"
            onValueChange={setTips}
            value={tips}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginLeft: 10 },
  section: { paddingHorizontal: 24, paddingTop: 30 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 5 },
  sectionSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 25 },
  notificationItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  notificationText: { flex: 1, marginRight: 10 },
  notificationTitle: { fontSize: 16, fontWeight: '500', color: '#1F2937', marginBottom: 5 },
  notificationDescription: { fontSize: 14, color: '#6B7280' },
});