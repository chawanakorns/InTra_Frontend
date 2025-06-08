import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";

export default function SignUp() {
  const navigation = useNavigation();
  const router = useRouter();

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("Male");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const genders = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
    { label: "Prefer not to say", value: "Prefer not to say" },
  ];

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
    return date.toISOString().split("T")[0]; // YYYY-MM-DD format
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
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

      // Update this with your actual server URL
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
        Alert.alert("Success", "Account created successfully!", [
          {
            text: "OK",
            onPress: () => router.replace("auth/personalize/kindOfusers"),
          },
        ]);
      } else {
        // Handle specific error messages from your FastAPI backend
        let errorMessage = "Registration failed";
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

      {/* Full Name */}
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
          style={{
            padding: 15,
            borderWidth: 1,
            borderRadius: 15,
            borderColor: Colors.GRAY,
            backgroundColor: Colors.WHITE,
          }}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter Your Full Name"
          autoCapitalize="words"
        />
      </View>

      {/* Date of Birth and Gender */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        {/* Date of Birth */}
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
              // Android specific props for better year selection
              {...(Platform.OS === "android" && {
                display: "spinner",
              })}
            />
          )}
        </View>

        {/* Gender */}
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

      {/* Email */}
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
          style={{
            padding: 15,
            borderWidth: 1,
            borderRadius: 15,
            borderColor: Colors.GRAY,
            backgroundColor: Colors.WHITE,
          }}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Enter Your E-mail"
        />
      </View>

      {/* Password */}
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
          style={{
            padding: 15,
            borderWidth: 1,
            borderRadius: 15,
            borderColor: Colors.GRAY,
            backgroundColor: Colors.WHITE,
          }}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter Your Password"
        />
      </View>

      {/* Confirm Password */}
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
          style={{
            padding: 15,
            borderWidth: 1,
            borderRadius: 15,
            borderColor: Colors.GRAY,
            backgroundColor: Colors.WHITE,
          }}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Enter Confirm Password"
        />
      </View>

      {/* Sign Up Button */}
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

      {/* Login Link */}
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
