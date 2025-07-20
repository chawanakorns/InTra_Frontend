import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { Platform } from 'react-native';

// Define the API URL for authentication endpoints
const BACKEND_AUTH_API_URL = Platform.select({
  android: "http://10.0.2.2:8000/auth",
  ios: "http://localhost:8000/auth",
  default: "http://localhost:8000/auth",
});

// Define the shape of the user profile data from your backend
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

// Define the shape of the context value that components will consume
interface UserProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  fetchUserProfile: () => Promise<void>;
  clearUserProfile: () => void;
}

// Create the context
const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

// The Provider component that will wrap your entire application
export const UserProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // The core function to fetch user data from the backend
  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('firebase_id_token');
      
      if (!token) {
        // If there's no token, the user is not logged in.
        setProfile(null);
        setIsLoading(false);
        return; 
      }

      // If a token exists, try to fetch the user's profile
      const response = await fetch(`${BACKEND_AUTH_API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Map the backend's snake_case response to our frontend's camelCase interface
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
        // The token was invalid or expired. Clear the profile and the bad token.
        setProfile(null);
        if (response.status === 401) {
            await AsyncStorage.removeItem('firebase_id_token'); // --- THE CRITICAL FIX ---
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // In case of a network error, etc., assume the user is logged out.
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to manually clear the profile, used during logout
  const clearUserProfile = () => {
    setProfile(null);
  };

  return (
    <UserProfileContext.Provider value={{ profile, isLoading, fetchUserProfile, clearUserProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

// The custom hook that screens will use to access the profile data
export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

export default UserProfileProvider;