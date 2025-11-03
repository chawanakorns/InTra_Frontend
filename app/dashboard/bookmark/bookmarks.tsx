import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useContext, useState } from "react";
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
import { auth } from '../../../config/firebaseConfig';
import { AuthContext } from '../../../context/AuthContext';
import { useTheme } from "../../../context/ThemeContext";
import { API_URL } from "../../config";

const BACKEND_API_URL = Platform.select({
  android: `${API_URL}`,
  ios: `${API_URL}`,
  default: `${API_URL}`,
});

const COLORS = {
  primary: "#6366F1",
  primaryLight: "#E0E7FF",
  white: "#FFFFFF",
  dark: "#1F2937",
  text: "#4B5563",
  lightGray: "#F3F4F6",
  gray: "#9CA3AF",
  danger: "#EF4444",
  dangerLight: "#FEE2E2",
  warning: "#FBBF24",
};

interface Bookmark {
  id: number;
  place_id: string;
  place_name: string;
  place_type: string | null;
  place_address: string | null;
  place_rating: number | null;
  place_image: string | null;
  place_data: object | null;
}

type Category = "all" | "attraction" | "restaurant";

const getCategory = (placeType: string | null): Exclude<Category, "all"> => {
  const typeStr = placeType?.toLowerCase() || "";
  if (typeStr.includes("restaurant") || typeStr.includes("food") || typeStr.includes("cafe") || typeStr.includes("bakery")) {
    return "restaurant";
  }
  return "attraction";
};

