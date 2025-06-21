import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import React, { createContext, ReactNode, useContext, useState } from 'react';

const API_URL = 'http://10.0.2.2:8000'; // For Android emulator. Use http://localhost:8000 for iOS.

export interface Profile {
  id: number;
  fullName: string;
  email: string;
  aboutMe: string;
  dob: string;
  gender: string;
  imageUri: string;
  backgroundUri: string;
}

interface UserProfileContextType {
  profile: Profile | null;
  isLoading: boolean;
  fetchUserProfile: () => Promise<void>;
  updateProfile: (updatedData: Partial<Profile>) => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      // --- FIX: Using "access_token" to match your sign-in page ---
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile from the server.');
      }

      const data = await response.json();
      
      setProfile({
        id: data.id,
        fullName: data.full_name || '',
        email: data.email || '',
        aboutMe: data.about_me || '',
        dob: data.date_of_birth ? format(new Date(data.date_of_birth), 'dd/MM/yyyy') : '',
        gender: data.gender || '',
        imageUri: data.image_uri || '',
        backgroundUri: data.background_uri || '',
      });

    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null); 
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updatedData: Partial<Profile>) => {
    if (!profile) return;

    const payload = {
        fullName: updatedData.fullName,
        aboutMe: updatedData.aboutMe,
        dob: updatedData.dob,
        gender: updatedData.gender,
        imageUri: updatedData.imageUri,
        backgroundUri: updatedData.backgroundUri,
    };

    try {
        // --- FIX: Using "access_token" to match your sign-in page ---
        const token = await AsyncStorage.getItem("access_token");
        if (!token) throw new Error("Authentication token not found.");

        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to update profile.');
        }
        
        const returnedData = await response.json();
        
        setProfile({
          id: returnedData.id,
          fullName: returnedData.full_name || '',
          email: returnedData.email || '',
          aboutMe: returnedData.about_me || '',
          dob: returnedData.date_of_birth ? format(new Date(returnedData.date_of_birth), 'dd/MM/yyyy') : '',
          gender: returnedData.gender || '',
          imageUri: returnedData.image_uri || '',
          backgroundUri: returnedData.background_uri || '',
        });
        
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
  };

  const value = { profile, isLoading, fetchUserProfile, updateProfile };

  return (
    <UserProfileContext.Provider value={value}>
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