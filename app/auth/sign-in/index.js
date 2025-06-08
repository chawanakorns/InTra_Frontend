import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRouter } from "expo-router";
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

export default function SignIn() {
  const navigation = useNavigation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    if (!password) {
      Alert.alert("Error", "Please enter your password");
      return false;
    }

    return true;
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const API_BASE_URL = "http://10.0.2.2:8000"; // Same as your sign-up endpoint

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: email.trim().toLowerCase(),
          password: password,
        }).toString(),
      });

      const data = await response.json();

      if (response.ok) {
        // Successfully logged in
        // Store the access token securely (you might want to use SecureStore or similar)
        // For now, we'll just navigate to the next screen
        router.replace("auth/personalize/kindOfusers");
      } else {
        // Handle specific error messages from your FastAPI backend
        let errorMessage = "Login failed";
        if (data.detail) {
          if (typeof data.detail === "string") {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            // Handle validation errors from FastAPI
            errorMessage = data.detail.map((err) => err.msg).join(", ");
          }
        }
        Alert.alert("Error", errorMessage);
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Error",
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={{
        padding: 25,
        paddingTop: 50,
        backgroundColor: Colors.BLUE,
        height: "100%",
      }}
    >
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      <Text
        style={{
          fontFamily: "outfit-bold",
          color: Colors.WHITE,
          fontSize: 30,
          marginTop: 30,
        }}
      >
        Let&apos;s Sign You In
      </Text>

      <Text
        style={{
          fontFamily: "outfit",
          fontSize: 24,
          color: Colors.GRAY,
          marginTop: 20,
        }}
      >
        Welcome Back
      </Text>

      <Text
        style={{
          fontFamily: "outfit",
          fontSize: 24,
          color: Colors.GRAY,
          marginTop: 5,
        }}
      >
        You&apos;ve been missed...
      </Text>

      <View
        style={{
          marginTop: 50,
        }}
      >
        <Text
          style={{
            fontFamily: "outfit",
            fontSize: 16,
            color: Colors.WHITE,
            marginBottom: 10,
          }}
        >
          Email
        </Text>
        <TextInput
          style={style.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View
        style={{
          marginTop: 20,
        }}
      >
        <Text
          style={{
            fontFamily: "outfit",
            fontSize: 16,
            color: Colors.WHITE,
            marginBottom: 10,
          }}
        >
          Password
        </Text>
        <TextInput
          secureTextEntry={true}
          style={style.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter Password"
        />
      </View>

      {/*Sign in Button */}
      <TouchableOpacity
        onPress={handleSignIn}
        disabled={isLoading}
        style={{
          padding: 15,
          borderRadius: 15,
          marginTop: 40,
          borderWidth: 1,
          backgroundColor: isLoading ? Colors.GRAY : Colors.PRIMARY,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={Colors.WHITE}
            style={{ marginRight: 10 }}
          />
        )}
        <Text
          style={{
            fontFamily: "outfit",
            fontSize: 16,
            color: Colors.WHITE,
            textAlign: "center",
          }}
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </Text>
      </TouchableOpacity>

      {/*Create Account Button */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 20,
        }}
      >
        <Text
          style={{ fontFamily: "outfit", fontSize: 16, color: Colors.WHITE }}
        >
          Don&apos;t have an account?{" "}
        </Text>
        <TouchableOpacity onPress={() => router.replace("auth/sign-up")}>
          <Text
            style={{
              fontFamily: "outfit-bold",
              fontSize: 16,
              color: Colors.WHITE,
            }}
          >
            Register
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const style = StyleSheet.create({
  input: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 15,
    borderColor: Colors.GRAY,
    backgroundColor: Colors.WHITE,
  },
});