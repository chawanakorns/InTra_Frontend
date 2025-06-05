import { Colors } from "@/constants/Colors";
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
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
} from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

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

  // Handle menu item press
  const handleMenuItemPress = (action: string) => {
    if (action === 'Settings') {
      console.log(`Selected: ${action}`);
      router.push('./settings');
      handleCloseModal();
    } else if (action === 'Edit profile') {
      console.log(`Selected: ${action}`);
      handleCloseModal();
    } else if (action === 'Log out') {
      console.log(`Selected: ${action}`);
      router.push('/');
      handleCloseModal();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
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
              source={{
                uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
              }}
              style={styles.profilePhoto}
            />
          </View>

          <View style={styles.profileCard}>
            <Text style={styles.profileTitle}>Profile</Text>

            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>About Me</Text>
              <View style={styles.aboutTextContainer}>
                <Text style={styles.aboutText}>
                  My name is John Doe, I am from United Kingdom,{"\n"}
                  I love hiking and cultural attraction, currently am{"\n"}
                  travelling in Chiang Mai!
                </Text>
              </View>
            </View>

            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Full Name:</Text>
                <Text style={styles.detailValue}>John Doe</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date of Birth:</Text>
                <Text style={styles.detailValue}>1/1/1987</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Gender:</Text>
                <Text style={styles.detailValue}>Male</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email Address:</Text>
                <Text style={styles.emailValue}>johndoe@gmail.com</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Password:</Text>
                <Text style={styles.detailValue}>••••••••••••</Text>
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
                  onPress={() => handleMenuItemPress('Edit profile')}
                >
                  <MaterialIcons name="edit" size={24} color="#4B5563" />
                  <Text style={styles.menuItemText}>Edit profile</Text>
                  <MaterialIcons name="chevron-right" size={24} color="#4B5563" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => router.push('./setting/setting')}

                >
                  <MaterialIcons name="settings" size={24} color="#4B5563" />
                  <Text style={styles.menuItemText}>Settings</Text>
                  <MaterialIcons name="chevron-right" size={24} color="#4B5563" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.menuItem, styles.logoutItem]}
                  onPress={() => handleMenuItemPress('Log out')}
                >
                  <MaterialIcons name="logout" size={24} color="#EF4444" />
                  <Text style={[styles.menuItemText, { color: '#EF4444' }]}>
                    Log out
                  </Text>
                  <MaterialIcons name="chevron-right" size={24} color="#EF4444" />
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
    resizeMode: 'cover',
  },
  menuButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#6366F1',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  menuDots: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileCardContainer: {
    flex: 1,
    marginTop: 120,
    alignItems: 'center',
  },
  profilePhotoContainer: {
    position: 'absolute',
    top: -60,
    zIndex: 3,
    elevation: 3,
  },
  profilePhoto: {
    width: 150,
    height: 150,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: 'white',
  },
  profileCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    flex: 1,
    marginBottom: 20,
    width: '100%',
  },
  profileTitle: {
    fontSize: 35,
    fontFamily: "outfit-bold",
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.PRIMARY,
    marginTop: 60,
  },
  aboutSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  aboutTextContainer: {
    backgroundColor: '#e6e9f0',
    borderRadius: 12,
    padding: 15,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  detailsSection: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#333',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  emailValue: {
    fontSize: 16,
    color: '#007BFF',
    textAlign: 'right',
    textDecorationLine: 'underline',
    flex: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '40%',
    width: '100%',
  },
  modalContent: {
    padding: 20,
    flex: 1,
    justifyContent: 'flex-start',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    justifyContent: 'space-between',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
    marginLeft: 10,
  },
  actionButton: {
    backgroundColor: '#6366F1',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6366F1',
    marginTop: 5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#6366F1',
  },
  dragHandle: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
});