import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
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
    // Only validate if there's text and it's not empty
    if (text.trim().length > 0) {
      setIsEmailValid(validateEmail(text.trim()));
    } else {
      setIsEmailValid(true); // Don't show error for empty field
    }
  };

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return false;
    }

    if (!validateEmail(email.trim())) {
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
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const API_BASE_URL = "http://10.0.2.2:8000";
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        {
          username: email.trim().toLowerCase(),
          password,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (response.status === 200) {
        const token = response.data.access_token;
        await AsyncStorage.setItem("access_token", token); // Correct key
        console.log("Token saved:", token);

        const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (userResponse.data.has_completed_personalization) {
          router.replace("dashboard");
        } else {
          router.replace("auth/personalize/kindOfusers");
        }
      }
    } catch (error) {
      console.error(
        "Login error:",
        error.response ? error.response.data : error.message
      );
      Alert.alert(
        "Error",
        "Network error or invalid credentials. Please try again."
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
        Let's Sign You In
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
        You've been missed...
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
          style={[style.input, !isEmailValid && style.inputError]}
          value={email}
          onChangeText={handleEmailChange}
          placeholder="Enter Email (e.g., test@email.com)"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {!isEmailValid && (
          <Text style={style.errorText}>
            Please enter a valid email address
          </Text>
        )}
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
          Don't have an account?{" "}
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
  inputError: {
    borderColor: "#FF0000",
    borderWidth: 2,
  },
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    fontFamily: "outfit",
    marginTop: 5,
  },
});
