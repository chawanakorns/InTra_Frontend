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
import { useTheme } from '../../../context/ThemeContext';
import { useUserProfile } from '../../../context/UserProfileContext';
import { API_URL } from '../../config';

const createFullImageUrl = (path?: string) => {
  if (!path || path.startsWith('http')) return path;
  return `${API_URL}${path}`;
};

const LoginRequiredView = ({ onLoginPress }: { onLoginPress: () => void }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
      <MaterialIcons name="person-off" size={60} color={colors.icon} />
      <Text style={[styles.messageTitle, { color: colors.text }]}>You&apos;re Not Logged In</Text>
      <Text style={[styles.messageText, { color: colors.icon }]}>Log in to view your profile, trips, and bookmarks.</Text>
      <TouchableOpacity style={[styles.loginButton, { backgroundColor: colors.primary }]} onPress={onLoginPress}>
        <Text style={styles.loginButtonText}>Log In or Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

const StatItem = ({ value, label }: { value: string | number, label: string }) => {
    const { colors } = useTheme();
    return (
        <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: colors.icon }]}>{label}</Text>
        </View>
    );
};

const MenuButton = ({ icon, label, onPress, isLast }: { icon: any, label: string, onPress: () => void, isLast?: boolean }) => {
    const { colors } = useTheme();
    return (
        <TouchableOpacity style={[styles.menuButton, isLast && styles.lastMenuButton, { borderBottomColor: colors.secondary }]} onPress={onPress}>
            <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
                <MaterialIcons name={icon} size={24} color={colors.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
            <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
        </TouchableOpacity>
    );
};

const SkeletonLoader = () => {
    const { colors } = useTheme();
    return (
        <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.skeletonHeader, { backgroundColor: colors.secondary }]}>
                <View style={[styles.skeletonAvatar, { backgroundColor: colors.cardBorder, borderColor: colors.background }]} />
                <View style={{ width: '50%', height: 28, backgroundColor: colors.secondary, borderRadius: 8, marginTop: 85 }} />
                <View style={{ width: '70%', height: 20, backgroundColor: colors.secondary, borderRadius: 8, marginTop: 10 }} />
            </View>
            <View style={[styles.skeletonStats, { backgroundColor: colors.card }]} />
            <View style={styles.skeletonMenu}>
                <View style={[styles.skeletonMenuItem, { backgroundColor: colors.card }]} />
                <View style={[styles.skeletonMenuItem, { backgroundColor: colors.card }]} />
                <View style={[styles.skeletonMenuItem, { backgroundColor: colors.card }]} />
            </View>
        </SafeAreaView>
    );
};

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, isLoading, fetchUserProfile } = useUserProfile();
  const { colors } = useTheme();
  
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
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.background }]}>
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
              style={[styles.avatar, { borderColor: colors.background, backgroundColor: colors.secondary }]}
            />
            <Text style={[styles.name, { color: colors.text }]}>{profile.fullName || "User"}</Text>
            <Text style={[styles.emailText, { color: colors.icon }]}>{profile.email}</Text>
          </View>
        </View>

        <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
          <StatItem value={itineraryCount} label="Trips" />
          <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
          <StatItem value={bookmarkCount} label="Bookmarks" />
        </View>

        {profile.aboutMe && (
            <View style={styles.aboutContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>About Me</Text>
                <Text style={[styles.aboutText, { color: colors.icon }]}>{profile.aboutMe}</Text>
            </View>
        )}
        
        <View style={styles.menuContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <MenuButton icon="edit" label="Edit Profile" onPress={() => router.push('/dashboard/profile/editprofile/editprofile')} />
            <MenuButton icon="luggage" label="My Trips" onPress={() => router.push('/dashboard/itinerary/calendar')} />
            <MenuButton icon="bookmarks" label="My Bookmarks" onPress={() => router.push('/dashboard/bookmark/bookmarks')} />
            <MenuButton icon="settings" label="Settings" onPress={() => router.push('/dashboard/profile/setting/setting')} isLast />
          </View>
        </View>
        
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.card }]} onPress={handleLogout}>
          <MaterialIcons name="logout" size={22} color={colors.danger} />
          <Text style={[styles.logoutButtonText, { color: colors.danger }]}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeContainer: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 40 },
    headerContainer: { marginBottom: 130 },
    headerBackground: { width: '100%', height: 220, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    profileDetails: { alignItems: 'center', position: 'absolute', width: '100%', top: 140 },
    avatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 5 },
    name: { fontSize: 26, fontWeight: 'bold', marginTop: 12 },
    emailText: { fontSize: 16, marginTop: 4 },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, borderRadius: 16, paddingVertical: 20, marginTop: 30, shadowColor: "#4A5568", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
    statItem: { alignItems: 'center', flex: 1 },
    statDivider: { width: 1 },
    statNumber: { fontSize: 20, fontWeight: 'bold' },
    statLabel: { fontSize: 14, marginTop: 4 },
    aboutContainer: { marginHorizontal: 20, marginTop: 30 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    aboutText: { fontSize: 15, lineHeight: 22 },
    menuContainer: { marginHorizontal: 20, marginTop: 30 },
    menuGroup: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
    menuButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1 },
    lastMenuButton: { borderBottomWidth: 0 },
    iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    menuLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 15, marginHorizontal: 20, marginTop: 30 },
    logoutButtonText: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    messageTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
    messageText: { fontSize: 16, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
    loginButton: { paddingVertical: 14, paddingHorizontal: 40, borderRadius: 30 },
    loginButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
    skeletonContainer: { flex: 1 },
    skeletonHeader: { height: 220, width: '100%', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center' },
    skeletonAvatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 5, position: 'absolute', top: 150 },
    skeletonStats: { height: 80, width: '90%', borderRadius: 16, alignSelf: 'center', marginTop: 100 },
    skeletonMenu: { marginTop: 30, paddingHorizontal: 20 },
    skeletonMenuItem: { width: '100%', height: 60, borderRadius: 12, marginBottom: 10 },
});