// file: context/NotificationContext.tsx

import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  height: Animated.Value;
}

interface NotificationContextType {
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const newNotification: Notification = {
      id: Date.now(),
      message,
      type,
      height: new Animated.Value(0),
    };

    setNotifications(prev => [newNotification, ...prev]);

    Animated.timing(newNotification.height, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();

    setTimeout(() => {
      Animated.timing(newNotification.height, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      });
    }, 3000);
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <View style={styles.container}>
        {notifications.map(n => (
          <Animated.View
            key={n.id}
            style={[
              styles.notification,
              styles[n.type],
              {
                height: n.height.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 60],
                }),
                opacity: n.height,
                transform: [
                  {
                    translateY: n.height.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.text}>{n.message}</Text>
          </Animated.View>
        ))}
      </View>
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Adjust as needed for safe area
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  notification: {
    borderRadius: 8,
    paddingHorizontal: 15,
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  success: { backgroundColor: '#4CAF50' },
  error: { backgroundColor: '#F44336' },
  info: { backgroundColor: '#2196F3' },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});