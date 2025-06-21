import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { useUserProfile } from "./../../../context/UserProfileContext";

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useUserProfile();

  const [fullName, setFullName] = useState(profile.fullName);
  const [aboutMe, setAboutMe] = useState(profile.aboutMe);
  const [dob, setDob] = useState(profile.dob);
  const [gender, setGender] = useState(profile.gender);
  const [email, setEmail] = useState(profile.email);

  const handleSave = () => {
    updateProfile({ fullName, aboutMe, dob, gender, email });
    router.back(); // ✅ Navigate back to ProfileScreen
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

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
      <TextInput
        style={styles.input}
        value={dob}
        onChangeText={setDob}
        placeholder="Date of Birth"
      />
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

      <TouchableOpacity style={styles.saveButton} 
      onPress={() => router.push('/dashboard/profile/profile')}>
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
  },
  saveButton: {
    backgroundColor: "#6366F1",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