const LoginRequiredView = ({ onLoginPress }: { onLoginPress: () => void }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
      <MaterialIcons name="lock-outline" size={60} color={colors.icon} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Login Required</Text>
      <Text style={[styles.messageText, { color: colors.icon }]}>Please log in to view your saved bookmarks.</Text>
      <TouchableOpacity style={[styles.loginButton, { backgroundColor: colors.primary }]} onPress={onLoginPress}>
        <Text style={styles.loginButtonText}>Go to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function BookmarksScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginRequired, setLoginRequired] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const authCtx = useContext(AuthContext);

  const fetchBookmarks = useCallback(async () => {
    if (!refreshing) setLoading(true);
    setError(null);
    setLoginRequired(false);

    try {
      if (authCtx.initializing) {
        // wait for auth initialization before attempting API calls
        setLoading(false);
        return;
      }

      let token: string | null = null;
      if (authCtx.token) token = authCtx.token;
      else if (auth.currentUser) {
        try { token = await auth.currentUser.getIdToken(); } catch (err) { console.warn('Failed to get token', err); }
      }

      if (!token) {
        setLoginRequired(true);
        setBookmarks([]);
        return;
      }

      const response = await fetch(`${BACKEND_API_URL}/api/bookmarks/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        setLoginRequired(true);
        setBookmarks([]);
        return;
      }

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
  }, [refreshing, authCtx]);

  useFocusEffect(
    useCallback(() => {
      fetchBookmarks();
    }, [fetchBookmarks])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookmarks();
  }, [fetchBookmarks]);

  const confirmRemoveBookmark = (bookmark: Bookmark) => {
    Alert.alert(
      "Remove Bookmark",
      `Are you sure you want to remove "${bookmark.place_name}" from your bookmarks?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => removeBookmark(bookmark.id) },
      ]
    );
  };

  const removeBookmark = async (bookmarkId: number) => {
    const originalBookmarks = [...bookmarks];
    setBookmarks(bookmarks.filter((b) => b.id !== bookmarkId));
    try {
      let token: string | null = null;
      if (authCtx.token) token = authCtx.token;
      else if (auth.currentUser) {
        try { token = await auth.currentUser.getIdToken(); } catch (err) { console.warn('Failed to get token', err); }
      }
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${BACKEND_API_URL}/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status !== 204) {
        Alert.alert('Error', 'Failed to remove bookmark. Please try again.');
        setBookmarks(originalBookmarks);
      }
    } catch {
      Alert.alert('Error', 'An error occurred while removing the bookmark.');
      setBookmarks(originalBookmarks);
    }
  };

  const handleNavigateToDetail = (bookmark: Bookmark) => {
    const placeData = {
      id: bookmark.place_id,
      placeId: bookmark.place_id,
      name: bookmark.place_name,
      address: bookmark.place_address,
      rating: bookmark.place_rating,
      image: bookmark.place_image,
      ...(bookmark.place_data || { types: [bookmark.place_type || ""] }),
    };

    router.push({
      pathname: "/dashboard/home/recommendations/placeDetail",
      params: {
        placeId: bookmark.place_id,
        placeName: bookmark.place_name,
        placeData: JSON.stringify(placeData),
      },
    });
  };

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const name = bookmark.place_name || "";
    const address = bookmark.place_address || "";
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || address.toLowerCase().includes(searchQuery.toLowerCase());
    const category = getCategory(bookmark.place_type);
    const matchesCategory = selectedCategory === "all" || category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryCount = (category: Category) => {
    if (category === "all") return bookmarks.length;
    return bookmarks.filter((b) => getCategory(b.place_type) === category).length;
  };

  const renderStars = (rating: number | null) => {
    if (rating === null || rating < 1) return <Text style={styles.noRatingText}>No rating</Text>;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <View style={styles.rating}>
        {Array.from({ length: fullStars }, (_, i) => <Ionicons key={`full-${i}`} name="star" style={styles.star} />)}
        {halfStar && <Ionicons key="half" name="star-half" style={styles.star} />}
        {Array.from({ length: emptyStars }, (_, i) => <Ionicons key={`empty-${i}`} name="star-outline" style={styles.star} />)}
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.messageText, { color: colors.text }]}>Loading Bookmarks...</Text>
        </View>
      );
    }
    if (loginRequired) {
      return <LoginRequiredView onLoginPress={() => router.replace("/auth/sign-in")} />;
    }
    if (error) {
      return (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="error-outline" size={48} color={COLORS.danger} />
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
          <MaterialIcons name="bookmark-border" size={60} color={colors.icon} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Bookmarks Yet</Text>
          <Text style={[styles.messageText, { color: colors.icon }]}>Tap the bookmark icon on a place to save it here.</Text>
        </View>
      );
    }
    if (filteredBookmarks.length === 0) {
      return (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="search-off" size={60} color={colors.icon} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Results Found</Text>
          <Text style={[styles.messageText, { color: colors.icon }]}>Try adjusting your search or filters.</Text>
        </View>
      );
    }
    return filteredBookmarks.map((bookmark) => (
      <TouchableOpacity key={bookmark.id} style={[styles.bookmarkCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={() => handleNavigateToDetail(bookmark)}>
        <Image source={{ uri: bookmark.place_image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=400&fit=crop" }} style={styles.bookmarkImage} />
        <View style={styles.cardContent}>
          <Text style={[styles.bookmarkName, { color: colors.text }]} numberOfLines={1}>{bookmark.place_name}</Text>
          <Text style={[styles.bookmarkLocation, { color: colors.icon }]} numberOfLines={1}>
            <Ionicons name="location-outline" size={14} color={colors.icon} />{" "}{bookmark.place_address || "No address"}
          </Text>
          <View style={styles.cardFooter}>
            {renderStars(bookmark.place_rating)}
            <TouchableOpacity style={[styles.removeButton, { backgroundColor: COLORS.dangerLight }]} onPress={() => confirmRemoveBookmark(bookmark)}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    ));
  };

  const CategoryButton = ({ name, value }: { name: string; value: Category }) => (
    <TouchableOpacity style={[styles.categoryButton, selectedCategory === value && styles.activeCategoryButton]} onPress={() => setSelectedCategory(value)}>
      <Text style={[styles.categoryButtonText, selectedCategory === value && styles.activeCategoryText]}>
        {name} ({getCategoryCount(value)})
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <Text style={[styles.title, { color: colors.text }]}>My Bookmarks</Text>
      </View>
      <View style={[styles.controlsContainer, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.secondary }]}>
          <Ionicons name="search" size={20} color={colors.icon} />
          <TextInput 
            style={[styles.searchInput, { color: colors.text }]} 
            placeholder="Search by name or address..." 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
            placeholderTextColor={colors.icon} 
          />
        </View>
        <View style={styles.categoryContainer}>
          <CategoryButton name="All" value="all" />
          <CategoryButton name="Attractions" value="attraction" />
          <CategoryButton name="Restaurants" value="restaurant" />
        </View>
      </View>
      <ScrollView 
        style={styles.bookmarksList} 
        contentContainerStyle={{ paddingBottom: 30, flexGrow: 1 }} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, backgroundColor: COLORS.white },
  title: { fontSize: 32, fontWeight: "bold", color: COLORS.dark },
  controlsContainer: { paddingHorizontal: 20, paddingBottom: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.lightGray, borderRadius: 12, paddingHorizontal: 16, height: 48, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.dark, marginLeft: 10 },
  categoryContainer: { flexDirection: "row", justifyContent: "space-around" },
  categoryButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: COLORS.lightGray },
  activeCategoryButton: { backgroundColor: COLORS.primaryLight },
  categoryButtonText: { color: COLORS.text, fontWeight: "600" },
  activeCategoryText: { color: COLORS.primary, fontWeight: "bold" },
  bookmarksList: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  bookmarkCard: { backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 20, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  bookmarkImage: { width: "100%", height: 160, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  cardContent: { padding: 16 },
  bookmarkName: { fontSize: 20, fontWeight: "bold", color: COLORS.dark, marginBottom: 6 },
  bookmarkLocation: { fontSize: 14, color: COLORS.text, marginBottom: 12, flexDirection: "row", alignItems: "center" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rating: { flexDirection: "row", alignItems: "center" },
  star: { fontSize: 18, color: COLORS.warning, marginRight: 2 },
  ratingText: { fontSize: 14, fontWeight: "600", color: COLORS.dark, marginLeft: 6 },
  noRatingText: { fontSize: 14, color: COLORS.gray, fontStyle: "italic" },
  removeButton: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.dangerLight },
  centeredContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  messageText: { marginTop: 12, fontSize: 16, color: COLORS.text, textAlign: "center", marginBottom: 24, lineHeight: 22 },
  emptyTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.dark, marginBottom: 8, textAlign: "center" },
  errorText: { color: COLORS.danger, fontSize: 16, textAlign: "center", marginBottom: 20, lineHeight: 22 },
  retryButton: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: COLORS.white, fontWeight: "600", fontSize: 16 },
  loginButton: { backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  loginButtonText: { color: COLORS.white, fontWeight: "bold", fontSize: 16 },
});