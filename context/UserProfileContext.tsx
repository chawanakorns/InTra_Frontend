import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState } from 'react';
import { Platform } from 'react-native';

const BACKEND_AUTH_API_URL = Platform.select({
  android: "http://10.0.2.2:8000/auth",
  ios: "http://localhost:8000/auth",
  default: "http://localhost:8000/auth",
});

interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  dob?: string;
  gender?: string;
  aboutMe?: string;
  imageUri?: string;
  backgroundUri?: string;
}

interface UserProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  fetchUserProfile: () => Promise<void>;
  clearUserProfile: () => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      // First, check if a token exists.
      const token = await AsyncStorage.getItem('access_token');
      
      // If no token, the user is a guest. Set profile to null and stop.
      if (!token) {
        setProfile(null);
        setIsLoading(false);
        return; 
      }

      const response = await fetch(`${BACKEND_AUTH_API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Map the backend response to the frontend UserProfile interface
        setProfile({
          id: data.id,
          fullName: data.full_name,
          email: data.email,
          dob: data.date_of_birth,
          gender: data.gender,
          aboutMe: data.about_me,
          imageUri: data.image_uri,
          backgroundUri: data.background_uri,
        });
      } else {
        // Handle cases like an expired token
        setProfile(null);
        if (response.status === 401) {
            await AsyncStorage.removeItem('access_token');
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearUserProfile = () => {
    setProfile(null);
  };

  return (
    <UserProfileContext.Provider value={{ profile, isLoading, fetchUserProfile, clearUserProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

export default UserProfileProvider;