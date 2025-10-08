import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ImagePickerAsset, launchImageLibraryAsync, MediaTypeOptions } from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground, // Import KeyboardAvoidingView
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity, // Import Keyboard API for dismissing
  TouchableWithoutFeedback // Import TouchableWithoutFeedback
  ,
  useWindowDimensions,
  View
} from "react-native";
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

const IconTextInput = ({ iconName, value, placeholder, onChangeText, multiline = false, editable = true, fontScale }: any) => (
    <View style={[styles.inputContainer, !editable && styles.disabledInput]}>
        <MaterialIcons name={iconName} size={responsiveFontSize(22, fontScale)} color="#6b7280" style={styles.inputIcon} />
        <TextInput
            style={[styles.textInput, { fontSize: responsiveFontSize(16, fontScale) }]}
            value={value}
            placeholder={placeholder}
            onChangeText={onChangeText}
            placeholderTextColor="#9ca3af"
            multiline={multiline}
            editable={editable}
            // Add important props for keyboard behavior
            returnKeyType={multiline ? "default" : "next"}
            blurOnSubmit={multiline ? false : true}
        />
    </View>
);

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, fetchUserProfile } = useUserProfile();
  const { width, height, fontScale } = useWindowDimensions();

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
    // Dismiss keyboard before saving
    Keyboard.dismiss(); 
    try {
      const token = await AsyncStorage.getItem("firebase_id_token");
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
      console.error("Profile save error:", error);
      Alert.alert("Error", "An error occurred while updating profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPreferences = async () => {
      // Dismiss keyboard before navigating to avoid keyboard issues on the next screen
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

  const headerHeight = height * 0.25;
  const profileImageSize = width * 0.3;
  const profileImageTopOffset = headerHeight - (profileImageSize / 2) - 20;
  const paddingHorizontal = width * 0.05;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Wrap the content that needs to move with KeyboardAvoidingView */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"} // 'padding' for iOS, 'height' for Android
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} // Adjust this value if needed
      >
        <ScrollView 
          contentContainerStyle={styles.container} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" // Important for allowing taps outside text inputs to dismiss keyboard
        >
          {/* TouchableWithoutFeedback to dismiss keyboard when tapping outside inputs */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View> {/* This View is necessary to contain children of TouchableWithoutFeedback */}
              <View style={[styles.header, { height: headerHeight, marginBottom: profileImageSize / 2 + 30 }]}>
                  <ImageBackground 
                      source={backgroundUri ? { uri: backgroundUri } : require('../../../../assets/images/profile-bg.jpg')} 
                      style={styles.backgroundImage}
                  >
                      <TouchableOpacity style={styles.editButtonBackground} onPress={() => pickImage(false)} disabled={isUploading}>
                          {isUploading ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="edit" size={responsiveFontSize(20, fontScale)} color="#fff" />}
                      </TouchableOpacity>
                  </ImageBackground>
                  <View style={[styles.profileImageContainer, { top: profileImageTopOffset }]}>
                      <Image 
                          source={imageUri ? { uri: imageUri } : require('../../../../assets/images/defaultprofile.png')} 
                          style={[styles.profileImage, { width: profileImageSize, height: profileImageSize, borderRadius: profileImageSize / 2 }]} 
                      />
                      <TouchableOpacity style={styles.editButtonProfile} onPress={() => pickImage(true)} disabled={isUploading}>
                          {isUploading ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="edit" size={responsiveFontSize(20, fontScale)} color="#fff" />}
                      </TouchableOpacity>
                  </View>
              </View>

              <View style={[styles.formContainer, { width: width - (paddingHorizontal * 2) }]}>
                  <Text style={[styles.title, { fontSize: responsiveFontSize(24, fontScale) }]}>Edit Your Profile</Text>
                  
                  <IconTextInput iconName="person-outline" value={fullName} placeholder="Full Name" onChangeText={setFullName} editable={!isSaving} fontScale={fontScale} />
                  <IconTextInput iconName="description" value={aboutMe} placeholder="About Me" onChangeText={setAboutMe} multiline editable={!isSaving} fontScale={fontScale} />
                  
                  <TouchableOpacity onPress={() => !isSaving && setShowDatePicker(true)}>
                      <View pointerEvents="none">
                          <IconTextInput iconName="calendar-today" value={dob ? dob.toLocaleDateString('en-CA') : ''} placeholder="Date of Birth (YYYY-MM-DD)" editable={false} fontScale={fontScale} />
                      </View>
                  </TouchableOpacity>

                  <IconTextInput iconName="mail-outline" value={email} placeholder="Email" editable={false} fontScale={fontScale} />
                  
                  {showDatePicker && (
                      <DateTimePicker value={dob || new Date()} mode="date" display="default" onChange={onChangeDate} maximumDate={new Date()} />
                  )}
                  
                  <TouchableOpacity style={styles.preferencesButton} onPress={handleEditPreferences}>
                      <MaterialIcons name="tune" size={responsiveFontSize(22, fontScale)} color="#fff" />
                      <Text style={[styles.preferencesButtonText, { fontSize: responsiveFontSize(16, fontScale) }]}>Update Travel Preferences</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaving}>
                      {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={[styles.saveButtonText, { fontSize: responsiveFontSize(16, fontScale) }]}>Save Profile Changes</Text>}
                  </TouchableOpacity>
              </View>
            </View> {/* End of the View for TouchableWithoutFeedback */}
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9fafb' },
    container: { paddingBottom: 60, alignItems: 'center', flexGrow: 1 }, // Added flexGrow: 1
    header: { width: '100%', alignItems: 'center', backgroundColor: '#e5e7eb' },
    backgroundImage: { width: '100%', height: '100%', justifyContent: 'flex-end', alignItems: 'flex-end' },
    editButtonBackground: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20, margin: 10 },
    profileImageContainer: { position: 'absolute', alignItems: 'center' },
    profileImage: { borderWidth: 4, borderColor: '#fff', backgroundColor: '#e5e7eb' },
    editButtonProfile: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#6366F1', padding: 8, borderRadius: 20 },
    formContainer: { marginTop: 20 },
    title: { fontWeight: 'bold', textAlign: 'center', marginBottom: 24, color: '#1f2937' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, paddingHorizontal: 15, borderWidth: 1, borderColor: '#e5e7eb' },
    inputIcon: { marginRight: 10 },
    textInput: { flex: 1, paddingVertical: 15, color: '#111827' },
    disabledInput: { backgroundColor: "#f3f4f6" },
    preferencesButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: "#2563EB", padding: 18, borderRadius: 12, marginTop: 10 },
    preferencesButtonText: { color: "#fff", fontWeight: "bold", marginLeft: 10 },
    saveButton: { backgroundColor: "#6366F1", padding: 18, borderRadius: 12, alignItems: "center", marginTop: 20 },
    saveButtonText: { color: "#fff", fontWeight: "bold" },
    saveButtonDisabled: { backgroundColor: "#A5B4FC" }
});