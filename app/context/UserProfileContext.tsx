// app/context/UserProfileContext.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

interface UserProfile {
  fullName: string;
  aboutMe?: string;
  dob?: string;
  gender?: string;
  email: string;
  imageUri?: string;
  backgroundUri?: string;
}

type UserProfileContextType = {
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  fetchUserProfile: () => Promise<void>;
  isLoading: boolean;
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

const createFullImageUrl = (path?: string): string => {
  if (!path || path.startsWith('http')) {
    return path || '';
  }
  return `${API_URL}${path}`;
};

export function UserProfileProvider({ children }: React.PropsWithChildren<{}>) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async () => {
    if (!isLoading) setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setProfile(null);
        return;
      }
      
      // ✅ FIX: Add a unique timestamp as a query parameter to bypass any network caches.
      const cacheBuster = `?_=${new Date().getTime()}`;
      const res = await axios.get<UserProfile>(`${API_URL}/auth/me${cacheBuster}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const rawProfileData = res.data;
      
      const processedProfile = {
        ...rawProfileData,
        imageUri: createFullImageUrl(rawProfileData.imageUri),
        backgroundUri: createFullImageUrl(rawProfileData.backgroundUri),
      };
      
      setProfile(processedProfile);

    } catch (err) {
      console.error("Fetch profile error in context:", err);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  return (
    <UserProfileContext.Provider value={{ profile, setProfile, fetchUserProfile, isLoading }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export const useUserProfile = () => {
  const context = useContext(UserProfileContext); 
  if (context === undefined) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};