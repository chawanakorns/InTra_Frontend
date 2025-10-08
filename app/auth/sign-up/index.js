import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { useNavigation, useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { auth } from "../../../config/firebaseConfig";
import { API_URL } from "../../config";

export default function SignUp() {
  const navigation = useNavigation();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("Male");
  const [date, setDate] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);

  const genders = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
    { label: "Prefer not to say", value: "Prefer not to say" },
  ];

  const validateEmail = (emailText) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailText);
  const handleEmailChange = (text) => {
    setEmail(text);
    if (text.trim().length > 0) setIsEmailValid(validateEmail(text.trim()));
    else setIsEmailValid(true);
  };
  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  const showDatepicker = () => setShowDatePicker(true);

  const formatDateForDisplayAndAPI = (dateToFormat) => {
    const year = dateToFormat.getFullYear();
    const month = (dateToFormat.getMonth() + 1).toString().padStart(2, "0");
    const day = dateToFormat.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );
      const user = userCredential.user;
      await updateProfile(user, { displayName: fullName.trim() });
      const token = await user.getIdToken();
      await AsyncStorage.setItem("firebase_id_token", token);

      const syncData = {
        fullName: fullName.trim(),
        dob: formatDateForDisplayAndAPI(date),
        gender: gender,
      };

      await axios.post(`${API_URL}/auth/sync`, syncData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      router.replace("auth/personalize/kindOfusers");
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Registration failed. Please try again.";
      if (error.response) {
        errorMessage =
          error.response.data.detail || "An error occurred on the server.";
      } else if (error.isAxiosError) {
        errorMessage =
          "Network Error: Could not connect to the server. Please check your connection and try again.";
      } else if (error.code) {
        if (error.code === "auth/email-already-in-use") {
          errorMessage = "This email address is already registered.";
        } else if (error.code === "auth/invalid-email") {
          errorMessage = "The email address is not valid.";
        } else if (error.code === "auth/weak-password") {
          errorMessage = "The password is too weak.";
        }
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.innerContainer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Registration</Text>
        <Text style={styles.subtitle}>Setting up your own account now!</Text>

        <View style={{ marginTop: 30 }}>
          <Text style={styles.labelText}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter Your Full Name"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.row}>
          <View style={{ width: "48%" }}>
            <Text style={styles.labelText}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={showDatepicker}
            >
              <Text style={styles.dateText}>
                {formatDateForDisplayAndAPI(date)}
              </Text>
              <Ionicons name="calendar" size={20} color={Colors.GRAY} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onChangeDate}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
              />
            )}
          </View>
          <View style={{ width: "48%" }}>
            <Text style={styles.labelText}>Gender</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={genders}
              maxHeight={300}
              labelField="label"
              valueField="value"
              value={gender}
              onChange={(item) => setGender(item.value)}
              renderRightIcon={() => (
                <Ionicons name="chevron-down" size={20} color={Colors.GRAY} />
              )}
            />
          </View>
        </View>

        <View style={{ marginTop: 10 }}>
          <Text style={styles.labelText}>Email Address</Text>
          <TextInput
            style={[styles.input, !isEmailValid && styles.inputError]}
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

        <View style={{ marginTop: 10 }}>
          <Text style={styles.labelText}>Password</Text>
          <TextInput
            secureTextEntry={true}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter Your Password"
          />
        </View>

        <View style={{ marginTop: 10 }}>
          <Text style={styles.labelText}>Confirm Password</Text>
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
          style={[styles.button, isLoading && styles.disabledButton]}
        >
          {isLoading && (
            <ActivityIndicator
              size="small"
              color={Colors.WHITE}
              style={{ marginRight: 10 }}
            />
          )}
          <Text style={styles.buttonText}>
            {isLoading ? "Creating Account..." : "Sign Up"}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("auth/sign-in")}>
            <Text style={styles.footerLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // <-- MODIFIED
    backgroundColor: Colors.BLUE,
  },
  innerContainer: {
    // <-- NEW
    padding: 25,
    paddingTop: 50,
    flexGrow: 1,
  },
  title: {
    fontFamily: "outfit-bold",
    color: Colors.WHITE,
    fontSize: 30,
    marginTop: 30,
  },
  subtitle: {
    fontFamily: "outfit",
    fontSize: 16,
    color: Colors.WHITE,
    marginTop: 10,
  },
  labelText: {
    fontFamily: "outfit",
    fontSize: 16,
    color: Colors.WHITE,
    marginBottom: 10,
  },
  input: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 15,
    borderColor: Colors.GRAY,
    backgroundColor: Colors.WHITE,
    fontFamily: "outfit",
    fontSize: 16,
  },
  dateInput: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 15,
    borderColor: Colors.GRAY,
    backgroundColor: Colors.WHITE,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 58,
  },
  dateText: {
    fontFamily: "outfit",
    fontSize: 16,
    color: Colors.BLACK,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  dropdown: {
    paddingHorizontal: 15,
    borderWidth: 1,
    borderRadius: 15,
    borderColor: Colors.GRAY,
    backgroundColor: Colors.WHITE,
    height: 58,
  },
  placeholderStyle: {
    fontFamily: "outfit",
    fontSize: 16,
    color: Colors.BLACK,
  },
  selectedTextStyle: {
    fontFamily: "outfit",
    fontSize: 16,
    color: Colors.BLACK,
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
  button: {
    padding: 15,
    borderRadius: 15,
    marginTop: 40,
    backgroundColor: Colors.PRIMARY,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    paddingBottom: 20, 
  },
  footerText: {
    fontFamily: "outfit",
    fontSize: 16,
    color: Colors.WHITE,
  },
  footerLink: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: Colors.WHITE,
  },
});