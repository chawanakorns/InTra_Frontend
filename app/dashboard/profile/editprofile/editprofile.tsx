import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
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

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useUserProfile();

  const [fullName, setFullName] = useState(profile.fullName);
  const [aboutMe, setAboutMe] = useState(profile.aboutMe);
  const [dob, setDob] = useState(profile.dob);
  const [gender, setGender] = useState(profile.gender);
  const [email, setEmail] = useState(profile.email);
  const [imageUri, setImageUri] = useState(profile.imageUri || '');
  const [backgroundUri, setBackgroundUri] = useState(profile.backgroundUri || '');

  const [showDatePicker, setShowDatePicker] = useState(false);

  const pickImage = async (setUri: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setUri(result.assets[0].uri);
    }
  };

  const onChangeDate = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString("en-GB"); // DD/MM/YYYY
      setDob(formattedDate);
    }
  };

  const handleSave = () => {
    updateProfile({ fullName, aboutMe, dob, gender, email, imageUri, backgroundUri });
    router.back(); // ✅ Go back to profile screen
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <TouchableOpacity onPress={() => pickImage(setImageUri)}>
        <Text style={styles.selectImageText}>Select Profile Image</Text>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.previewImage} /> : null}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => pickImage(setBackgroundUri)}>
        <Text style={styles.selectImageText}>Select Background Image</Text>
        {backgroundUri ? <Image source={{ uri: backgroundUri }} style={styles.previewImage} /> : null}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder="Full Name"
      />
      <TextInput
        style={styles.input}
        value={aboutMe}
        onChangeText={setAboutMe}
        placeholder="About Me"
        multiline
      />

      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <View pointerEvents="none">
          <TextInput
            style={styles.input}
            value={dob}
            placeholder="Date of Birth"
            editable={false}
          />
        </View>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      <TextInput
        style={styles.input}
        value={gender}
        onChangeText={setGender}
        placeholder="Gender"
      />
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  selectImageText: {
    color: "#6366F1",
    fontWeight: "600",
    marginBottom: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 20,
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
  },
});
