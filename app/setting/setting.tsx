import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();

  // Updated toggle states to match image
  const [securityNotifications, setSecurityNotifications] = useState(true);
  const [reminders, setReminders] = useState(false);
  const [recommendations, setRecommendations] = useState(true);
  const [tips, setTips] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      {/* Pagination dots */}
      <View style={styles.dotsContainer}>
        <View style={[styles.dot, { backgroundColor: '#D1D5DB' }]} />
        <View style={[styles.dot, { backgroundColor: '#6B7280' }]} />
        <View style={[styles.dot, { backgroundColor: '#D1D5DB' }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.sectionSubtitle}>
          Select the kinds of notifications you get about your attractions and restaurants
        </Text>

        {/* Security */}
        <View style={styles.notificationItem}>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>Security Informations</Text>
            <Text style={styles.notificationDescription}>Password Resets, Login Attempt</Text>
          </View>
          <Switch
            trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
            thumbColor="#FFFFFF"
            onValueChange={setSecurityNotifications}
            value={securityNotifications}
          />
        </View>

        {/* Reminders */}
        <View style={styles.notificationItem}>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>Reminders</Text>
            <Text style={styles.notificationDescription}>
              To remind the upcoming plans in your itineraries
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
            thumbColor="#FFFFFF"
            onValueChange={setReminders}
            value={reminders}
          />
        </View>

        {/* Recommendations */}
        <View style={styles.notificationItem}>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>Recommendations</Text>
            <Text style={styles.notificationDescription}>
              Show the popular tourist attractions and restaurants
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
            thumbColor="#FFFFFF"
            onValueChange={setRecommendations}
            value={recommendations}
          />
        </View>

        {/* Tips */}
        <View style={styles.notificationItem}>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>Tips about upcoming itinerary’s plans</Text>
            <Text style={styles.notificationDescription}>
              To suggest to prepare for unexpected events for your upcoming plans
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  dotsContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 10,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 25,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  notificationText: {
    flex: 1,
    marginRight: 10,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 5,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});
