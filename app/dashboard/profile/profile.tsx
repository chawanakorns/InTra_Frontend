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

export default function ProfileScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Animation setup for drag-to-close
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

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      // Debug: List all stored keys
      const allKeys = await AsyncStorage.getAllKeys();
      console.log("All stored keys:", allKeys);

      const token = await AsyncStorage.getItem("access_token");
      console.log("Retrieved token:", token); // Debug log

      if (!token) {
        Alert.alert("Error", "No authentication token found");
        router.push("/");
        return;
      }

      const response = await fetch("http://10.0.2.2:8000/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status); // Debug log

      if (response.ok) {
        const userData = await response.json();
        console.log("User data:", userData); // Debug log
        setUserProfile(userData);
      } else if (response.status === 401) {
        Alert.alert("Session Expired", "Please log in again");
        await AsyncStorage.removeItem("access_token");
        router.push("/");
      } else {
        const errorData = await response.json();
        console.log("Error response:", errorData); // Debug log
        Alert.alert("Error", "Failed to fetch profile data");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Handle closing modal
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

  // Handle logout
  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (token) {
        // Call logout endpoint
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
      // Clear token regardless of API call success
      await AsyncStorage.removeItem("access_token");
      router.push("/");
    }
  };

  // Handle menu item press
  const handleMenuItemPress = (action: string) => {
    if (action === "Settings") {
      console.log(`Selected: ${action}`);
      router.push("./settings");
      handleCloseModal();
    } else if (action === "Edit profile") {
      console.log(`Selected: ${action}`);
      handleCloseModal();
    } else if (action === "Log out") {
      console.log(`Selected: ${action}`);
      Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            handleLogout();
            handleCloseModal();
          },
        },
      ]);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
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

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchUserProfile}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
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
        {/* Top right menu button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {
            panY.setValue(0); // Reset animation
            setMenuVisible(true);
          }}
        >
          <Text style={styles.menuDots}>⋯</Text>
        </TouchableOpacity>

        {/* Profile card */}
        <View style={styles.profileCardContainer}>
          <View style={styles.profilePhotoContainer}>
            <Image
              source={require('../../../assets/images/defaultprofile.png')}
              style={styles.profilePhoto}
            />
          </View>

          <View style={styles.profileCard}>
            <Text style={styles.profileTitle}>Profile</Text>

            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>About Me</Text>
              <View style={styles.aboutTextContainer}>
                <Text style={styles.aboutText}>
                </Text>
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

        {/* Popup menu as Modal */}
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
                  onPress={() => router.push("./setting/setting")}
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
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "40%",
    width: "100%",
  },
  modalContent: {
    padding: 20,
    flex: 1,
    justifyContent: "flex-start",
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
    justifyContent: "space-between",
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
    flex: 1,
    marginLeft: 10,
  },
  actionButton: {
    backgroundColor: "#6366F1",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#6366F1",
    marginTop: 5,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButtonText: {
    color: "#6366F1",
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
