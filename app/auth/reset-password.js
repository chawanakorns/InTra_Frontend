import { Colors } from "@/constants/Colors";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from '../config'; // <-- THE FIX: Import the centralized URL

export default function ResetPassword() {
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      Alert.alert("Error", "Invalid or missing password reset link.", [
        { text: "Go to Login", onPress: () => router.replace("/auth/sign-in") },
      ]);
    }
  }, [token]);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in both password fields.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { // <-- THE FIX: Use API_URL
        token: token,
        new_password: newPassword,
      });

      Alert.alert(
        "Success",
        "Your password has been reset successfully. Please log in with your new password.",
        [{ text: "OK", onPress: () => router.replace("/auth/sign-in") }]
      );
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail || "An unexpected error occurred. The link may have expired.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set New Password</Text>
      <Text style={styles.subtitle}>
        Please enter and confirm your new password below.
      </Text>

      <View style={{ marginTop: 50 }}>
        <Text style={styles.labelText}>New Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter new password (min. 6 characters)"
        />
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.labelText}>Confirm New Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
        />
      </View>

      <TouchableOpacity
        onPress={handleResetPassword}
        disabled={isLoading || !token}
        style={[styles.button, (isLoading || !token) && styles.disabledButton]}
      >
        {isLoading && (
          <ActivityIndicator size="small" color={Colors.WHITE} style={{ marginRight: 10 }} />
        )}
        <Text style={styles.buttonText}>
          {isLoading ? "Resetting..." : "Reset Password"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    paddingTop: 80,
    backgroundColor: Colors.BLUE,
    height: "100%",
  },
  title: {
    fontFamily: "outfit-bold",
    color: Colors.WHITE,
    fontSize: 30,
  },
  subtitle: {
    fontFamily: "outfit",
    fontSize: 16,
    color: Colors.GRAY,
    marginTop: 20,
  },
  input: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 15,
    borderColor: Colors.GRAY,
    backgroundColor: Colors.WHITE,
    fontSize: 16,
    fontFamily: "outfit",
  },
  labelText: {
    fontFamily: "outfit",
    fontSize: 16,
    color: Colors.WHITE,
    marginBottom: 10,
  },
  button: {
    padding: 15,
    borderRadius: 15,
    backgroundColor: Colors.PRIMARY,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  disabledButton: {
    backgroundColor: Colors.GRAY,
  },
  buttonText: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: Colors.WHITE,
    textAlign: "center",
  },
});