import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useContext, useState } from 'react';
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
  View
} from 'react-native';
import { auth } from '../../../config/firebaseConfig';
import { AuthContext } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { API_URL } from '../../config';

interface Notification {
  id: number;
  title: string;
  body: string | null;
  created_at: string;
  is_read: boolean;
}

const LoginRequiredView = ({ onLoginPress }: { onLoginPress: () => void }) => {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centeredContainer}>
          <MaterialIcons name="lock-outline" size={60} color={colors.icon} />
          <Text style={[styles.messageTitle, { color: colors.text }]}>Login Required</Text>
          <Text style={[styles.messageText, { color: colors.icon }]}>Please log in to see your notifications.</Text>
          <TouchableOpacity style={[styles.loginButton, { backgroundColor: colors.primary }]} onPress={onLoginPress}>
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
};


export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const { user, initializing } = useContext(AuthContext);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      if (initializing) return; // wait until auth initialized
      if (!user) {
        setIsLoggedIn(false);
        setNotifications([]);
        return;
      }
      setIsLoggedIn(true);

      const token = await auth.currentUser?.getIdToken();
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
  }, [initializing, user]);

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
      const token = await auth.currentUser?.getIdToken();
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
            const originalNotifications = [...notifications];
            setNotifications([]);
              try {
                const token = await auth.currentUser?.getIdToken();
                const response = await fetch(`${API_URL}/api/notifications/`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) {
                  Alert.alert("Error", "Failed to clear notifications.");
                  setNotifications(originalNotifications);
                }
              } catch (error) {
                console.error("Failed to clear notifications:", error);
                Alert.alert("Error", "An unexpected error occurred.");
                setNotifications(originalNotifications);
              }
          },
          style: "destructive",
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const titleColor = item.is_read ? colors.icon : colors.text;
    const bodyColor = item.is_read ? colors.icon : colors.text;
    const dateColor = item.is_read ? colors.icon : colors.text;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          !item.is_read && { backgroundColor: '#7E9DFF', borderColor: '#7E9DFF' }
        ]}
        onPress={() => !item.is_read && handleMarkAsRead(item.id)}
      >
        <View style={styles.iconContainer}>
          {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: '#7E9DFF' }]} />}
          <MaterialIcons name={item.is_read ? "notifications-none" : "notifications"} size={24} color={item.is_read ? colors.icon : '#7E9DFF'} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: titleColor }]}>{item.title}</Text>
          {item.body && <Text style={[styles.body, { color: bodyColor }]}>{item.body}</Text>}
          <Text style={[styles.date, { color: dateColor }]}>
            {format(new Date(item.created_at), 'MMM d, yyyy, h:mm a')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color='#7E9DFF' />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <LoginRequiredView onLoginPress={() => router.replace('/auth/sign-in')} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: colors.text }]}>Notifications</Text>
        {notifications.length > 0 ? (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <MaterialIcons name="clear-all" size={28} color={colors.icon} />
          </TouchableOpacity>
        ) : (
            <View style={{ width: 40 }} />
        )}
      </View>
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[styles.errorText, { color: '#B91C1C' }]}>{error}</Text>
        </View>
      )}
      {notifications.length === 0 ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="notifications-off" size={60} color={colors.icon} />
          <Text style={[styles.messageTitle, { color: colors.text }]}>No Notifications Yet</Text>
          <Text style={[styles.messageText, { color: colors.icon }]}>Important updates will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? 30 : 0 },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
    marginRight: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  clearButton: {
    padding: 6,
    marginLeft: 10,
  },
  list: { paddingHorizontal: 20, paddingTop: 10 },
  notificationItem: { 
    flexDirection: 'row', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 15, 
    alignItems: 'center', 
    borderWidth: 1,
  },
  unreadItem: {},
  iconContainer: { marginRight: 15, alignItems: 'center' },
  unreadDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    position: 'absolute', 
    top: -2, 
    right: -2, 
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#FFFFFF', // To make it pop a bit
  },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold' },
  body: { fontSize: 14, marginTop: 4 },
  date: { fontSize: 12, marginTop: 8 },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  messageTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  messageText: { fontSize: 16, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  loginButton: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  loginButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  errorContainer: { padding: 12, borderRadius: 8, marginHorizontal: 20, marginBottom: 12 },
  errorText: { fontSize: 14, textAlign: 'center' },
});