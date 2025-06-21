import React, { createContext, useContext, useState } from "react";

// Define the shape of the profile object
type ProfileType = {
  aboutMe: string;
  fullName: string;
  dob: string;
  gender: string;
  email: string;
  imageUri?: string;
  backgroundUri?: string;
};

// Default values for the profile
const defaultProfile: ProfileType = {
  aboutMe: "My name is John Doe...",
  fullName: "John Doe",
  dob: "1/1/1987",
  gender: "Male",
  email: "johndoe@gmail.com",
  imageUri: "",
  backgroundUri: "",
};

// Define the shape of the context
const UserProfileContext = createContext<{
  profile: ProfileType;
  updateProfile: (newProfile: Partial<ProfileType>) => void;
}>({
  profile: defaultProfile,
  updateProfile: () => {}, // Default no-op function
});

// Provider component
export const UserProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<ProfileType>(defaultProfile);

  // Method to update any part of the profile
  const updateProfile = (newProfile: Partial<ProfileType>) => {
    setProfile((prev) => ({ ...prev, ...newProfile }));
  };

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

// Hook to use the profile context
export const useUserProfile = () => useContext(UserProfileContext);
