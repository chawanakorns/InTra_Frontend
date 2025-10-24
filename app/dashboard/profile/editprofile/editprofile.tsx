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
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View
} from "react-native";
import { useTheme } from "../../../../context/ThemeContext";
import { useUserProfile } from "../../../../context/UserProfileContext";
import { API_URL } from "../../../config";

const responsiveFontSize = (fontSize: number, fontScale: number) => fontSize / fontScale;

const createFullImageUrl = (path?: string) => {
  if (!path || path.startsWith('http')) return path || '';
  return `${API_URL}${path}`;
};

const getErrorMessage = (data: any, defaultMessage: string): string => {
  if (!data?.detail) return defaultMessage;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
  return defaultMessage;
};

const IconTextInput = ({ iconName, value, placeholder, onChangeText, multiline = false, editable = true, fontScale }: any) => {
    const { colors } = useTheme();
    return (
        <View style={[styles.inputContainer, { backgroundColor: colors.secondary, borderColor: colors.cardBorder }, !editable && styles.disabledInput]}>
            <MaterialIcons name={iconName} size={responsiveFontSize(20, fontScale)} color={colors.icon} style={styles.inputIcon} />
            <TextInput
                style={[styles.textInput, { fontSize: responsiveFontSize(16, fontScale), color: colors.text }]}
                value={value}
                placeholder={placeholder}
                onChangeText={onChangeText}
                placeholderTextColor={colors.icon}
                multiline={multiline}
                editable={editable}
            />
        </View>
    );
};

