import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { API_URL } from '../app/config'; // <-- THE FIX: Use the centralized Ngrok URL

// Interface for the user profile data used in the frontend
interface UserProfile {
    allowRealTimeTips(allowRealTimeTips: any): unknown;
    allowOpportunityAlerts(allowOpportunityAlerts: any): unknown;
    allowSmartAlerts(allowSmartAlerts: any): unknown;
    fullName: string;
    email: string;
    aboutMe?: string;
    dob?: string;
    imageUri?: string;
    backgroundUri?: string;
    tourist_type?: string[];
    preferred_activities?: string[];
    preferred_cuisines?: string[];
    preferred_dining?: string[];
    preferred_times?: string[];
}

// Interface for the context value
interface UserContextType {
    profile: UserProfile | null;
    isLoading: boolean;
    fetchUserProfile: () => Promise<void>;
}

// Create the context
const UserProfileContext = createContext<UserContextType | undefined>(undefined);

// Define the provider component
export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUserProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('firebase_id_token');
            if (!token) {
                setProfile(null); // No token, no user
                return;
            }

            // --- THIS IS THE CRITICAL FIX ---
            // Use the correct, public API_URL to fetch the user's profile
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Unauthorized or expired token
                    await AsyncStorage.removeItem('firebase_id_token');
                }
                throw new Error('Failed to fetch user profile');
            }

            const data = await response.json();

            // Map backend snake_case fields to frontend camelCase fields
            setProfile({
                fullName: data.full_name,
                email: data.email,
                aboutMe: data.about_me,
                dob: data.date_of_birth,
                imageUri: data.image_uri,
                backgroundUri: data.background_uri,
                tourist_type: data.tourist_type,
                preferred_activities: data.preferred_activities,
                preferred_cuisines: data.preferred_cuisines,
                preferred_dining: data.preferred_dining,
                preferred_times: data.preferred_times,
            });

        } catch (error) {
            console.error('Error fetching user profile:', error);
            setProfile(null); // Clear profile on error
        } finally {
            setIsLoading(false);
        }
    }, []);

    return (
        <UserProfileContext.Provider value={{ profile, isLoading, fetchUserProfile }}>
            {children}
        </UserProfileContext.Provider>
    );
};

// Custom hook to easily access the context
export const useUserProfile = () => {
    const context = useContext(UserProfileContext);
    if (context === undefined) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
};