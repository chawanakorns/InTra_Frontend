import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { Platform } from 'react-native';

const BACKEND_AUTH_API_URL = Platform.select({
  android: "http://10.0.2.2:8000/auth",
  ios: "http://localhost:8000/auth",
  default: "http://localhost:8000/auth",
});

// ✅ UPDATED INTERFACE: Added all preference fields
export interface UserProfile {
  id: number;
  fullName: string | null;
  email: string;
  dob: string | null;
  gender: string | null;
  hasCompletedPersonalization: boolean;
  aboutMe: string | null;
  imageUri: string | null;
  backgroundUri: string | null;
  tourist_type: string[] | null;
  preferred_activities: string[] | null;
  preferred_cuisines: string[] | null;
  preferred_dining: string[] | null;
  preferred_times: string[] | null;
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

  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      
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
        
        // ✅ UPDATED MAPPING: Map all fields from the backend, including preferences
        setProfile({
          id: data.id,
          fullName: data.full_name,
          email: data.email,
          dob: data.date_of_birth,
          gender: data.gender,
          aboutMe: data.about_me,
          imageUri: data.image_uri,
          backgroundUri: data.background_uri,
          hasCompletedPersonalization: data.has_completed_personalization,
          tourist_type: data.tourist_type,
          preferred_activities: data.preferred_activities,
          preferred_cuisines: data.preferred_cuisines,
          preferred_dining: data.preferred_dining,
          preferred_times: data.preferred_times,
        });
      } else {
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
  }, []);

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