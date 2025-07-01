import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ImagePickerAsset, launchImageLibraryAsync, MediaTypeOptions } from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
// Make sure this path points to your UserProfileContext file
import { useUserProfile } from "../../../../context/UserProfileContext";
// Make sure this path points to your config file
import { API_URL } from "../../../config";

// Helper function to construct full image URLs
const createFullImageUrl = (path?: string) => {
  if (!path || path.startsWith('http')) return path || '';
  return `${API_URL}${path}`;
};

// Helper function to parse error messages from the backend
const getErrorMessage = (data: any, defaultMessage: string): string => {
  if (!data?.detail) return defaultMessage;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
  return defaultMessage;
};

// Reusable component for text inputs with icons
const IconTextInput = ({ iconName, value, placeholder, onChangeText, multiline = false, editable = true }: any) => (
    <View style={[styles.inputContainer, !editable && styles.disabledInput]}>
        <MaterialIcons name={iconName} size={22} color="#6b7280" style={styles.inputIcon} />
        <TextInput
            style={styles.textInput}
            value={value}
            placeholder={placeholder}
            onChangeText={onChangeText}
            placeholderTextColor="#9ca3af"
            multiline={multiline}
            editable={editable}
        />
    </View>
);

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, fetchUserProfile } = useUserProfile();

  const [fullName, setFullName] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [email, setEmail] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [backgroundUri, setBackgroundUri] = useState('');
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setAboutMe(profile.aboutMe || '');
      setDob(profile.dob ? new Date(profile.dob) : null);
      setEmail(profile.email || '');
      setImageUri(createFullImageUrl(profile.imageUri ?? undefined));
      setBackgroundUri(createFullImageUrl(profile.backgroundUri ?? undefined));
    }
  }, [profile]);

  const pickImage = async (isProfileImage: boolean) => {
    if (isUploading) return;
    const result = await launchImageLibraryAsync({ 
      mediaTypes: MediaTypeOptions.Images, 
      allowsEditing: true, 
      aspect: isProfileImage ? [1, 1] : [16, 9], 
      quality: 0.8 
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadImage(result.assets[0], isProfileImage);
    }
  };

  const uploadImage = async (asset: ImagePickerAsset, isProfileImage: boolean) => {
    setIsUploading(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      
      const formData = new FormData();
      formData.append("file", { uri: asset.uri, name: asset.fileName || `image.jpg`, type: asset.mimeType || "image/jpeg" } as any);
      
      const endpoint = isProfileImage ? "profile/upload" : "background/upload";
      const response = await fetch(`${API_URL}/api/images/${endpoint}`, { 
        method: "POST", 
        body: formData, 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      const data = await response.json();
      if (response.ok) {
        await fetchUserProfile();
        Alert.alert("Success", "Image uploaded successfully!");
      } else {
        Alert.alert("Error", getErrorMessage(data, "Failed to upload image."));
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred while uploading.");
    } finally {
      setIsUploading(false);
    }
  };

  const onChangeDate = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDob(selectedDate);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      
      const formattedDob = dob ? dob.toISOString().split('T')[0] : null;
      const payload = {
          fullName,
          aboutMe,
          dob: formattedDob,
      };

      const response = await fetch(`${API_URL}/auth/me`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchUserProfile();
        Alert.alert("Success", "Profile updated successfully!", [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        const data = await response.json();
        Alert.alert("Error", getErrorMessage(data, "Failed to update profile."));
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while updating profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPreferences = async () => {
      Alert.alert(
          "Update Preferences",
          "You can now edit your travel style. Your current choices will be pre-selected.",
          [
              { text: "Cancel", style: "cancel" },
              {
                  text: "Continue",
                  onPress: async () => {
                      if (!profile) {
                          Alert.alert("Error", "Profile data not loaded. Please try again.");
                          return;
                      }

                      try {
                          // ✅ THIS CODE NOW WORKS because `profile` has the correct type from the updated context
                          await AsyncStorage.setItem('tourist_type', JSON.stringify(profile.tourist_type || []));
                          await AsyncStorage.setItem('preferred_activities', JSON.stringify(profile.preferred_activities || []));
                          await AsyncStorage.setItem('preferred_cuisines', JSON.stringify(profile.preferred_cuisines || []));
                          await AsyncStorage.setItem('preferred_dining', JSON.stringify(profile.preferred_dining || []));
                          await AsyncStorage.setItem('preferred_times', JSON.stringify(profile.preferred_times || []));

                          router.push({
                              pathname: '/auth/personalize/kindOfusers',
                              params: { editMode: 'true' }
                          });
                      } catch (error) {
                          console.error("Failed to set preferences in storage:", error);
                          Alert.alert("Error", "Could not prepare the preference editor.");
                      }
                  }
              }
          ]
      );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
            <ImageBackground 
                source={backgroundUri ? { uri: backgroundUri } : require('../../../../assets/images/profile-bg.jpg')} 
                style={styles.backgroundImage}
            >
                <TouchableOpacity style={styles.editButtonBackground} onPress={() => pickImage(false)} disabled={isUploading}>
                    {isUploading ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="edit" size={20} color="#fff" />}
                </TouchableOpacity>
            </ImageBackground>
            <View style={styles.profileImageContainer}>
                <Image source={imageUri ? { uri: imageUri } : require('../../../../assets/images/defaultprofile.png')} style={styles.profileImage} />
                <TouchableOpacity style={styles.editButtonProfile} onPress={() => pickImage(true)} disabled={isUploading}>
                    {isUploading ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="edit" size={20} color="#fff" />}
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.formContainer}>
            <Text style={styles.title}>Edit Your Profile</Text>
            
            <IconTextInput iconName="person-outline" value={fullName} placeholder="Full Name" onChangeText={setFullName} editable={!isSaving} />
            <IconTextInput iconName="description" value={aboutMe} placeholder="About Me" onChangeText={setAboutMe} multiline editable={!isSaving} />
            
            <TouchableOpacity onPress={() => !isSaving && setShowDatePicker(true)}>
                <View pointerEvents="none">
                     <IconTextInput iconName="calendar-today" value={dob ? dob.toLocaleDateString('en-CA') : ''} placeholder="Date of Birth (YYYY-MM-DD)" editable={false} />
                </View>
            </TouchableOpacity>

            <IconTextInput iconName="mail-outline" value={email} placeholder="Email" editable={false} />
            
            {showDatePicker && (
                <DateTimePicker value={dob || new Date()} mode="date" display="default" onChange={onChangeDate} maximumDate={new Date()} />
            )}
            
            <TouchableOpacity style={styles.preferencesButton} onPress={handleEditPreferences}>
                <MaterialIcons name="tune" size={22} color="#fff" />
                <Text style={styles.preferencesButtonText}>Update Travel Preferences</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Profile Changes</Text>}
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9fafb' },
    container: { paddingBottom: 60, alignItems: 'center' },
    header: { width: '100%', alignItems: 'center', marginBottom: 60 },
    backgroundImage: { width: '100%', height: 180, justifyContent: 'flex-end', alignItems: 'flex-end', backgroundColor: '#e5e7eb' },
    editButtonBackground: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20, margin: 10 },
    profileImageContainer: { position: 'absolute', top: 120 },
    profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#fff', backgroundColor: '#e5e7eb' },
    editButtonProfile: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#6366F1', padding: 8, borderRadius: 20 },
    formContainer: { width: '90%', marginTop: 20 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, color: '#1f2937' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, paddingHorizontal: 15, borderWidth: 1, borderColor: '#e5e7eb' },
    inputIcon: { marginRight: 10 },
    textInput: { flex: 1, paddingVertical: 15, fontSize: 16, color: '#111827' },
    disabledInput: { backgroundColor: "#f3f4f6" },
    preferencesButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: "#2563EB", padding: 18, borderRadius: 12, marginTop: 10 },
    preferencesButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16, marginLeft: 10 },
    saveButton: { backgroundColor: "#6366F1", padding: 18, borderRadius: 12, alignItems: "center", marginTop: 20 },
    saveButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    saveButtonDisabled: { backgroundColor: "#A5B4FC" }
});