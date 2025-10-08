import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

// --- Reusable Row Component ---
const SettingRow = ({ icon, title, subtitle, children }: { icon: any, title: string, subtitle?: string, children: React.ReactNode }) => (
    <View style={styles.settingRow}>
        <MaterialIcons name={icon} size={24} color="#6366F1" style={styles.icon} />
        <View style={styles.textContainer}>
            <Text style={styles.settingTitle}>{title}</Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
        {children}
    </View>
);

const NavRow = ({ icon, title, onPress }: { icon: any, title: string, onPress: () => void }) => (
    <TouchableOpacity onPress={onPress}>
        <SettingRow icon={icon} title={title}>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
        </SettingRow>
    </TouchableOpacity>
);

const SwitchRow = ({ icon, title, subtitle, value, onValueChange }: { icon: any, title: string, subtitle: string, value: boolean, onValueChange: (value: boolean) => void }) => (
    <TouchableOpacity onPress={() => onValueChange(!value)} activeOpacity={1}>
        <SettingRow icon={icon} title={title} subtitle={subtitle}>
            <Switch
                trackColor={{ false: '#E5E7EB', true: '#818CF8' }}
                thumbColor={value ? '#6366F1' : '#f4f3f4'}
                onValueChange={onValueChange}
                value={value}
            />
        </SettingRow>
    </TouchableOpacity>
);


export default function SettingsScreen() {
  const router = useRouter();
  const [securityNotifications, setSecurityNotifications] = useState(true);
  const [smartAlerts, setSmartAlerts] = useState(true);
  const [recommendations, setRecommendations] = useState(true);
  const [tips, setTips] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout", "Are you sure you want to log out?",
      [{ text: "Cancel", style: "cancel" }, {
        text: "Log Out", style: "destructive",
        onPress: () => {
          // Add your logout logic here (e.g., clearing async storage, context, etc.)
          router.replace('/auth/sign-in');
        }
      }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.title}>Settings</Text>
            <View style={{ width: 40 }} /> 
        </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.sectionCard}>
            <SwitchRow 
              icon="security" 
              title="Security Alerts"
              subtitle="Password changes, login attempts"
              value={securityNotifications}
              onValueChange={setSecurityNotifications}
            />
            <View style={styles.divider} />
            <SwitchRow 
              icon="watch-later" 
              title="Smart Itinerary Alerts"
              subtitle="Reminders for your next activity"
              value={smartAlerts}
              onValueChange={setSmartAlerts}
            />
            <View style={styles.divider} />
            <SwitchRow 
              icon="lightbulb-outline" 
              title="Opportunity Alerts"
              subtitle="Nearby events and places"
              value={recommendations}
              onValueChange={setRecommendations}
            />
             <View style={styles.divider} />
            <SwitchRow 
              icon="assistant" 
              title="Real-Time Tips"
              subtitle="Suggestions for weather or events"
              value={tips}
              onValueChange={setTips}
            />
          </View>
        </View>
        
        {/* Support Section */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <View style={styles.sectionCard}>
                <NavRow icon="help-outline" title="Help Center" onPress={() => { /* Navigate to help center */ }} />
                <View style={styles.divider} />
                <NavRow icon="contact-support" title="Contact Us" onPress={() => { /* Navigate to contact screen */ }} />
            </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', marginTop: 40},
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 6,
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#1F2937',
  },
  scrollContent: {
    padding: 20,
  },
  section: { 
    marginBottom: 30,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#6B7280', 
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  icon: {
    marginRight: 20,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: '#1F2937', 
  },
  settingSubtitle: { 
    fontSize: 13, 
    color: '#6B7280', 
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 64, // Align with text
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
});