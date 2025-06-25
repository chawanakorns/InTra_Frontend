import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useUserProfile } from '../../../context/UserProfileContext';
import { API_URL } from '../../config';

// A view to show when the user is not logged in.
const LoginRequiredView = ({ onLoginPress }: { onLoginPress: () => void }) => (
  <View style={styles.centeredContainer}>
    <MaterialIcons name="person-off" size={60} color="#9CA3AF" />
    <Text style={styles.messageTitle}>You&apos;re Not Logged In</Text>
    <Text style={styles.messageText}>Log in to view your profile, trips, and bookmarks.</Text>
    <TouchableOpacity style={styles.loginButton} onPress={onLoginPress}>
      <Text style={styles.loginButtonText}>Log In or Sign Up</Text>
    </TouchableOpacity>
  </View>
);

// Helper function to construct full image URLs for display.
const createFullImageUrl = (path?: string) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path}`;
};

// Helper function to calculate age from a date string (YYYY-MM-DD).
const calculateAge = (dobString?: string): string | number => {
    if (!dobString) return "--";
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

// Reusable components for the UI.
const StatItem = ({ value, label }: { value: string | number, label: string }) => (
    <View style={styles.statItem}>
        <Text style={styles.statNumber}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);
const InfoTag = ({ text }: { text: string }) => (
    <View style={styles.tag}>
        <Text style={styles.tagText}>{text}</Text>
    </View>
);
const MenuButton = ({ icon, label, onPress }: { icon: any, label: string, onPress: () => void }) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
        <View style={styles.iconBg}>
            <MaterialIcons name={icon} size={24} color="#6366F1" />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, isLoading, fetchUserProfile } = useUserProfile();
  
  const [itineraryCount, setItineraryCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        await fetchUserProfile();
        try {
          const token = await AsyncStorage.getItem('access_token');
          if (!token) return;

          const [itinerariesRes, bookmarksRes] = await Promise.all([
            fetch(`${API_URL}/api/itineraries/`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/api/bookmarks/`, { headers: { Authorization: `Bearer ${token}` } })
          ]);

          if (itinerariesRes.ok) setItineraryCount((await itinerariesRes.json()).length);
          if (bookmarksRes.ok) setBookmarkCount((await bookmarksRes.json()).length);
        } catch (error) {
          console.error("Failed to fetch user stats:", error);
        }
      };
      fetchData();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout", "Are you sure you want to log out?",
      [{ text: "Cancel", style: "cancel" }, {
        text: "Log Out", style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('access_token');
            fetchUserProfile();
            router.replace('/auth/sign-in');
          } catch (error) {
            Alert.alert("Error", "An unexpected error occurred during logout.");
          }
        }
      }]
    );
  };

  if (isLoading) {
    return <SafeAreaView style={styles.loadingContainer}><ActivityIndicator size="large" color="#6366F1" /></SafeAreaView>;
  }

  if (!profile) {
    return <SafeAreaView style={styles.safeContainer}><LoginRequiredView onLoginPress={() => router.replace('/auth/sign-in')} /></SafeAreaView>;
  }
  
  const profileImageUri = createFullImageUrl(profile.imageUri);
  const backgroundImageUri = createFullImageUrl(profile.backgroundUri);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <ImageBackground
            source={backgroundImageUri ? { uri: backgroundImageUri } : require('../../../assets/images/profile-bg.jpg')}
            style={styles.headerBackground}
          />
        </View>

        <View style={styles.profileDetailsContainer}>
          <Image
            source={profileImageUri ? { uri: profileImageUri } : require('../../../assets/images/defaultprofile.png')}
            style={styles.avatar}
          />
          <Text style={styles.name}>{profile.fullName}</Text>
          <Text style={styles.emailText}>{profile.email}</Text>
          <Text style={styles.aboutText}>{profile.aboutMe || 'A passionate traveler exploring the world.'}</Text>
        </View>

        <View style={styles.statsContainer}>
            <StatItem value={itineraryCount} label="Trips" />
            <StatItem value={bookmarkCount} label="Bookmarks" />

        </View>

        <View style={styles.menuContainer}>
            <MenuButton icon="edit" label="Edit Profile" onPress={() => router.push('/dashboard/profile/editprofile/editprofile')} />
            <MenuButton icon="luggage" label="My Trips" onPress={() => router.push('/dashboard/itinerary/calendar')} />
            <MenuButton icon="bookmarks" label="Bookmarks" onPress={() => router.push('/dashboard/bookmark/bookmarks')} />
            <MenuButton icon="settings" label="Settings" onPress={() => router.push('/dashboard/profile/setting/setting')} />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={22} color="#EF4444" />
            <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeContainer: { flex: 1, backgroundColor: '#f9fafb' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
    headerContainer: { height: 200 },
    headerBackground: { width: '100%', height: 200 },
    profileDetailsContainer: { alignItems: 'center', marginTop: -75, paddingHorizontal: 20 },
    avatar: { width: 150, height: 150, borderRadius: 75, borderWidth: 5, borderColor: '#fff', backgroundColor: '#e5e7eb' },
    name: { fontSize: 26, fontWeight: 'bold', color: '#1f2937', marginTop: 15 },
    emailText: { fontSize: 16, color: '#6b7280', marginTop: 4 },
    aboutText: { fontSize: 14, color: '#4b5563', textAlign: 'center', marginTop: 12, paddingHorizontal: 20, lineHeight: 20 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 15 },
    tag: { backgroundColor: '#eef2ff', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, margin: 4 },
    tagText: { color: '#4338ca', fontWeight: '500', fontSize: 12 },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '90%', alignSelf: 'center', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 20, marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 5 },
    statItem: { alignItems: 'center', width: '33%' },
    statNumber: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
    statLabel: { fontSize: 14, color: '#6b7280', marginTop: 4 },
    menuContainer: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', width: '90%', alignSelf: 'center', marginTop: 25 },
    menuButton: { alignItems: 'center', width: '25%', marginBottom: 25 },
    iconBg: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    menuLabel: { fontSize: 12, color: '#4b5563', fontWeight: '500', textAlign: 'center' },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', borderRadius: 12, padding: 15, width: '90%', alignSelf: 'center', marginTop: 10, marginBottom: 40 },
    logoutButtonText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#f9fafb' },
    messageTitle: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 12 },
    messageText: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
    loginButton: { backgroundColor: '#6366F1', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 30 },
    loginButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});