import React, { createContext, useContext, useState } from "react";

type ProfileType = {
  aboutMe: string;
  fullName: string;
  dob: string;
  gender: string;
  email: string;
  imageUri?: string; // ✅ Optional image URI
};

const defaultProfile: ProfileType = {
  aboutMe: "My name is John Doe...",
  fullName: "John Doe",
  dob: "1/1/1987",
  gender: "Male",
  email: "johndoe@gmail.com",
  imageUri: "", // ✅ Default to empty string
};

const UserProfileContext = createContext<{
  profile: ProfileType;
  updateProfile: (newProfile: Partial<ProfileType>) => void;
}>({
  profile: defaultProfile,
  updateProfile: () => {},
});

export const UserProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<ProfileType>(defaultProfile);

  const updateProfile = (newProfile: Partial<ProfileType>) => {
    setProfile((prev) => ({ ...prev, ...newProfile }));
  };

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => useContext(UserProfileContext);
