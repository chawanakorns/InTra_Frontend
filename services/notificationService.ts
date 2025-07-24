import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const BACKEND_AUTH_API_URL = Platform.select({
  android: "http://10.0.2.2:8000/auth",
  ios: "http://localhost:8000/auth",
  default: "http://localhost:8000/auth",
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function sendTokenToBackend(token: string) {
  try {
    const authToken = await AsyncStorage.getItem('firebase_id_token');
    if (!authToken) {
      console.log('User not logged in, cannot send FCM token.');
      return;
    }

    await axios.post(
      `${BACKEND_AUTH_API_URL}/fcm-token`,
      { fcm_token: token },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('FCM token sent to backend successfully.');
  } catch (error) {
    console.error('Error sending FCM token to backend:', error);
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    alert('Must use physical device for Push Notifications');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return null;
  }

  try {
    // ACTION REQUIRED: Replace with your actual Expo Project ID
    // You can find this on your project page at expo.dev
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'YOUR_EXPO_PROJECT_ID_HERE',
    })).data;
    
    console.log('Expo Push Token:', token);
    await sendTokenToBackend(token);
    return token;
  } catch(e) {
    console.error("Failed to get Expo Push Token", e);
    return null;
  }
}