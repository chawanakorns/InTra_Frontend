import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react'; // Import useCallback
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const BACKEND_API_URL = Platform.select({
  android: "http://10.0.2.2:8000",
  ios: "http://localhost:8000",
  default: "http://localhost:8000",
});

interface Itinerary {
  id: number; // Changed to number
  name: string;
  start_date: string;
  end_date: string;
  type: string;
  budget: string;
  created_at: string;
  updated_at: string;
}

interface Place {
  id: string;
  name: string;
  rating?: number;
  image?: string;
  address?: string;
  isOpen?: boolean;
  types?: string[];
  placeId: string;
}

export default function PlaceDetail() {
  const { placeId, placeName, placeData } = useLocalSearchParams();
  const router = useRouter();
  const place: Place = JSON.parse(placeData as string);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState('12:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDescription = () => {
    if (place.types?.includes('restaurant')) {
      return `The weather is nice these days. The atmosphere at the restaurant, especially the al fresco area, is very festive. There is a big Christmas tree in the middle and soft jazz music is playing.

We ordered 4 dishes: Fresh Local Fig Salad with Goat Cheese and Balsamic Honey Dressing, Gambas al Ajillo, Linguine with Seafood, and Chang Mai Lamb Chops with Tomatoes and Mint Salsa. The dish that we think is good is the Lamb Chops. It is cooked to perfection. The garnish is flavorful. The other dishes are just so-so.`;
    } else if (place.types?.includes('tourist_attraction')) {
      return `The atmosphere at ${placeName} is nice these days. The al fresco area is vibrant, and soft jazz music is playing. We recommend trying the local specialties!`;
    }
    return `The atmosphere at ${placeName} is nice these days. The al fresco area is vibrant, and soft jazz music is playing. We recommend trying the local specialties!`;
  };

    const fetchItineraries = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem('access_token');
            if (!token) {
              setError('Authentication required. Please log in.');
              return;  // Exit early if no token
            }

            const response = await fetch(`${BACKEND_API_URL}/api/itineraries/`, {  // add / to the end
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Server returned ${response.status}`);
            }

            const data = await response.json();
            setItineraries(data);
        } catch (err) {
            console.error('Error fetching itineraries:', err);
            setError(err instanceof Error ? err.message : 'Failed to load itineraries');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const handleAddToItinerary = async () => {
        if (!selectedItinerary) return;

        try {
            setLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem('access_token');
            if (!token) {
                throw new Error('Authentication required');
            }

            // Validate date is within itinerary range
            const itineraryStart = new Date(selectedItinerary.start_date);
            const itineraryEnd = new Date(selectedItinerary.end_date);
            if (date < itineraryStart || date > itineraryEnd) {
                throw new Error('Selected date must be within itinerary date range');
            }

            const scheduleItem = {
                place_id: placeId,
                place_name: placeName,
                place_type: place.types ? place.types[0] : null,
                place_address: place.address || null,
                place_rating: place.rating || null,
                place_image: place.image || null,
                place_data: place,
                scheduled_date: date.toISOString().split('T')[0],
                scheduled_time: time,
                duration_minutes: 60,
            };

            const response = await fetch(
                `${BACKEND_API_URL}/api/itineraries/${selectedItinerary.id}/items`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(scheduleItem),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Server returned ${response.status}`);
            }

            const newItem = await response.json();

            router.back();
            Alert.alert('Success', `Successfully added to ${selectedItinerary.name} itinerary!`);
        } catch (err) {
            console.error('Error adding to itinerary:', err);
            setError(err instanceof Error ? err.message : 'Failed to add to itinerary');
        } finally {
            setLoading(false);
        }
    };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onChangeTime = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItineraries();
  };

  useEffect(() => {
        if (showItineraryModal) {
            fetchItineraries(); // Fetch when modal is opened
        }
    }, [showItineraryModal, fetchItineraries]); // Depend on fetchItineraries

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/dashboard/home')} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Main Card */}
      <View style={styles.mainCard}>
        <Image 
          source={{ uri: place.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop' }} 
          style={styles.mainImage} 
        />
        <View style={styles.cardOverlay}>
          <Text style={styles.placeName}>{placeName}</Text>
          <Text style={styles.placeSubtitle}>
            {place.types?.includes('restaurant') ? 'Restaurant' : 
             place.types?.includes('tourist_attraction') ? 'Attraction' : 'Place'}
          </Text>
        </View>
      </View>

      {/* Thumbnail Images */}
      <View style={styles.thumbnailContainer}>
        {[
          '1514933817-b8ccc92d7b84',
          '1465101046530-73398c7f28ca',
          '1506744038136-46273834b3fb',
          '1500534314209-a25ddb2bd429'
        ].map((photoId, index) => (
          <View key={index} style={styles.thumbnail}>
            <Image 
              source={{ uri: `https://images.unsplash.com/photo-${photoId}?w=80&h=80&fit=crop` }} 
              style={styles.thumbnailImage} 
            />
          </View>
        ))}
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
          />
        }
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>{placeName}</Text>
        </View>

        <Text style={styles.description}>
          {getDescription()}
        </Text>

        {/* Details */}
        <View style={styles.detailsSection}>
          {place.address && (
            <Text style={styles.detailText}>Address: {place.address}</Text>
          )}
          {place.rating && (
            <Text style={styles.detailText}>Rating: {place.rating} / 5</Text>
          )}
          {place.isOpen !== undefined && (
            <Text style={styles.detailText}>Status: {place.isOpen ? 'Open' : 'Closed'}</Text>
          )}
        </View>
      </ScrollView>

      {/* Add to Itinerary Button */}
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => setShowItineraryModal(true)}
        disabled={loading}
      >
        <Text style={styles.addButtonText}>Add to Itinerary</Text>
      </TouchableOpacity>

      {/* Itinerary Selection Modal */}
      {showItineraryModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add to Itinerary</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Select Itinerary</Text>
              {loading && itineraries.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#6366F1" />
                  <Text style={styles.loadingText}>Loading itineraries...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity 
                    style={styles.retryButton} 
                    onPress={fetchItineraries}
                  >
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              ) : itineraries.length > 0 ? (
                <ScrollView style={styles.dropdownContainer}>
                  {itineraries.map((itinerary) => (
                    <TouchableOpacity
                      key={itinerary.id}
                      style={[
                        styles.itineraryOption,
                        selectedItinerary?.id === itinerary.id && styles.selectedItinerary
                      ]}
                      onPress={() => setSelectedItinerary(itinerary)}
                    >
                      <Text style={styles.itineraryName}>{itinerary.name}</Text>
                      <Text style={styles.itineraryDates}>
                        {new Date(itinerary.start_date).toLocaleDateString()} -{' '}
                        {new Date(itinerary.end_date).toLocaleDateString()}
                      </Text>
                      <Text style={styles.itineraryType}>
                        {itinerary.type} • {itinerary.budget}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noItinerariesText}>
                  No itineraries found. Create one first.
                </Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date</Text>
              <TouchableOpacity 
                style={styles.dateInput} 
                onPress={() => setShowDatePicker(true)}
              >
                <Text>{date.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onChangeDate}
                  minimumDate={selectedItinerary ? new Date(selectedItinerary.start_date) : undefined}
                  maximumDate={selectedItinerary ? new Date(selectedItinerary.end_date) : undefined}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Time</Text>
              <TouchableOpacity 
                style={styles.dateInput} 
                onPress={() => setShowTimePicker(true)}
              >
                <Text>{time}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="time"
                  display="default"
                  onChange={onChangeTime}
                />
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowItineraryModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.confirmButton, 
                  (!selectedItinerary || loading) && styles.disabledButton
                ]}
                onPress={handleAddToItinerary}
                disabled={!selectedItinerary || loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Add to Itinerary</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    padding: 4,
  },
  mainCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  mainImage: {
    width: '100%',
    height: 200,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  placeName: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  placeSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    letterSpacing: 1,
    marginTop: 4,
  },
  thumbnailContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  thumbnail: {
    width: 70,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    marginBottom: 24,
  },
  detailsSection: {
    marginBottom: 100,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dropdownContainer: {
    maxHeight: 150,
  },
  itineraryOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedItinerary: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  itineraryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itineraryDates: {
    fontSize: 14,
    color: '#6B7280',
  },
  itineraryType: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  noItinerariesText: {
    textAlign: 'center',
    color: '#6B7280',
    padding: 12,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});