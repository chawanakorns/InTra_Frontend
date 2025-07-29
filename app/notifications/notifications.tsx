import React from 'react';
import { SafeAreaView, FlatList, Text, View, StyleSheet } from 'react-native';
import { useNotifications } from '../../hooks/useNotifications';

export default function NotificationsScreen() {
  const { notifications } = useNotifications();

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.category}>{item.category}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  card: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  body: { fontSize: 14, color: '#334155' },
  category: { fontSize: 12, color: '#6b7280', marginTop: 6 },
});
