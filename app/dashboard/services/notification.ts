import axios from 'axios';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

export async function sendNotificationToBackend(fcmToken: string, title: string, body: string, data: any = {}) {
  try {
    const res = await axios.post("http://127.0.0.1:8000/api/send-notification", { // <--- Change IP!
      fcm_token: fcmToken,
      title,
      body,
      data
    });
    return res.data;
  } catch (error) {
    console.error("Notification Error:", error);
    return null;
  }
}
