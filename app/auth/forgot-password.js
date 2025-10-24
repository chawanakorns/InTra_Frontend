import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { auth } from "../../config/firebaseConfig";

// A simple scaling function for responsive design
const scale = (size, { width, height }) => {
  const guidelineBaseWidth = 375; // Standard width for scaling calculations
  const guidelineBaseHeight = 812; // Standard height for scaling calculations
  const scaleFactor = Math.min(width / guidelineBaseWidth, height / guidelineBaseHeight);
  return size * scaleFactor;
};

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { width, height } = useWindowDimensions();

  // Create a responsive styles object
  const styles = getResponsiveStyles({ width, height });

  const handleSendLink = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    setIsLoading(true);
    try {
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
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={scale(24, { width, height })} color="white" />
      </TouchableOpacity>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter the email address associated with your account and we'll send you a link to reset your password.
      </Text>
      <View style={{ marginTop: scale(50, { width, height }) }}>
        <Text style={styles.labelText}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      <TouchableOpacity onPress={handleSendLink} disabled={isLoading} style={[styles.button, isLoading && styles.disabledButton]}>
        {isLoading && <ActivityIndicator size="small" color={Colors.WHITE} style={{ marginRight: 10 }} />}
        <Text style={styles.buttonText}>{isLoading ? "Sending..." : "Send Reset Link"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const getResponsiveStyles = ({ width, height }) => {
  const scaled = (size) => scale(size, { width, height });

  return StyleSheet.create({
    container: {
      padding: scaled(25),
      paddingTop: Platform.OS === 'android' ? scaled(40) : scaled(50),
      backgroundColor: Colors.BLUE,
      flex: 1, // Use flex: 1 to fill the entire screen
    },
    backButton: {
      marginBottom: scaled(20),
    },
    title: {
      fontFamily: "outfit-bold",
      color: Colors.WHITE,
      fontSize: scaled(30),
      marginTop: scaled(10), // Reduced margin
    },
    subtitle: {
      fontFamily: "outfit",
      fontSize: scaled(16),
      color: Colors.GRAY,
      marginTop: scaled(20),
    },
    input: {
      padding: scaled(15),
      borderWidth: 1,
      borderRadius: scaled(15),
      borderColor: Colors.GRAY,
      backgroundColor: Colors.WHITE,
      fontSize: scaled(16),
      fontFamily: "outfit",
    },
    labelText: {
      fontFamily: "outfit",
      fontSize: scaled(16),
      color: Colors.WHITE,
      marginBottom: scaled(10),
    },
    button: {
      padding: scaled(15),
      borderRadius: scaled(15),
      backgroundColor: Colors.PRIMARY,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: scaled(40),
    },
    disabledButton: {
      backgroundColor: Colors.GRAY,
    },
    buttonText: {
      fontFamily: "outfit-bold",
      fontSize: scaled(16),
      color: Colors.WHITE,
      textAlign: "center",
    },
  });
};