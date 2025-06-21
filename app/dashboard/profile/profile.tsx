import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useUserProfile } from '../../context/UserProfileContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useUserProfile();

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Background with Image and Overlay */}
        <View style={styles.headerWrapper}>
          <ImageBackground
            source={require('../../../assets/images/profile-bg.jpg')}
            style={styles.headerBackground}
            resizeMode="cover"
          >
            <View style={styles.overlay}>
              <Image
                source={{
                  uri:
                    profile.imageUri ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80',
                }}
                style={styles.avatar}
              />
              <Text style={styles.name}>{profile.fullName}</Text>
              <Text style={styles.subtitle}>
                {profile.aboutMe || 'Work hard in silence. Let your success be the noise.'}
              </Text>
            </View>
          </ImageBackground>

          {/* Curved White Overlay */}
          <View style={styles.curvedOverlay} />
        </View>

        {/* First Card: Address & Account */}
        <View style={[styles.card, styles.firstCard]}>
          
          <TouchableOpacity style={styles.cardItem}
           onPress={() => router.push('/dashboard/profile/editprofile/editprofile')}>
            <MaterialIcons name="person" size={24} color="#6366F1" />
            <Text style={styles.cardText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Second Card: Settings Options */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.cardItem}
          onPress={() => router.push('/dashboard/profile/setting/setting')}>
            
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
  scrollContent: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerWrapper: {
    width: '100%',
    position: 'relative',
    marginBottom: 60, // keep original spacing between subtitle and curved overlay
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
    marginBottom: -15, // pulls the curved overlay up to reduce space between it and the header
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
    marginTop: -25, // pulls the first card up to reduce space between it and curved overlay
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
});
