import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { API_URL } from '../app/config'; // <-- THE FIX: Use the centralized Ngrok URL
import { AuthContext } from './AuthContext';

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

    // Get auth context so we can use a fresh token instead of relying on AsyncStorage
    const auth = useContext(AuthContext);

    const fetchUserProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            // Prefer token from AuthContext; if not present, try to request one from the current user
            let token: string | null = null;
            if (auth && auth.token) token = auth.token;
            else if (auth && auth.user) {
                try {
                    token = await auth.user.getIdToken();
                } catch (err) {
                    console.warn('Failed to get token from current user', err);
                }
            }

            if (!token) {
                setProfile(null); // No token, no user
                return;
            }

            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Let AuthProvider handle sign-out/refresh. Log and clear profile locally.
                    console.warn('Unauthorized when fetching profile; token may be expired');
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
            } as any);

        } catch (error) {
            console.error('Error fetching user profile:', error);
            setProfile(null); // Clear profile on error
        } finally {
            setIsLoading(false);
        }
    }, [auth]);

    // Auto-fetch profile when auth token becomes available from AuthContext
    useEffect(() => {
        // only try to fetch when auth initialization finished
        if (auth && auth.initializing === false) {
            fetchUserProfile();
        }
    }, [auth, fetchUserProfile]);

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