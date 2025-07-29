import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { API_URL } from '../app/config'; // <-- THE FIX: Import the centralized URL

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
      `${API_URL}/auth/fcm-token`, // <-- THE FIX: Use API_URL
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
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: '274b91e6-8a77-42dd-af30-079499a02c07',
    })).data;
    
    console.log('Expo Push Token:', token);
    await sendTokenToBackend(token);
    return token;
  } catch(e) {
    console.error("Failed to get Expo Push Token", e);
    return null;
  }
}