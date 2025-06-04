import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AttractionCard from '../../../../components/AttractionCard';

const BACKEND_API_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api/recommendations/attractions',
  ios: 'http://localhost:8000/api/recommendations/attractions',
  default: 'http://localhost:8000/api/recommendations/attractions'
});

interface Place {
  id: string;
  name: string;
  rating: number;
  image?: string;
  address?: string;
  priceLevel?: number;
  isOpen?: boolean;
  types?: string[];
  placeId: string;
}

export default function RecommendationsScreen() {
  const router = useRouter();
  const [attractions, setAttractions] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlaces();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPlaces(attractions);
    } else {
      const filtered = attractions.filter(place =>
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPlaces(filtered);
    }
  }, [searchQuery, attractions]);

  const loadPlaces = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Please enable location permissions to find nearby attractions');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      console.log('Fetching from:', `${BACKEND_API_URL}?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}`);
      
      const response = await fetch(
        `${BACKEND_API_URL}?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      setAttractions(data);
      setFilteredPlaces(data);
      
    } catch (error) {
      console.error('Network Error:', error);
      setError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlacePress = (place: Place) => {
    router.push({
      pathname: './attractionDetail',
      params: {
        placeId: place.id,
        placeName: place.name,
        placeData: JSON.stringify(place)
      }
    });
  };

  const renderPlace = ({ item }: { item: Place }) => (
    <AttractionCard
      attraction={item}
      onPress={() => handlePlacePress(item)}
      style={styles.cardStyle}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/dashboard/home')}>
            <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Attractions</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Finding nearby attractions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attractions</Text>
        <TouchableOpacity onPress={loadPlaces} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <TextInput 
        style={styles.search} 
        placeholder="Search attractions..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPlaces}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.resultCount}>
          {filteredPlaces.length} attraction{filteredPlaces.length !== 1 ? 's' : ''} found
        </Text>
      )}

      <FlatList
        data={filteredPlaces}
        keyExtractor={(item) => item.id}
        renderItem={renderPlace}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={loadPlaces}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !error
            ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="attractions" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No Attractions found</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadPlaces}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )
            : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB', 
    padding: 16 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 20 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 16,
    color: '#1F2937'
  },
  refreshButton: {
    padding: 4
  },
  search: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  resultCount: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
  cardStyle: {
    marginHorizontal: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600'
  }
});