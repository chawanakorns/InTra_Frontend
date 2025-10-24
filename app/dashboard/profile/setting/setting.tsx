import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useUserProfile } from '../../../../context/UserProfileContext';
import { API_URL } from '../../../config';

// A reusable Row Component that is now theme-aware
const SettingRow = ({ icon, title, subtitle, children }: { icon: keyof typeof MaterialIcons.glyphMap, title: string, subtitle?: string, children: React.ReactNode }) => {
    const { colors } = useTheme();
    return (
        <View style={styles.settingRow}>
            <MaterialIcons name={icon} size={24} color={colors.primary} style={styles.icon} />
            <View style={styles.textContainer}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
                {subtitle && <Text style={[styles.settingSubtitle, { color: colors.icon }]}>{subtitle}</Text>}
            </View>
            {children}
        </View>
    );
};

const NavRow = ({ icon, title, onPress }: { icon: keyof typeof MaterialIcons.glyphMap, title: string, onPress: () => void }) => {
    const { colors } = useTheme();
    return (
        <TouchableOpacity onPress={onPress}>
            <SettingRow icon={icon} title={title}>
                <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </SettingRow>
        </TouchableOpacity>
    );
};

const SwitchRow = ({ icon, title, subtitle, value, onValueChange, isSaving }: { icon: keyof typeof MaterialIcons.glyphMap, title: string, subtitle: string, value: boolean, onValueChange: (value: boolean) => void, isSaving: boolean }) => {
    const { colors } = useTheme();
    return (
        <TouchableOpacity onPress={() => onValueChange(!value)} activeOpacity={1} disabled={isSaving}>
            <SettingRow icon={icon} title={title} subtitle={subtitle}>
                {isSaving ?
                    <ActivityIndicator color={colors.primary} /> :
                    <Switch
                        trackColor={{ false: '#E5E7EB', true: colors.tint }}
                        thumbColor={value ? colors.primary : '#f4f3f4'}
                        onValueChange={onValueChange}
                        value={value}
                    />
                }
            </SettingRow>
        </TouchableOpacity>
    );
};


export default function SettingsScreen() {
  const router = useRouter();
  const { profile, fetchUserProfile } = useUserProfile();
  const { colors, isDark, toggleTheme } = useTheme();

  // Local state to manage UI, initialized from the profile context
  const [smartAlerts, setSmartAlerts] = useState(profile?.allowSmartAlerts ?? true);
  const [opportunityAlerts, setOpportunityAlerts] = useState(profile?.allowOpportunityAlerts ?? true);
  const [realTimeTips, setRealTimeTips] = useState(profile?.allowRealTimeTips ?? true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setSmartAlerts(profile.allowSmartAlerts);
      setOpportunityAlerts(profile.allowOpportunityAlerts);
      setRealTimeTips(profile.allowRealTimeTips);
    }
  }, [profile]);

  const handleSettingChange = async (settingName: 'allow_smart_alerts' | 'allow_opportunity_alerts' | 'allow_real_time_tips', value: boolean) => {
    // Optimistic UI update
    if (settingName === 'allow_smart_alerts') setSmartAlerts(value);
    if (settingName === 'allow_opportunity_alerts') setOpportunityAlerts(value);
    if (settingName === 'allow_real_time_tips') setRealTimeTips(value);

    setIsSaving(settingName);

    try {
      const token = await AsyncStorage.getItem("firebase_id_token");
      if (!token) throw new Error("Authentication token not found");

      const response = await fetch(`${API_URL}/auth/me/settings`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ [settingName]: value })
      });

      if (!response.ok) throw new Error("Failed to save setting.");
      
      // Refresh the global profile to confirm the change from the server
      await fetchUserProfile();

    } catch (error) {
      Alert.alert("Error", "Could not save your setting. Please try again.");
      // Rollback UI on error
      if (profile) {
        setSmartAlerts(profile.allowSmartAlerts);
        setOpportunityAlerts(profile.allowOpportunityAlerts);
        setRealTimeTips(profile.allowRealTimeTips);
      }
    } finally {
      setIsSaving(null);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout", "Are you sure you want to log out?",
      [{ text: "Cancel", style: "cancel" }, {
        text: "Log Out", style: "destructive",
        onPress: async () => {
          // This should sign the user out from Firebase
          // await signOut(auth); // Assuming you have firebase auth imported
          await AsyncStorage.removeItem('firebase_id_token');
          fetchUserProfile(); // This will clear the profile
          router.replace('/auth/sign-in');
        }
      }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
            <View style={{ width: 40 }} /> 
        </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.icon }]}>Appearance</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <SwitchRow
              icon="brightness-6"
              title="Dark Mode"
              subtitle={isDark ? "Enabled" : "Disabled"}
              value={isDark}
              onValueChange={toggleTheme}
              isSaving={false} // This toggle is instant, no saving indicator needed
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.icon }]}>Notifications</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <SwitchRow 
              icon="watch-later" 
              title="Smart Itinerary Alerts"
              subtitle="Reminders for your next activity"
              value={Boolean(smartAlerts)}
              onValueChange={(value) => handleSettingChange('allow_smart_alerts', value)}
              isSaving={isSaving === 'allow_smart_alerts'}
            />
            <View style={[styles.divider, { backgroundColor: colors.secondary }]} />
            <SwitchRow 
              icon="lightbulb-outline" 
              title="Opportunity Alerts"
              subtitle="Nearby events and places"
              value={Boolean(opportunityAlerts)}
              onValueChange={(value) => handleSettingChange('allow_opportunity_alerts', value)}
              isSaving={isSaving === 'allow_opportunity_alerts'}
            />
             <View style={[styles.divider, { backgroundColor: colors.secondary }]} />
            <SwitchRow 
              icon="assistant" 
              title="Real-Time Tips"
              subtitle="Suggestions for weather or events"
              value={Boolean(realTimeTips)}
              onValueChange={(value) => handleSettingChange('allow_real_time_tips', value)}
              isSaving={isSaving === 'allow_real_time_tips'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.icon }]}>About</Text>
           <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <NavRow icon="description" title="Terms of Service" onPress={() => Alert.alert("Terms of Service", "TOS details would go here.")}/>
            <View style={[styles.divider, { backgroundColor: colors.secondary }]} />
            <NavRow icon="privacy-tip" title="Privacy Policy" onPress={() => Alert.alert("Privacy Policy", "Privacy details would go here.")}/>
             <View style={[styles.divider, { backgroundColor: colors.secondary }]} />
            <SettingRow icon="info-outline" title="App Version">
              <Text style={[styles.versionText, { color: colors.icon }]}>1.0.0</Text>
            </SettingRow>
          </View>
        </View>

        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.danger }]} onPress={handleLogout}>
          <Text style={[styles.logoutButtonText, { color: colors.text }]}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? 30 : 0 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
  },
  scrollContent: {
    padding: 20,
  },
  section: { 
    marginBottom: 30,
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 12,
    paddingHorizontal: 5,
    textTransform: 'uppercase',
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
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
  },
  settingSubtitle: { 
    fontSize: 13, 
    marginTop: 2,
  },
  versionText: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginLeft: 64,
  },
  logoutButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});