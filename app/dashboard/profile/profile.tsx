import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
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

// A dedicated component for guest users, styled consistently with your other screens.
const LoginRequiredView = ({ onLoginPress }: { onLoginPress: () => void }) => (
  <View style={styles.centeredContainer}>
    <MaterialIcons name="person-outline" size={60} color="#9CA3AF" />
    <Text style={styles.messageTitle}>View Your Profile</Text>
    <Text style={styles.messageText}>
      Log in to see your profile details and manage your account settings.
    </Text>
    <TouchableOpacity style={styles.loginButton} onPress={onLoginPress}>
      <Text style={styles.loginButtonText}>Log In or Sign Up</Text>
    </TouchableOpacity>
  </View>
);

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, isLoading, fetchUserProfile } = useUserProfile();

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  // If loading is complete but there's no profile, the user is not logged in.
  if (!profile) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <LoginRequiredView onLoginPress={() => router.replace('/auth/sign-in')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerWrapper}>
          <ImageBackground
            source={
              profile.backgroundUri
                ? { uri: profile.backgroundUri }
                : require('../../../assets/images/profile-bg.jpg')
            }
            style={styles.headerBackground}
            resizeMode="cover"
          >
            <View style={styles.overlay}>
              <Image
                source={
                  profile.imageUri?.trim() !== ''
                    ? { uri: profile.imageUri }
                    : require('../../../assets/images/defaultprofile.png')
                }
                style={styles.avatar}
              />
              <Text style={styles.name}>{profile.fullName}</Text>
              <Text style={styles.subtitle}>
                {profile.aboutMe || 'Hello! This is my profile.'}
              </Text>
            </View>
          </ImageBackground>

          <View style={styles.curvedOverlay} />
        </View>

        <View style={[styles.card, styles.firstCard]}>
          <TouchableOpacity
            style={styles.cardItem}
            onPress={() => router.push('/dashboard/profile/editprofile/editprofile')}
          >
            <MaterialIcons name="person" size={24} color="#6366F1" />
            <Text style={styles.cardText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardItem}
            onPress={() => router.push('/dashboard/profile/setting/setting')}
          >
            <MaterialIcons name="notifications" size={24} color="#6366F1" />
            <Text style={styles.cardText}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardItem}>
            <MaterialIcons name="devices" size={24} color="#6366F1" />
            <Text style={styles.cardText}>Devices</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardItem}>
            <MaterialIcons name="lock" size={24} color="#6366F1" />
            <Text style={styles.cardText}>Passwords</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardItem}>
            <MaterialIcons name="language" size={24} color="#6366F1" />
            <Text style={styles.cardText}>Language</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerWrapper: {
    width: '100%',
    position: 'relative',
    marginBottom: 60,
  },
  headerBackground: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 70,
    paddingHorizontal: 20,
  },
  curvedOverlay: {
    position: 'absolute',
    bottom: -15,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    zIndex: 1,
    marginBottom: -15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'white',
    marginBottom: 10,
    marginTop: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    width: '90%',
    paddingVertical: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  firstCard: {
    marginTop: -25,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomColor: '#f3f4f6',
    borderBottomWidth: 1,
  },
  cardText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#1f2937',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#f9fafb',
  },
  messageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  messageText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});