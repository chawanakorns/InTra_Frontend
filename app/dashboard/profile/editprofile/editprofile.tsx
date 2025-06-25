// app/dashboard/profile/editprofile/editprofile.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ImagePickerAsset, launchImageLibraryAsync, MediaTypeOptions } from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useUserProfile } from "../../../../context/UserProfileContext";
import { API_URL } from "../../../config";

const createFullImageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_URL}${path}`;
};

const getErrorMessage = (data: any, defaultMessage: string): string => {
    if (!data?.detail) {
        return defaultMessage;
    }
    if (typeof data.detail === 'string') {
        return data.detail;
    }
    if (Array.isArray(data.detail) && data.detail[0]?.msg) {
        return data.detail[0].msg;
    }
    return defaultMessage;
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, fetchUserProfile } = useUserProfile();

  const [fullName, setFullName] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [dob, setDob] = useState('');
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
      setDob(profile.dob ? new Date(profile.dob).toLocaleDateString('en-GB') : '');
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

    const result = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

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
      formData.append("file", {
        uri: asset.uri,
        name: asset.fileName || `image-${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      } as any);

      const endpoint = isProfileImage ? "profile/upload" : "background/upload";
      
      const response = await fetch(`${API_URL}/api/images/${endpoint}`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        const newImageUrl = createFullImageUrl(isProfileImage ? data.image_uri : data.background_uri);
        isProfileImage ? setImageUri(newImageUrl) : setBackgroundUri(newImageUrl);
        Alert.alert("Success", "Image uploaded successfully!");
      } else {
        console.error("Image upload failed with status:", response.status, "and data:", JSON.stringify(data));
        const errorMessage = getErrorMessage(data, `Failed to upload image. (Status: ${response.status})`);
        Alert.alert("Error", errorMessage);
      }
    } catch (error) {
      console.error("Upload function caught an error:", error);
      Alert.alert("Error", "An unrecoverable error occurred while uploading the image.");
    } finally {
      setIsLoading(false);
    }
  };

  const onChangeDate = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString("en-GB");
      setDob(formattedDate);
    }
  };

  const handleSave = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");

      const relativeImageUri = imageUri.startsWith(API_URL) ? imageUri.replace(API_URL, '') : imageUri;
      const relativeBackgroundUri = backgroundUri.startsWith(API_URL) ? backgroundUri.replace(API_URL, '') : backgroundUri;
      const formattedDob = dob ? new Date(dob.split('/').reverse().join('-')).toISOString().split('T')[0] : null;

      const response = await fetch(`${API_URL}/auth/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          aboutMe,
          dob: formattedDob,
          gender,
          imageUri: relativeImageUri,
          backgroundUri: relativeBackgroundUri,
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully!");
        await fetchUserProfile();
        router.back();
      } else {
        const data = await response.json();
        const errorMessage = getErrorMessage(data, "Failed to update profile.");
        Alert.alert("Error", errorMessage);
      }
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "An error occurred while updating profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <TouchableOpacity onPress={() => pickImage(true)} disabled={isLoading}>
        <Text style={[styles.selectImageText, isLoading && styles.disabledText]}>Select Profile Image</Text>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.previewImage} /> : null}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => pickImage(false)} disabled={isLoading}>
        <Text style={[styles.selectImageText, isLoading && styles.disabledText]}>Select Background Image</Text>
        {backgroundUri ? <Image source={{ uri: backgroundUri }} style={styles.previewImage} /> : null}
      </TouchableOpacity>

      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full Name" editable={!isLoading}/>
      <TextInput style={styles.input} value={aboutMe} onChangeText={setAboutMe} placeholder="About Me" multiline editable={!isLoading}/>

      <TouchableOpacity onPress={() => !isLoading && setShowDatePicker(true)}>
        <View pointerEvents="none">
          <TextInput style={styles.input} value={dob} placeholder="Date of Birth (DD/MM/YYYY)" editable={false}/>
        </View>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dob ? new Date(dob.split("/").reverse().join("-")) : new Date()}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      <TextInput style={styles.input} value={gender} onChangeText={setGender} placeholder="Gender" editable={!isLoading}/>
      <TextInput style={[styles.input, { backgroundColor: "#e5e7eb" }]} value={email} placeholder="Email" editable={false}/>

      <TouchableOpacity style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} onPress={handleSave} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 24, 
    paddingBottom: 60,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 24, 
    textAlign: 'center',
  },
  input: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 16, 
    backgroundColor: "#fff", 
    fontSize: 16,
  },
  selectImageText: { 
    color: "#6366F1", 
    fontWeight: "600", 
    marginBottom: 10, 
    fontSize: 16,
  },
  previewImage: { 
    width: 100, 
    height: 100, 
    borderRadius: 50,
    marginBottom: 20, 
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  saveButton: { 
    backgroundColor: "#6366F1", 
    padding: 15, 
    borderRadius: 10, 
    alignItems: "center", 
    marginTop: 10, 
  },
  saveButtonText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16,
  },
  saveButtonDisabled: {
    backgroundColor: "#A5B4FC",
  },
  disabledText: {
    color: "#9ca3af",
  }
});