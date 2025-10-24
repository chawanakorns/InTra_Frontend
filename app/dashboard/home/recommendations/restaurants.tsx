import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RestaurantCard from "../../../../components/RestaurantCard";
import { useTheme } from "../../../../context/ThemeContext";
import { API_URL } from "../../../config";

const BACKEND_API_URL = Platform.select({
  android: `${API_URL}/api/recommendations/restaurants`,
  ios: `${API_URL}/api/recommendations/restaurants`,
  default: `${API_URL}/api/recommendations/restaurants`,
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
  relevance_score?: number;
}

export default function RecommendationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [restaurants, setRestaurants] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlaces();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPlaces(restaurants);
    } else {
      const filtered = restaurants.filter(
        (place) =>
          place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPlaces(filtered);
    }
  }, [searchQuery, restaurants]);

  const loadPlaces = async () => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Please enable location permissions to find nearby restaurants");
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const apiUrl = `${BACKEND_API_URL}?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}`;
      
      const token = await AsyncStorage.getItem('firebase_id_token'); // <-- CORRECTED TOKEN KEY

      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(apiUrl, { method: 'GET', headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned ${response.status}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error("Received non-array data from server");
      }

      setRestaurants(data);
      setFilteredPlaces(data);

    } catch (err) {
      console.error("Error fetching restaurants:", err);
      let message = "Failed to load restaurants.";
      if (err instanceof Error) {
        message += ` ${err.message}`;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlacePress = (place: Place) => {
    router.push({
      pathname: "./placeDetail",
      params: {
        placeId: place.id,
        placeName: place.name,
        placeData: JSON.stringify(place),
      },
    });
  };

  const renderPlace = ({ item }: { item: Place }) => (
    <RestaurantCard restaurant={item} onPress={() => handlePlacePress(item)} style={styles.cardStyle} />
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Finding nearby restaurants...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/dashboard/home')}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Restaurants</Text>
        <TouchableOpacity onPress={loadPlaces} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <TextInput style={[styles.search, { backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }]} placeholder="Search restaurants..." value={searchQuery} onChangeText={setSearchQuery} />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPlaces}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!error && <Text style={styles.resultCount}>{filteredPlaces.length} restaurant{filteredPlaces.length !== 1 ? "s" : ""}</Text>}

      <FlatList
        data={filteredPlaces}
        keyExtractor={(item) => item.id}
        renderItem={renderPlace}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !error ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="restaurant" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No restaurants found</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadPlaces}><Text style={styles.retryButtonText}>Try Again</Text></TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: "bold", flex: 1, marginLeft: 16, color: "#1F2937" },
  refreshButton: { padding: 4 },
  search: { backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: "#E5E7EB", elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  resultCount: { color: "#6B7280", fontSize: 14, marginBottom: 16, fontWeight: "500" },
  listContainer: { paddingBottom: 20 },
  cardStyle: { marginHorizontal: 0 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, color: "#6B7280", fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  emptyText: { color: "#6B7280", fontSize: 16, marginTop: 16, textAlign: "center" },
  errorContainer: { backgroundColor: "#FEE2E2", padding: 16, borderRadius: 8, marginBottom: 16, alignItems: "center" },
  errorText: { color: "#B91C1C", fontSize: 14, marginBottom: 12, textAlign: "center" },
  retryButton: { backgroundColor: "#6366F1", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: "#fff", fontWeight: "600" },
});