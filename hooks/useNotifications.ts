import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../app/config';

type NotificationItem = {
  title: string;
  body: string;
  category: string;
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifications = async () => {
    const userId = await AsyncStorage.getItem('user_id');
    if (!userId) return;

    try {
      const res = await fetch(`${API_URL}/api/in-app-notification/${userId}`);
      if (res.ok) {
        const data: NotificationItem[] = await res.json();
        setNotifications(data);
      } else {
        console.warn('Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    notifications,
    refresh: fetchNotifications,
  };
};
