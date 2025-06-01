import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function SignUp() {
  const navigation = useNavigation();
  const router = useRouter();
  const [gender, setGender] = useState('Male');
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
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
          onChangeText={(value) => setFullName(value)}
        />
      </View>

      {/* Date of Birth and Gender */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 10,
        }}
      >
        {/* Date of Birth */}
        <View
          style={{
            width: '48%',
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
            Date of Birth
          </Text>
          <TouchableOpacity
            style={{
              padding: 15,
              borderWidth: 1,
              borderRadius: 15,
              borderColor: Colors.GRAY,
              backgroundColor: Colors.WHITE,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{formatDate(date)}</Text>
            <Ionicons name="calendar" size={20} color={Colors.GRAY} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onChangeDate}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Gender */}
        <View
          style={{
            width: '48%',
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
          <TouchableOpacity
            style={{
              padding: 15,
              borderWidth: 1,
              borderRadius: 15,
              borderColor: Colors.GRAY,
              backgroundColor: Colors.WHITE,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onPress={() => setShowGenderDropdown(true)}
          >
            <Text>{gender}</Text>
            <Ionicons 
              name={showGenderDropdown ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={Colors.GRAY}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Gender Dropdown Modal */}
      <Modal
        transparent={true}
        visible={showGenderDropdown}
        onRequestClose={() => setShowGenderDropdown(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowGenderDropdown(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} />
        </TouchableWithoutFeedback>
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: Colors.WHITE,
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            padding: 15,
          }}
        >
          {genders.map((item) => (
            <TouchableOpacity
              key={item}
              style={{
                padding: 15,
                borderBottomWidth: 1,
                borderBottomColor: Colors.GRAY,
              }}
              onPress={() => {
                setGender(item);
                setShowGenderDropdown(false);
              }}
            >
              <Text
                style={{
                  fontFamily: "outfit",
                  fontSize: 16,
                  color: Colors.BLACK,
                }}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

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
          onChangeText={(value) => setEmail(value)}
          keyboardType="email-address"
          autoCapitalize="none"
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
          onChangeText={(value) => setPassword(value)}
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
          onChangeText={(value) => setConfirmPassword(value)}
        />
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity
        onPress={() => router.replace("/personalize/kindOfusers")}
        style={{
          padding: 15,
          borderRadius: 15,
          marginTop: 40,
          borderWidth: 1,
          backgroundColor: Colors.PRIMARY,
        }}
      >
        <Text
          style={{
            fontFamily: "outfit",
            fontSize: 16,
            color: Colors.WHITE,
            textAlign: "center",
          }}
        >
          Sign Up!
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