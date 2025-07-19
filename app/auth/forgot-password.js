import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// --- NEW IMPORTS ---
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../config/firebaseConfig"; // Adjust this path if needed

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendLink = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    setIsLoading(true);
    try {
      // Firebase handles sending the email directly
      await sendPasswordResetEmail(auth, email.trim());
      
      Alert.alert(
        "Check Your Email",
        "A password reset link has been sent to your email address.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Forgot Password error:", error);
      Alert.alert("Error", "Failed to send reset link. Please check the email address and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter the email address associated with your account and we'll send you a link to reset your password.
      </Text>
      <View style={{ marginTop: 50 }}>
        <Text style={styles.labelText}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" />
      </View>
      <TouchableOpacity onPress={handleSendLink} disabled={isLoading} style={[styles.button, isLoading && styles.disabledButton]}>
        {isLoading && <ActivityIndicator size="small" color={Colors.WHITE} style={{ marginRight: 10 }} />}
        <Text style={styles.buttonText}>{isLoading ? "Sending..." : "Send Reset Link"}</Text>
      </TouchableOpacity>
    </View>
  );
}
// Styles are unchanged
const styles = StyleSheet.create({
  container: { padding: 25, paddingTop: 50, backgroundColor: Colors.BLUE, height: "100%" },
  title: { fontFamily: "outfit-bold", color: Colors.WHITE, fontSize: 30, marginTop: 30 },
  subtitle: { fontFamily: "outfit", fontSize: 16, color: Colors.GRAY, marginTop: 20 },
  input: { padding: 15, borderWidth: 1, borderRadius: 15, borderColor: Colors.GRAY, backgroundColor: Colors.WHITE, fontSize: 16, fontFamily: "outfit" },
  labelText: { fontFamily: "outfit", fontSize: 16, color: Colors.WHITE, marginBottom: 10 },
  button: { padding: 15, borderRadius: 15, backgroundColor: Colors.PRIMARY, flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 40 },
  disabledButton: { backgroundColor: Colors.GRAY },
  buttonText: { fontFamily: "outfit-bold", fontSize: 16, color: Colors.WHITE, textAlign: "center" },
});