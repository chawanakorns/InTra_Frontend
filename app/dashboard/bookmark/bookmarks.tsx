import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BACKEND_API_URL = Platform.select({
  android: "http://10.0.2.2:8000",
  ios: "http://localhost:8000",
  default: "http://localhost:8000",
});

interface Bookmark {
  id: number;
  place_id: string;
  place_name: string;
  place_type: string | null;
  place_address: string | null;
  place_rating: number | null;
  place_image: string | null;
}

const getCategory = (placeType: string | null): 'attraction' | 'restaurant' => {
  const typeStr = placeType?.toLowerCase() || '';
  if (typeStr.includes('restaurant') || typeStr.includes('cafe') || typeStr.includes('bakery')) {
    return 'restaurant';
  }
  return 'attraction';
};

export default function BookmarksScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "attraction" | "restaurant">("all");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    if (!refreshing) setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setError("Please log in to see your bookmarks.");
        setBookmarks([]);
        return;
      }
      const response = await fetch(`${BACKEND_API_URL}/api/bookmarks/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch bookmarks.");
      }
      const data: Bookmark[] = await response.json();
      setBookmarks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useFocusEffect(
    useCallback(() => {
      fetchBookmarks();
    }, [fetchBookmarks])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookmarks();
  }, [fetchBookmarks]);

  const removeBookmark = async (bookmarkId: number) => {
    const originalBookmarks = [...bookmarks];
    setBookmarks(bookmarks.filter((b) => b.id !== bookmarkId));
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error("Authentication required");
      
      const response = await fetch(`${BACKEND_API_URL}/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status !== 204) {
        Alert.alert("Error", "Failed to remove bookmark. Please try again.");
        setBookmarks(originalBookmarks);
      }
    } catch (e) {
      Alert.alert("Error", "An error occurred while removing the bookmark.");
      setBookmarks(originalBookmarks);
    }
  };

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const name = bookmark.place_name || "";
    const address = bookmark.place_address || "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      address.toLowerCase().includes(searchQuery.toLowerCase());
    const category = getCategory(bookmark.place_type);
    const matchesCategory = selectedCategory === "all" || category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryCount = (category: "all" | "attraction" | "restaurant") => {
    if (category === "all") return bookmarks.length;
    return bookmarks.filter((b) => getCategory(b.place_type) === category).length;
  };

  const renderStars = (rating: number | null) => {
    if (rating === null || rating === 0) return null;
    return Array.from({ length: Math.floor(rating) }, (_, i) => (
      <Text key={i} style={styles.star}>★</Text>
    ));
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading Bookmarks...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBookmarks}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (bookmarks.length === 0) {
        return (
            <View style={styles.centeredContainer}>
              <MaterialIcons name="bookmark-border" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Bookmarks Yet</Text>
              <Text style={styles.emptySubtitle}>Start saving your favorite places!</Text>
            </View>
        );
    }

    if (filteredBookmarks.length === 0) {
        return (
            <View style={styles.centeredContainer}>
              <MaterialIcons name="search-off" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Results Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filters.</Text>
            </View>
        );
    }

    return (
      filteredBookmarks.map((bookmark) => {
        const category = getCategory(bookmark.place_type);
        return (
          <View key={bookmark.id} style={styles.bookmarkCard}>
            <Image
              source={{ uri: bookmark.place_image || 'https://placehold.co/600x400?text=No+Image' }}
              style={styles.bookmarkImage}
            />
            <View style={styles.bookmarkContent}>
              <View style={styles.bookmarkHeader}>
                <View style={styles.bookmarkInfo}>
                  <Text style={styles.bookmarkName} numberOfLines={1}>{bookmark.place_name}</Text>
                  <Text style={styles.bookmarkLocation} numberOfLines={1}>
                    <MaterialIcons name="location-on" size={14} color="#6B7280" /> {bookmark.place_address || "No address provided"}
                  </Text>
                </View>
                <TouchableOpacity style={styles.removeButton} onPress={() => removeBookmark(bookmark.id)}>
                  <MaterialIcons name="close" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
              <View style={styles.bookmarkMeta}>
                <View style={styles.rating}>
                  {renderStars(bookmark.place_rating)}
                  {bookmark.place_rating && <Text style={styles.ratingText}>{bookmark.place_rating.toFixed(1)}</Text>}
                </View>
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>{category === "attraction" ? "🏛️ Attraction" : "🍽️ Restaurant"}</Text>
                </View>
              </View>
            </View>
          </View>
        )
      })
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookmarks</Text>
        <Text style={styles.subtitle}>{bookmarks.length} saved places</Text>
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>
      <ScrollView
        style={styles.bookmarksList}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6366F1"]}/>}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: "bold", color: "#1F2937", marginBottom: 4 },
  subtitle: { fontSize: 16, color: "#6B7280" },
  searchContainer: { paddingHorizontal: 20, marginBottom: 20 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: "#1F2937" },
  bookmarksList: { flex: 1, paddingHorizontal: 20 },
  bookmarkCard: { backgroundColor: "#FFFFFF", borderRadius: 16, marginBottom: 16, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, overflow: "hidden" },
  bookmarkImage: { width: "100%", height: 180, backgroundColor: "#F3F4F6" },
  bookmarkContent: { padding: 16 },
  bookmarkHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  bookmarkInfo: { flex: 1, marginRight: 8 },
  bookmarkName: { fontSize: 18, fontWeight: "bold", color: "#1F2937", marginBottom: 4 },
  bookmarkLocation: { fontSize: 14, color: "#6B7280", flexDirection: 'row', alignItems: 'center' },
  removeButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#FEE2E2", justifyContent: "center", alignItems: "center" },
  bookmarkMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rating: { flexDirection: "row", alignItems: "center" },
  star: { fontSize: 14, color: "#FBBF24", marginRight: 2 },
  ratingText: { fontSize: 14, fontWeight: "600", color: "#1F2937", marginLeft: 4 },
  categoryTag: { backgroundColor: "#F3F4F6", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryTagText: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  centeredContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  loadingText: { marginTop: 10, fontSize: 16, color: "#6B7280" },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937", marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center" },
  errorText: { color: "#B91C1C", fontSize: 16, textAlign: "center", marginBottom: 20 },
  retryButton: { backgroundColor: "#6366F1", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});