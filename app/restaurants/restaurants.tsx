import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const data = [
  {
    id: '1',
    name: 'TERRA',
    rating: 5.0,
    image: require('./../../assets/images/attraction.jpg'),
  },
  { id: '2', name: 'Restaurant 2', rating: 0.0 },
  { id: '3', name: 'Restaurant 3', rating: 0.0 },
  { id: '4', name: 'Restaurant 4', rating: 0.0 },
];

export default function RestaurantsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Restaurants</Text>
      </View>

      <TextInput style={styles.search} placeholder="Search" placeholderTextColor="#888" />

      <TouchableOpacity style={styles.filterBtn}>
        <MaterialIcons name="thumb-up" size={18} color="#fff" />
        <Text style={styles.filterText}> Recommend</Text>
        <MaterialIcons name="arrow-drop-down" size={20} color="#fff" />
      </TouchableOpacity>

      <FlatList
        data={data}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('./restaurantDetail')}
          >
            <View style={styles.imageWrapper}>
              {item.image ? (
                <Image source={item.image} style={styles.image} />
              ) : (
                <View style={styles.placeholder} />
              )}
            </View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.rating}>⭐ {item.rating.toFixed(2)}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  search: {
    backgroundColor: '#f0f0f5',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    alignSelf: 'flex-start',
    padding: 10,
    borderRadius: 999,
    marginBottom: 16,
  },
  filterText: { color: '#fff', fontWeight: '600' },
  grid: { gap: 12 },
  card: {
    width: '48%',
    backgroundColor: '#EEF0FF',
    padding: 10,
    borderRadius: 12,
  },
  imageWrapper: {
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#ccc',
    marginBottom: 8,
  },
  image: { width: '100%', height: '100%' },
  placeholder: { width: '100%', height: '100%', backgroundColor: '#ccc' },
  name: { fontWeight: 'bold', marginBottom: 4 },
  rating: { color: '#444' },
});