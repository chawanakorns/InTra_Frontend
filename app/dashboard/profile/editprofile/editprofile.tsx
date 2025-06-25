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
import { useUserProfile } from "../../../../context/UserProfileContext";
import { API_URL } from "../../../config";

const createFullImageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path}`;
};

const getErrorMessage = (data: any, defaultMessage: string): string => {
  if (!data?.detail) return defaultMessage;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
  return defaultMessage;
};

const IconTextInput = ({ iconName, value, placeholder, onChangeText, multiline = false, editable = true, keyboardType = 'default' }: any) => (
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
            keyboardType={keyboardType}
        />
    </View>
);

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, fetchUserProfile } = useUserProfile();

  const [fullName, setFullName] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [backgroundUri, setBackgroundUri] = useState('');
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setAboutMe(profile.aboutMe || '');
      setDob(profile.dob ? new Date(profile.dob) : null);
      setGender(profile.gender || '');
      setEmail(profile.email || '');
      setImageUri(createFullImageUrl(profile.imageUri));
      setBackgroundUri(createFullImageUrl(profile.backgroundUri));
    } else {
      fetchUserProfile();
    }
  }, [profile]);

  const pickImage = async (isProfileImage: boolean) => {
    if (isLoading) return;
    const result = await launchImageLibraryAsync({ mediaTypes: MediaTypeOptions.Images, allowsEditing: true, quality: 1 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadImage(result.assets[0], isProfileImage);
    }
  };

  const uploadImage = async (asset: ImagePickerAsset, isProfileImage: boolean) => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      const formData = new FormData();
      formData.append("file", { uri: asset.uri, name: asset.fileName || `image.jpg`, type: asset.mimeType || "image/jpeg" } as any);
      const endpoint = isProfileImage ? "profile/upload" : "background/upload";
      const response = await fetch(`${API_URL}/api/images/${endpoint}`, { method: "POST", body: formData, headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok) {
        const newPath = isProfileImage ? data.image_uri : data.background_uri;
        const newImageUrl = createFullImageUrl(newPath);
        isProfileImage ? setImageUri(newImageUrl) : setBackgroundUri(newImageUrl);
        Alert.alert("Success", "Image uploaded successfully!");
      } else {
        Alert.alert("Error", getErrorMessage(data, `Failed to upload image.`));
      }
    } catch (error) {
      Alert.alert("Error", "An unrecoverable error occurred while uploading.");
    } finally {
      setIsLoading(false);
    }
  };

  const onChangeDate = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDob(selectedDate);
  };

  const handleSave = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      const relativeImageUri = imageUri.startsWith(API_URL) ? imageUri.replace(API_URL, '') : imageUri;
      const relativeBackgroundUri = backgroundUri.startsWith(API_URL) ? backgroundUri.replace(API_URL, '') : backgroundUri;
      const formattedDob = dob ? dob.toISOString().split('T')[0] : null;
      const response = await fetch(`${API_URL}/auth/me`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, aboutMe, dob: formattedDob, gender, imageUri: relativeImageUri, backgroundUri: relativeBackgroundUri }),
      });
      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully!");
        await fetchUserProfile();
        router.back();
      } else {
        const data = await response.json();
        Alert.alert("Error", getErrorMessage(data, "Failed to update profile."));
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while updating profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
            <ImageBackground 
                source={backgroundUri ? { uri: backgroundUri } : require('../../../../assets/images/profile-bg.jpg')} 
                style={styles.backgroundImage}
            >
                <TouchableOpacity style={styles.editButtonBackground} onPress={() => pickImage(false)} disabled={isLoading}>
                    <MaterialIcons name="edit" size={20} color="#fff" />
                </TouchableOpacity>
            </ImageBackground>
            <View style={styles.profileImageContainer}>
                <Image source={imageUri ? { uri: imageUri } : require('../../../../assets/images/defaultprofile.png')} style={styles.profileImage} />
                <TouchableOpacity style={styles.editButtonProfile} onPress={() => pickImage(true)} disabled={isLoading}>
                    <MaterialIcons name="edit" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.formContainer}>
            <Text style={styles.title}>Edit Your Profile</Text>
            
            <IconTextInput iconName="person-outline" value={fullName} placeholder="Full Name" onChangeText={setFullName} editable={!isLoading} />
            
            {/* FIX: Replaced "article-outline" with "description" */}
            <IconTextInput iconName="description" value={aboutMe} placeholder="About Me" onChangeText={setAboutMe} multiline editable={!isLoading} />
            
            <TouchableOpacity onPress={() => !isLoading && setShowDatePicker(true)}>
                <View pointerEvents="none">
                     <IconTextInput iconName="calendar-today" value={dob ? dob.toLocaleDateString('en-GB') : ''} placeholder="Date of Birth" editable={false} />
                </View>
            </TouchableOpacity>

            <IconTextInput iconName="wc" value={gender} placeholder="Gender" onChangeText={setGender} editable={!isLoading} />
            <IconTextInput iconName="mail-outline" value={email} placeholder="Email" editable={false} />
            
            {showDatePicker && (
                <DateTimePicker value={dob || new Date()} mode="date" display="default" onChange={onChangeDate} maximumDate={new Date()} />
            )}

            <TouchableOpacity style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} onPress={handleSave} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
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
    backgroundImage: { width: '100%', height: 200, justifyContent: 'flex-end', alignItems: 'flex-end' },
    editButtonBackground: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20, margin: 10 },
    profileImageContainer: { position: 'absolute', top: 140 },
    profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#fff' },
    editButtonProfile: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#6366F1', padding: 8, borderRadius: 20 },
    formContainer: { width: '90%', marginTop: 20 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, color: '#1f2937' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, paddingHorizontal: 15, borderWidth: 1, borderColor: '#e5e7eb' },
    inputIcon: { marginRight: 10 },
    textInput: { flex: 1, paddingVertical: 15, fontSize: 16, color: '#111827' },
    disabledInput: { backgroundColor: "#f3f4f6" },
    saveButton: { backgroundColor: "#6366F1", padding: 18, borderRadius: 12, alignItems: "center", marginTop: 20, shadowColor: "#6366F1", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
    saveButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    saveButtonDisabled: { backgroundColor: "#A5B4FC", shadowOpacity: 0 }
});