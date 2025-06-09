import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRouter } from "expo-router";
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
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";

export default function SignUp() {
  const navigation = useNavigation();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("Male");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);

  const genders = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
    { label: "Prefer not to say", value: "Prefer not to say" },
  ];

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

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateForAPI = (date) => {
    return date.toISOString().split("T")[0];
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return false;
    }

    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return false;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    if (!password) {
      Alert.alert("Error", "Please enter a password");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        full_name: fullName.trim(),
        date_of_birth: formatDateForAPI(date),
        gender: gender,
        email: email.trim().toLowerCase(),
        password: password,
      };

      const API_BASE_URL = "http://10.0.2.2:8000";

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        const token = data.access_token; // Extract token from response
        await AsyncStorage.setItem("access_token", token); // Store token
        console.log("Token saved:", token);
        router.replace("auth/personalize/kindOfusers"); // Redirect to personalization
      } else {
        let errorMessage = "Registration failed";
        if (data.detail) {
          if (typeof data.detail === "string") {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map((err) => err.msg).join(", ");
          }
        }
        Alert.alert("Error", errorMessage);
      }
    } catch (error) {
      console.error("Registration error:", error);
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
        Registration
      </Text>

      <Text
        style={{
          fontFamily: "outfit",
          fontSize: 16,
          color: Colors.WHITE,
          marginTop: 10,
        }}
      >
        Setting up your own account now!
      </Text>

      <View
        style={{
          marginTop: 30,
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
          Full Name
        </Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter Your Full Name"
          autoCapitalize="words"
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <View style={{ width: "48%" }}>
          <Text
            style={{
              fontFamily: "outfit",
              fontSize: 16,
              color: Colors.WHITE,
              marginBottom: 10,
            }}
          >
            Date of Birth
          </Text>
          <TouchableOpacity
            style={{
              padding: 15,
              borderWidth: 1,
              borderRadius: 15,
              borderColor: Colors.GRAY,
              backgroundColor: Colors.WHITE,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            onPress={showDatepicker}
          >
            <Text>{formatDate(date)}</Text>
            <Ionicons name="calendar" size={20} color={Colors.GRAY} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onChangeDate}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              {...(Platform.OS === "android" && {
                display: "spinner",
              })}
            />
          )}
        </View>

        <View
          style={{
            width: "48%",
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
            Gender
          </Text>
          <Dropdown
            style={{
              padding: 15,
              borderWidth: 1,
              borderRadius: 15,
              borderColor: Colors.GRAY,
              backgroundColor: Colors.WHITE,
            }}
            placeholderStyle={{
              fontFamily: "outfit",
              fontSize: 16,
              color: Colors.BLACK,
            }}
            selectedTextStyle={{
              fontFamily: "outfit",
              fontSize: 16,
              color: Colors.BLACK,
            }}
            inputSearchStyle={{
              height: 40,
              fontSize: 16,
            }}
            iconStyle={{
              width: 20,
              height: 20,
            }}
            data={genders}
            search={false}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Select Gender"
            value={gender}
            onChange={(item) => {
              setGender(item.value);
            }}
            renderRightIcon={() => (
              <Ionicons name="chevron-down" size={20} color={Colors.GRAY} />
            )}
          />
        </View>
      </View>

      <View
        style={{
          marginTop: 10,
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
          Email Address
        </Text>
        <TextInput
          style={[
            styles.input,
            !isEmailValid && styles.inputError
          ]}
          value={email}
          onChangeText={handleEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Enter Your E-mail (e.g., test@email.com)"
        />
        {!isEmailValid && (
          <Text style={styles.errorText}>
            Please enter a valid email address
          </Text>
        )}
      </View>

      <View
        style={{
          marginTop: 10,
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
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter Your Password"
        />
      </View>

      <View
        style={{
          marginTop: 10,
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
          Confirm Password
        </Text>
        <TextInput
          secureTextEntry={true}
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Enter Confirm Password"
        />
      </View>

      <TouchableOpacity
        onPress={handleSignUp}
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
          {isLoading ? "Creating Account..." : "Sign Up"}
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
          Already have an account?{" "}
        </Text>
        <TouchableOpacity onPress={() => router.replace("auth/sign-in")}>
          <Text
            style={{
              fontFamily: "outfit-bold",
              fontSize: 16,
              color: Colors.WHITE,
            }}
          >
            Login
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 15,
    borderColor: Colors.GRAY,
    backgroundColor: Colors.WHITE,
  },
  inputError: {
    borderColor: '#FF0000',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    fontFamily: 'outfit',
    marginTop: 5,
  },
});