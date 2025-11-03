import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { API_URL } from '../app/config';

// It tells the app how to behave when a notification is received while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true, // Let's turn sound on for testing
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
      `${API_URL}/auth/fcm-token`,
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
    return null;
  }
  
  // On Android, we must create a channel before asking for permissions.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250], // Vibrate pattern
      lightColor: '#FF231F7C', // Red light
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: '274b91e6-8a77-42dd-af30-079499a02c07',
    })).data;
    
    console.log('--- EXPO PUSH TOKEN ---');
    console.log(token);
    console.log('-----------------------');

    await sendTokenToBackend(token);
    return token;
  } catch(e) {
    console.error("Failed to get Expo Push Token", e);
    return null;
  }
}