const SkeletonLoader = () => {
    const { colors } = useTheme();
    return (
        <SafeAreaView style={[styles.skeletonContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.skeletonHeader, { backgroundColor: colors.secondary }]} />
            <View style={[styles.skeletonProfileImage, { backgroundColor: colors.cardBorder, borderColor: colors.background }]} />
            <View style={styles.skeletonForm}>
                <View style={[styles.skeletonTitle, { backgroundColor: colors.secondary }]} />
                <View style={[styles.skeletonInput, { backgroundColor: colors.secondary }]} />
                <View style={[styles.skeletonInput, { height: 80, backgroundColor: colors.secondary }]} />
                <View style={[styles.skeletonInput, { backgroundColor: colors.secondary }]} />
                <View style={[styles.skeletonInput, { backgroundColor: colors.secondary }]} />
            </View>
        </SafeAreaView>
    );
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, fetchUserProfile } = useUserProfile();
  const { colors } = useTheme();
  const { width, height, fontScale } = useWindowDimensions();
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
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
      setIsLoadingProfile(false);
    } else {
      setIsLoadingProfile(true);
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
      const token = await AsyncStorage.getItem("firebase_id_token");
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
      console.error("Image upload error:", error);
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
    Keyboard.dismiss(); 
    try {
      const token = await AsyncStorage.getItem("firebase_id_token");
      if (!token) throw new Error("No access token found");
      
      const formattedDob = dob ? dob.toISOString().split('T')[0] : null;
      const payload = { fullName, aboutMe, dob: formattedDob };

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
      console.error("Profile save error:", error);
      Alert.alert("Error", "An error occurred while updating profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPreferences = async () => {
      Keyboard.dismiss();
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
                          await AsyncStorage.setItem('tourist_type', JSON.stringify(profile.tourist_type || []));
                          await AsyncStorage.setItem('preferred_activities', JSON.stringify(profile.preferred_activities || []));
                          await AsyncStorage.setItem('preferred_cuisines', JSON.stringify(profile.preferred_cuisines || []));
                          await AsyncStorage.setItem('preferred_dining', JSON.stringify(profile.preferred_dining || []));
                          await AsyncStorage.setItem('preferred_times', JSON.stringify(profile.preferred_times || []));
                          router.push({
                              pathname: '/auth/personalize/personalization',
                              params: { editMode: 'true' }
                          } as any);
                      } catch (error) {
                          console.error("Failed to set preferences in storage:", error);
                          Alert.alert("Error", "Could not prepare the preference editor.");
                      }
                  }
              }
          ]
      );
  };

  const headerHeight = height * 0.22;
  const profileImageSize = width * 0.3;

  if (isLoadingProfile) {
    return <SkeletonLoader />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={{width: '100%'}}>
                    <ImageBackground 
                        source={backgroundUri ? { uri: backgroundUri } : require('../../../../assets/images/profile-bg.jpg')} 
                        style={[styles.backgroundImage, { height: headerHeight, backgroundColor: colors.secondary }]}
                    >
                        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card }]} onPress={() => router.back()}>
                            <MaterialIcons name="arrow-back" size={responsiveFontSize(24, fontScale)} color={colors.text} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.editButtonBackground, { backgroundColor: colors.card }]} onPress={() => pickImage(false)} disabled={isUploading}>
                            {isUploading ? <ActivityIndicator size="small" color={colors.text} /> : <MaterialIcons name="photo-camera" size={responsiveFontSize(20, fontScale)} color={colors.text} />}
                        </TouchableOpacity>
                    </ImageBackground>
                    
                    <View style={styles.profileContainer}>
                        <View style={[styles.profileImageContainer, { width: profileImageSize, height: profileImageSize, marginTop: -(profileImageSize / 2), backgroundColor: colors.secondary, borderColor: colors.background }]}>
                            <Image 
                                source={imageUri ? { uri: imageUri } : require('../../../../assets/images/defaultprofile.png')} 
                                style={styles.profileImage} 
                            />
                            <TouchableOpacity style={[styles.editButtonProfile, { borderColor: colors.background }]} onPress={() => pickImage(true)} disabled={isUploading}>
                                {isUploading ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="edit" size={responsiveFontSize(18, fontScale)} color="#fff" />}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.formContainer}>
                    <Text style={[styles.title, { fontSize: responsiveFontSize(24, fontScale), color: colors.text }]}>Edit Your Profile</Text>
                    
                    <IconTextInput iconName="person-outline" value={fullName} placeholder="Full Name" onChangeText={setFullName} editable={!isSaving} fontScale={fontScale} />
                    <IconTextInput iconName="article" value={aboutMe} placeholder="About Me" onChangeText={setAboutMe} multiline editable={!isSaving} fontScale={fontScale} />
                    
                    <TouchableOpacity onPress={() => !isSaving && setShowDatePicker(true)}>
                        <View pointerEvents="none">
                            <IconTextInput iconName="calendar-today" value={dob ? dob.toLocaleDateString('en-CA') : ''} placeholder="Date of Birth (YYYY-MM-DD)" editable={false} fontScale={fontScale} />
                        </View>
                    </TouchableOpacity>

                    <IconTextInput iconName="mail-outline" value={email} placeholder="Email" editable={false} fontScale={fontScale} />
                    
                    {showDatePicker && (
                        <DateTimePicker value={dob || new Date()} mode="date" display="default" onChange={onChangeDate} maximumDate={new Date()} />
                    )}
                </View>

                <View style={styles.buttonGroup}>
                    <TouchableOpacity style={styles.preferencesButton} onPress={handleEditPreferences}>
                          <MaterialIcons name="tune" size={responsiveFontSize(20, fontScale)} color="#fff" />
                          <Text style={[styles.buttonText, { fontSize: responsiveFontSize(16, fontScale) }]}>Preferences</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.saveButton, isSaving && styles.saveButtonDisabled, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={isSaving}>
                        {isSaving ? <ActivityIndicator color="#fff" /> : 
                        <>
                          <MaterialIcons name="save" size={responsiveFontSize(20, fontScale)} color="#fff" />
                          <Text style={[styles.buttonText, { fontSize: responsiveFontSize(16, fontScale) }]}>Save</Text>
                        </>
                        }
                    </TouchableOpacity>
                </View>
            </View>
          </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1, alignItems: 'center' },
    backgroundImage: { width: '100%' },
    backButton: { position: 'absolute', top: 50, left: 16, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    editButtonBackground: { position: 'absolute', top: 50, right: 16, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    profileContainer: { width: '100%', alignItems: 'center' },
    profileImageContainer: { borderRadius: 999, borderWidth: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5 },
    profileImage: { width: '100%', height: '100%', borderRadius: 999 },
    editButtonProfile: { position: 'absolute', bottom: '2%', right: '2%', backgroundColor: '#6366F1', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
    formContainer: { flex: 1, marginTop: 25, width: '90%' },
    title: { fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 16, paddingHorizontal: 15, borderWidth: 1 },
    inputIcon: { marginRight: 10 },
    textInput: { flex: 1, paddingVertical: 15 },
    disabledInput: { opacity: 0.7 },
    buttonGroup: { flexDirection: 'row', width: '90%', paddingBottom: 20 },
    preferencesButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: "#2563EB", paddingVertical: 18, borderRadius: 12, flex: 1, marginRight: 10 },
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 12, flex: 1 },
    buttonText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
    saveButtonDisabled: { opacity: 0.5 },
    skeletonContainer: { flex: 1, alignItems: 'center' },
    skeletonHeader: { width: '100%', height: '22%' },
    skeletonProfileImage: { width: 120, height: 120, borderRadius: 60, marginTop: -60, borderWidth: 4 },
    skeletonForm: { width: '90%', flex: 1, marginTop: 25 },
    skeletonTitle: { width: '60%', height: 30, borderRadius: 8, alignSelf: 'center', marginBottom: 30 },
    skeletonInput: { width: '100%', height: 50, borderRadius: 12, marginBottom: 16 },
});