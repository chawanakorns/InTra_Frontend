import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
// --- NEW IMPORTS ---
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../config/firebaseConfig"; // Adjust this path if needed

const API_BASE_URL = "http://10.0.2.2:8000";

export default function SignIn() {
  const navigation = useNavigation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);
  
  const validateEmail = (emailText) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailText);
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    setIsEmailValid(text.trim().length > 0 ? validateEmail(text.trim()) : true);
  };

  const validateForm = () => {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return false;
    }
    if (!validateEmail(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Step 1: Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Step 2: Get the Firebase ID token
      const token = await user.getIdToken();
      await AsyncStorage.setItem("firebase_id_token", token);

      // Step 3: Sync user with your backend to create/get profile
      const syncResponse = await axios.post(
        `${API_BASE_URL}/auth/sync`,
        {}, // Empty body, token is in the header
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Step 4: Navigate based on personalization status from your backend
      if (syncResponse.data.has_completed_personalization) {
        router.replace("dashboard");
      } else {
        router.replace("auth/personalize/kindOfusers");
      }
    } catch (error) {
      console.error("Sign-In Error:", error);
      const errorCode = error.code;
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password.";
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      }
      Alert.alert("Sign In Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    await AsyncStorage.removeItem("firebase_id_token");
    router.replace("dashboard");
  };

  return (
    <View style={style.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Text style={style.title}>Let's Sign You In</Text>
      <Text style={style.subtitle}>Welcome Back</Text>
      <Text style={[style.subtitle, { marginTop: 5 }]}>You've been missed...</Text>
      <View style={{ marginTop: 50 }}>
        <Text style={style.labelText}>Email</Text>
        <TextInput
          style={[style.input, !isEmailValid && style.inputError]}
          value={email}
          onChangeText={handleEmailChange}
          placeholder="Enter Email (e.g., test@email.com)"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {!isEmailValid && <Text style={style.errorText}>Please enter a valid email address</Text>}
      </View>
      <View style={{ marginTop: 20 }}>
        <Text style={style.labelText}>Password</Text>
        <TextInput secureTextEntry={true} style={style.input} value={password} onChangeText={setPassword} placeholder="Enter Password" />
        <TouchableOpacity style={{ alignItems: "flex-end", marginTop: 10 }} onPress={() => router.push("/auth/forgot-password")}>
          <Text style={style.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleSignIn} disabled={isLoading} style={[style.button, style.primaryButton, isLoading && style.disabledButton]}>
        {isLoading && <ActivityIndicator size="small" color={Colors.WHITE} style={{ marginRight: 10 }} />}
        <Text style={style.buttonText}>{isLoading ? "Signing In..." : "Sign In"}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleGuestSignIn} style={[style.button, style.secondaryButton]}>
        <Text style={[style.buttonText, style.secondaryButtonText]}>Continue as Guest</Text>
      </TouchableOpacity>
      <View style={style.footer}>
        <Text style={style.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.replace("auth/sign-up")}>
          <Text style={style.footerLink}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
// Styles (style) are unchanged
const style = StyleSheet.create({
  container: { padding: 25, paddingTop: 50, backgroundColor: Colors.BLUE, height: "100%" },
  title: { fontFamily: "outfit-bold", color: Colors.WHITE, fontSize: 30, marginTop: 30 },
  subtitle: { fontFamily: "outfit", fontSize: 24, color: Colors.GRAY, marginTop: 20 },
  input: { padding: 15, borderWidth: 1, borderRadius: 15, borderColor: Colors.GRAY, backgroundColor: Colors.WHITE, fontSize: 16, fontFamily: "outfit" },
  inputError: { borderColor: "#FF0000", borderWidth: 2 },
  errorText: { color: "#FF0000", fontSize: 12, fontFamily: "outfit", marginTop: 5 },
  labelText: { fontFamily: "outfit", fontSize: 16, color: Colors.WHITE, marginBottom: 10 },
  forgotPasswordText: { fontFamily: "outfit", fontSize: 14, color: Colors.WHITE },
  button: { padding: 15, borderRadius: 15, flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
  primaryButton: { backgroundColor: Colors.PRIMARY, borderWidth: 1 },
  secondaryButton: { backgroundColor: Colors.WHITE },
  disabledButton: { backgroundColor: Colors.GRAY },
  buttonText: { fontFamily: "outfit-bold", fontSize: 16, color: Colors.WHITE, textAlign: "center" },
  secondaryButtonText: { color: Colors.PRIMARY },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { fontFamily: "outfit", fontSize: 16, color: Colors.WHITE },
  footerLink: { fontFamily: "outfit-bold", fontSize: 16, color: Colors.WHITE },
});