import { Colors } from "@/constants/Colors";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ImageBackground,
  Modal,
  PanResponder,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  date_of_birth?: string;
  gender?: string;
}

interface LoginPromptProps {
  onLogin: () => void;
}

const LoginPrompt = ({ onLogin }: LoginPromptProps) => (
  <View style={styles.loadingContainer}>
    <MaterialIcons name="person-outline" size={60} color={Colors.GRAY} />
    <Text style={styles.promptTitle}>View Your Profile</Text>
    <Text style={styles.promptText}>
      Log in to see your profile details and manage your account.
    </Text>
    <TouchableOpacity style={styles.promptButton} onPress={onLogin}>
      <Text style={styles.promptButtonText}>Log In or Sign Up</Text>
    </TouchableOpacity>
  </View>
);

export default function ProfileScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginRequired, setLoginRequired] = useState(false);

  const panY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(panY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setMenuVisible(false));
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const fetchUserProfile = async () => {
    setLoading(true);
    setLoginRequired(false);
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        setLoginRequired(true);
        return;
      }

      const response = await fetch("http://10.0.2.2:8000/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUserProfile(userData);
      } else if (response.status === 401) {
        Alert.alert("Session Expired", "Please log in again");
        await AsyncStorage.removeItem("access_token");
        setLoginRequired(true);
      } else {
        const errorData = await response.json();
        Alert.alert(
          "Error",
          errorData.detail || "Failed to fetch profile data"
        );
        setLoginRequired(true);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert(
        "Error",
        "A network error occurred. Please check your connection."
      );
      setLoginRequired(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleCloseModal = () => {
    Animated.timing(panY, {
      toValue: 500,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
      panY.setValue(0);
    });
  };

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (token) {
        await fetch("http://10.0.2.2:8000/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await AsyncStorage.removeItem("access_token");
      setUserProfile(null);
      setLoginRequired(true);
    }
  };

  const handleMenuItemPress = (action: string) => {
    handleCloseModal();
    if (action === "Settings") {
      router.push("/dashboard/profile/setting/setting");
    } else if (action === "Edit profile") {
      // Navigate to edit profile page
    } else if (action === "Log out") {
      Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: handleLogout,
        },
      ]);
    }
  };

  const formatDate = (
    dateString: string | number | Date | undefined
  ): string => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return String(dateString);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loginRequired || !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <LoginPrompt onLogin={() => router.replace("/auth/sign-in")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        }}
        style={styles.backgroundImage}
      >
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {
            panY.setValue(0);
            setMenuVisible(true);
          }}
        >
          <Text style={styles.menuDots}>⋯</Text>
        </TouchableOpacity>

        <View style={styles.profileCardContainer}>
          <View style={styles.profilePhotoContainer}>
            <Image
              source={require("../../../assets/images/defaultprofile.png")}
              style={styles.profilePhoto}
            />
          </View>

          <View style={styles.profileCard}>
            <Text style={styles.profileTitle}>Profile</Text>

            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>About Me</Text>
              <View style={styles.aboutTextContainer}>
                <Text style={styles.aboutText}></Text>
              </View>
            </View>

            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Full Name:</Text>
                <Text style={styles.detailValue}>{userProfile.full_name}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date of Birth:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(userProfile.date_of_birth)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Gender:</Text>
                <Text style={styles.detailValue}>
                  {userProfile.gender || "Not specified"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email Address:</Text>
                <Text style={styles.emailValue}>{userProfile.email}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Password:</Text>
                <Text style={styles.detailValue}>••••••</Text>
              </View>
            </View>
          </View>
        </View>

        <Modal
          animationType="fade"
          transparent={true}
          visible={menuVisible}
          onRequestClose={handleCloseModal}
          statusBarTranslucent={true}
        >
          <View style={styles.modalOverlay} {...panResponder.panHandlers}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ translateY: panY }],
                },
              ]}
            >
              <View style={styles.dragHandle}>
                <View style={styles.dragIndicator} />
              </View>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Menu</Text>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress("Edit profile")}
                >
                  <MaterialIcons name="edit" size={24} color="#4B5563" />
                  <Text style={styles.menuItemText}>Edit profile</Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color="#4B5563"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress("Settings")}
                >
                  <MaterialIcons name="settings" size={24} color="#4B5563" />
                  <Text style={styles.menuItemText}>Settings</Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color="#4B5563"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.menuItem, styles.logoutItem]}
                  onPress={() => handleMenuItemPress("Log out")}
                >
                  <MaterialIcons name="logout" size={24} color="#EF4444" />
                  <Text style={[styles.menuItemText, { color: "#EF4444" }]}>
                    Log out
                  </Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color="#EF4444"
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  promptTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.dark.text,
    textAlign: "center",
    marginTop: 16,
  },
  promptText: {
    fontSize: 16,
    color: Colors.GRAY,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
    marginBottom: 24,
  },
  promptButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  promptButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  menuButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "#6366F1",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  menuDots: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  profileCardContainer: {
    flex: 1,
    marginTop: 120,
    alignItems: "center",
  },
  profilePhotoContainer: {
    position: "absolute",
    top: -60,
    zIndex: 3,
    elevation: 3,
  },
  profilePhoto: {
    width: 150,
    height: 150,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: "white",
  },
  profileCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    flex: 1,
    marginBottom: 20,
    width: "100%",
  },
  profileTitle: {
    fontSize: 35,
    fontFamily: "outfit-bold",
    textAlign: "center",
    marginBottom: 20,
    color: Colors.PRIMARY,
    marginTop: 60,
  },
  aboutSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  aboutTextContainer: {
    backgroundColor: "#e6e9f0",
    borderRadius: 12,
    padding: 15,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
  },
  detailsSection: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "400",
    color: "#333",
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  emailValue: {
    fontSize: 16,
    color: "#007BFF",
    textAlign: "right",
    textDecorationLine: "underline",
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "auto",
    width: "100%",
    paddingBottom: 20,
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 20,
    textAlign: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: 1,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
    flex: 1,
    marginLeft: 15,
  },
  dragHandle: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 10,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
  },
});