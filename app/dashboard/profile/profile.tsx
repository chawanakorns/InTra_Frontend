import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../../../config/firebaseConfig';
import { useUserProfile } from '../../../context/UserProfileContext';
import { API_URL } from '../../config';

// --- Components ---
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

const createFullImageUrl = (path?: string) => {
  if (!path || path.startsWith('http')) return path;
  return `${API_URL}${path}`;
};

const StatItem = ({ value, label }: { value: string | number, label: string }) => (
    <View style={styles.statItem}>
        <Text style={styles.statNumber}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const MenuButton = ({ icon, label, onPress, isLast }: { icon: any, label: string, onPress: () => void, isLast?: boolean }) => (
    <TouchableOpacity style={[styles.menuButton, isLast && styles.lastMenuButton]} onPress={onPress}>
        <View style={styles.iconContainer}>
            <MaterialIcons name={icon} size={24} color="#6366F1" />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
        <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
    </TouchableOpacity>
);

const SkeletonLoader = () => (
    <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.skeletonHeader}>
            <View style={styles.skeletonAvatar} />
            <View style={{ width: '50%', height: 28, backgroundColor: '#E5E7EB', borderRadius: 8, marginTop: 15 }} />
            <View style={{ width: '70%', height: 20, backgroundColor: '#E5E7EB', borderRadius: 8, marginTop: 10 }} />
        </View>
        <View style={styles.skeletonStats} />
        <View style={styles.skeletonMenu}>
            <View style={styles.skeletonMenuItem} />
            <View style={styles.skeletonMenuItem} />
            <View style={styles.skeletonMenuItem} />
            <View style={styles.skeletonMenuItem} />
        </View>
    </SafeAreaView>
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
          const token = await AsyncStorage.getItem('firebase_id_token');
          if (!token) {
            setItineraryCount(0);
            setBookmarkCount(0);
            return;
          }
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
    }, [fetchUserProfile])
  );

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout", "Are you sure you want to log out?",
      [{ text: "Cancel", style: "cancel" }, {
        text: "Log Out", style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            await AsyncStorage.removeItem('firebase_id_token');
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
    return <SkeletonLoader />;
  }

  if (!profile) {
    return <SafeAreaView style={styles.safeContainer}><LoginRequiredView onLoginPress={() => router.replace('/auth/sign-in')} /></SafeAreaView>;
  }
  
  const profileImageUri = createFullImageUrl(profile.imageUri);
  const backgroundImageUri = createFullImageUrl(profile.backgroundUri);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <ImageBackground
            source={backgroundImageUri ? { uri: backgroundImageUri } : require('../../../assets/images/profile-bg.jpg')}
            style={styles.headerBackground}
            imageStyle={{ borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
          />
          <View style={styles.profileDetails}>
            <Image
              source={profileImageUri ? { uri: profileImageUri } : require('../../../assets/images/defaultprofile.png')}
              style={styles.avatar}
            />
            <Text style={styles.name}>{profile.fullName || "User"}</Text>
            <Text style={styles.emailText}>{profile.email}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <StatItem value={itineraryCount} label="Trips" />
          <View style={styles.statDivider} />
          <StatItem value={bookmarkCount} label="Bookmarks" />
        </View>

        {profile.aboutMe && (
            <View style={styles.aboutContainer}>
                <Text style={styles.sectionTitle}>About Me</Text>
                <Text style={styles.aboutText}>{profile.aboutMe}</Text>
            </View>
        )}
        
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.menuGroup}>
            <MenuButton icon="edit" label="Edit Profile" onPress={() => router.push('/dashboard/profile/editprofile/editprofile')} />
            <MenuButton icon="luggage" label="My Trips" onPress={() => router.push('/dashboard/itinerary/calendar')} />
            <MenuButton icon="bookmarks" label="My Bookmarks" onPress={() => router.push('/dashboard/bookmark/bookmarks')} />
            <MenuButton icon="settings" label="Settings" onPress={() => router.push('/dashboard/profile/setting/setting')} isLast />
          </View>
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
    safeContainer: { flex: 1, backgroundColor: '#F9FAFB' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
    scrollContent: { paddingBottom: 40 },
    headerContainer: { marginBottom: 130 },
    headerBackground: { 
        width: '100%', 
        height: 220,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    profileDetails: {
        alignItems: 'center',
        position: 'absolute',
        width: '100%',
        top: 140, 
    },
    avatar: { 
        width: 140, 
        height: 140, 
        borderRadius: 70, 
        borderWidth: 5, 
        borderColor: '#F9FAFB',
        backgroundColor: '#E5E7EB',
    },
    name: { fontSize: 26, fontWeight: 'bold', color: '#1F2937', marginTop: 12 },
    emailText: { fontSize: 16, color: '#6B7280', marginTop: 4 },
    statsContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF', 
        borderRadius: 16, 
        paddingVertical: 20,
        // *** FIX IS HERE: Increased marginTop for more space ***
        marginTop: 30, 
        shadowColor: "#4A5568",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5 
    },
    statItem: { alignItems: 'center', flex: 1 },
    statDivider: { width: 1, backgroundColor: '#E5E7EB' },
    statNumber: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
    statLabel: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    aboutContainer: {
        marginHorizontal: 20,
        marginTop: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 10,
    },
    aboutText: { fontSize: 15, color: '#4B5563', lineHeight: 22 },
    menuContainer: { marginHorizontal: 20, marginTop: 30 },
    menuGroup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    menuButton: { 
        flexDirection: 'row', 
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    lastMenuButton: { borderBottomWidth: 0 },
    iconContainer: { 
        width: 40, height: 40, borderRadius: 20, 
        backgroundColor: '#EEF2FF', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 15,
    },
    menuLabel: { flex: 1, fontSize: 16, color: '#374151', fontWeight: '500' },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', borderRadius: 12, padding: 15, marginHorizontal: 20, marginTop: 30 },
    logoutButtonText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#F9FAFB', },
    messageTitle: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 12 },
    messageText: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
    loginButton: { backgroundColor: '#6366F1', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 30 },
    loginButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
    skeletonContainer: { flex: 1, backgroundColor: '#F9FAFB' },
    skeletonHeader: { height: 220, width: '100%', backgroundColor: '#E5E7EB', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center', paddingTop: 140 },
    skeletonAvatar: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#D1D5DB', borderWidth: 5, borderColor: '#F9FAFB', position: 'absolute', top: 150 },
    skeletonStats: { height: 80, width: '90%', backgroundColor: '#E5E7EB', borderRadius: 16, alignSelf: 'center', marginTop: 100 },
    skeletonMenu: { marginTop: 30, paddingHorizontal: 20 },
    skeletonMenuItem: { width: '100%', height: 60, backgroundColor: '#E5E7EB', borderRadius: 12, marginBottom: 10 },
});