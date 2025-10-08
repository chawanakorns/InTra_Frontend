import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const API_URL = Platform.select({
  android: 'http://10.0.2.2:8000',
  default: 'http://127.0.0.1:8000',
});

interface Notification {
  id: number;
  title: string;
  body: string | null;
  created_at: string;
  is_read: boolean;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('firebase_id_token');
      if (!token) {
        setIsLoggedIn(false);
        setNotifications([]);
        return;
      }
      setIsLoggedIn(true);

      const response = await fetch(`${API_URL}/api/notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data: Notification[] = await response.json();
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchNotifications();
    }, [fetchNotifications])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      const token = await AsyncStorage.getItem('firebase_id_token');
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleClearAll = async () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to delete all notifications? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('firebase_id_token');
              const response = await fetch(`${API_URL}/api/notifications/`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });

              if (response.ok) {
                setNotifications([]);
              } else {
                Alert.alert("Error", "Failed to clear notifications.");
              }
            } catch (error) {
              console.error("Failed to clear notifications:", error);
              Alert.alert("Error", "An unexpected error occurred.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.is_read && styles.unreadItem]}
      onPress={() => !item.is_read && handleMarkAsRead(item.id)}
    >
      <View style={styles.iconContainer}>
        {!item.is_read && <View style={styles.unreadDot} />}
        <MaterialIcons name="notifications" size={24} color="#6366F1" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        {item.body && <Text style={styles.body}>{item.body}</Text>}
        <Text style={styles.date}>
          {format(new Date(item.created_at), 'MMM d, yyyy, h:mm a')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <MaterialIcons name="lock-outline" size={60} color="#9CA3AF" />
          <Text style={styles.messageTitle}>Login Required</Text>
          <Text style={styles.messageText}>Please log in to see your notifications.</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/auth/sign-in')}>
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.header}>Notifications</Text>
        {notifications.length > 0 ? (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <MaterialIcons name="clear-all" size={28} color="#6B7280" />
          </TouchableOpacity>
        ) : (
            <View style={{ width: 40 }} /> // Spacer to keep title centered
        )}
      </View>
      {notifications.length === 0 ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="notifications-off" size={60} color="#9CA3AF" />
          <Text style={styles.messageTitle}>No Notifications Yet</Text>
          <Text style={styles.messageText}>Important updates will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6366F1"]} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', marginTop: 40},
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 10,
  },
  backButton: {
    padding: 6,
    marginRight: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
  },
  clearButton: {
    padding: 6,
    marginLeft: 10,
  },
  list: { paddingHorizontal: 20, paddingTop: 10 },
  notificationItem: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  unreadItem: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
  iconContainer: { marginRight: 15, alignItems: 'center' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1', position: 'absolute', top: -2, right: -2, zIndex: 1 },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  body: { fontSize: 14, color: '#4B5563', marginTop: 4 },
  date: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  messageTitle: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 12 },
  messageText: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  loginButton: { backgroundColor: '#6366F1', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  loginButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});