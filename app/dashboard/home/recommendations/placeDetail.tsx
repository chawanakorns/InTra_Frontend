import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import ImageViewer from "react-native-image-zoom-viewer";
import { useTheme } from "../../../../context/ThemeContext";
import { API_URL } from "../../../config";

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
};

interface Itinerary {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
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

interface PlaceDetails extends Place {
  description: string;
  images?: string[];
}

const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function PlaceDetail() {
  const { placeId, origin } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  
  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState("12:00");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<number | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isImageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchPlaceDetails = useCallback(async () => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`${API_URL}/api/recommendations/place/${placeId}/details`);
      if (!response.ok) throw new Error("Failed to load place details.");
      const data: PlaceDetails = await response.json();
      setPlace(data);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not load place information.");
    } finally {
      setLoadingDetails(false);
      setRefreshing(false);
    }
  }, [placeId]);

  const openImageViewer = (index: number) => {
    setCurrentImageIndex(index + 1);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
  };


  const checkUserAndBookmarkStatus = useCallback(async () => {
    setCheckingStatus(true);
    const token = await AsyncStorage.getItem("firebase_id_token");

    if (!token) {
      setIsLoggedIn(false);
      setIsBookmarked(false);
      setCheckingStatus(false);
      return;
    }

    setIsLoggedIn(true);
    try {
      const response = await fetch(`${API_URL}/api/bookmarks/check/${placeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.is_bookmarked);
        setBookmarkId(data.bookmark_id);
      } else {
        setIsBookmarked(false);
      }
    } catch (e) {
      setIsBookmarked(false);
    } finally {
      setCheckingStatus(false);
    }
  }, [placeId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlaceDetails();
    checkUserAndBookmarkStatus();
  }, [fetchPlaceDetails, checkUserAndBookmarkStatus]);

  useEffect(() => {
    fetchPlaceDetails();
    checkUserAndBookmarkStatus();
  }, [fetchPlaceDetails, checkUserAndBookmarkStatus]);
  
  const toggleBookmark = async () => {
    if (!isLoggedIn || !place) {
      Alert.alert("Login Required", "You must be logged in to bookmark places.");
      return;
    }
    setCheckingStatus(true);
    const token = await AsyncStorage.getItem("firebase_id_token");
    try {
      if (isBookmarked && bookmarkId) {
        const response = await fetch(`${API_URL}/api/bookmarks/${bookmarkId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.status === 204) {
          setIsBookmarked(false);
          setBookmarkId(null);
        }
      } else {
        const bookmarkData = {
          place_id: place.id,
          place_name: place.name,
          place_type: place.types ? place.types[0] : null,
          place_address: place.address,
          place_rating: place.rating,
          place_image: place.image,
        };
        const response = await fetch(`${API_URL}/api/bookmarks/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(bookmarkData),
        });
        const result = await response.json();
        if (response.ok) {
          setIsBookmarked(true);
          setBookmarkId(result.id);
        }
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred.");
    } finally {
      setCheckingStatus(false);
    }
  };

  const fetchItineraries = useCallback(async () => {
    try {
      setLoadingModal(true);
      setError(null);
      const token = await AsyncStorage.getItem("firebase_id_token");
      if (!token) throw new Error("Authentication required");
      const response = await fetch(`${API_URL}/api/itineraries/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch itineraries");
      const data = await response.json();
      setItineraries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load itineraries");
    } finally {
      setLoadingModal(false);
    }
  }, []);

  useEffect(() => {
    if (showItineraryModal) fetchItineraries();
  }, [showItineraryModal, fetchItineraries]);
  
  const handleAddToItinerary = async () => {
    if (!selectedItinerary || !place) return;
    setLoadingModal(true);
    try {
      const token = await AsyncStorage.getItem('firebase_id_token');
      if (!token) throw new Error('Authentication required');

      const scheduleItem = {
        place_id: place.placeId,
        place_name: place.name,
        description: place.description || null,
        place_type: place.types ? place.types[0] : null,
        place_address: place.address || null,
        place_rating: place.rating || null,
        place_image: place.image || null,
        scheduled_date: formatDateToYYYYMMDD(date),
        scheduled_time: time,
        duration_minutes: 60,
      };

      const response = await fetch(`${API_URL}/api/itineraries/${selectedItinerary.id}/items`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleItem),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to add item to itinerary");
      }

      Alert.alert("Success", `Added to ${selectedItinerary.name}!`, [{ text: "OK", onPress: () => router.push("/dashboard/home") }]);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoadingModal(false);
      setShowItineraryModal(false);
    }
  };

  if (loadingDetails) {
    return (
      <View style={[styles.fullScreenLoader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Loading Details...</Text>
      </View>
    );
  }
  if (!place) {
    return (
      <View style={[styles.fullScreenLoader, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Could not load place information.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, marginTop: 20 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
        <ImageBackground source={{ uri: place.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop' }} style={styles.imageBackground}>
          <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']} style={styles.gradientOverlay}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => { if (origin === 'home') router.push('/dashboard/home'); else router.back(); }} style={styles.headerButton}>
                <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              {isLoggedIn && (
                <TouchableOpacity onPress={toggleBookmark} style={styles.headerButton} disabled={checkingStatus}>
                  {checkingStatus ? <ActivityIndicator size="small" color="#FFFFFF" /> : <FontAwesome name={isBookmarked ? 'bookmark' : 'bookmark-o'} size={24} color="#FFFFFF" />}
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.imageTextContainer}>
              <Text style={styles.placeType}>{place.types?.includes('restaurant') ? 'Restaurant' : 'Attraction'}</Text>
              <Text style={styles.placeName}>{place.name}</Text>
            </View>
          </LinearGradient>
        </ImageBackground>
        
        <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
          <View style={styles.detailsRow}>
            {place.rating && (<View style={[styles.detailBox, { backgroundColor: colors.secondary }]}><Ionicons name="star" size={20} color={colors.primary} /><Text style={[styles.detailText, { color: colors.primary }]}>{place.rating} / 5</Text></View>)}
            {place.isOpen !== undefined && (<View style={[styles.detailBox, { backgroundColor: colors.secondary }]}><Ionicons name="time-outline" size={20} color={colors.primary} /><Text style={[styles.detailText, { color: colors.primary }]}>{place.isOpen ? 'Open Now' : 'Closed'}</Text></View>)}
          </View>

          {place.images && place.images.length > 1 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>More Images</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {place.images.slice(1).map((url, index) => (
                  <TouchableOpacity key={index} onPress={() => openImageViewer(index)}>
                    <Image source={{ uri: url }} style={styles.galleryImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {place.address && (
            <View style={[styles.addressSection, { backgroundColor: colors.secondary }]}>
              <Ionicons name="location-outline" size={22} color={colors.primary} style={{marginRight: 12}}/>
              <Text style={[styles.addressText, { color: colors.text }]}>{place.address}</Text>
            </View>
          )}
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.descriptionText, { color: colors.icon }]}>{place.description}</Text>
          </View>
        </View>
      </ScrollView>

      {isLoggedIn && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setShowItineraryModal(true)} disabled={loadingModal}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.fabText}>Add to Itinerary</Text>
        </TouchableOpacity>
      )}

      {showItineraryModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add to Itinerary</Text>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Select Itinerary</Text>
              {loadingModal ? (<View style={styles.loadingContainer}><ActivityIndicator size="small" color={colors.primary} /></View>) 
                : error ? (<View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text><TouchableOpacity style={styles.retryButton} onPress={fetchItineraries}><Text style={styles.retryButtonText}>Try Again</Text></TouchableOpacity></View>) 
                : itineraries.length > 0 ? (
                  <ScrollView style={[styles.dropdownContainer, { borderColor: colors.cardBorder }]}>
                    {itineraries.map((itinerary) => (
                      <TouchableOpacity key={itinerary.id} style={[ styles.itineraryOption, selectedItinerary?.id === itinerary.id && { backgroundColor: colors.secondary }, { borderBottomColor: colors.cardBorder } ]} onPress={() => setSelectedItinerary(itinerary)}>
                        <Text style={[styles.itineraryName, { color: colors.text }]}>{itinerary.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (<Text style={[styles.noItinerariesText, { color: colors.icon }]}>No itineraries found. Create one first.</Text>)
              }
            </View>
            {selectedItinerary && (
              <>
                <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.text }]}>Date</Text>
                    <TouchableOpacity style={[styles.dateInput, { backgroundColor: colors.secondary }]} onPress={() => setShowDatePicker(true)}>
                        <Text style={{ color: colors.text }}>{formatDateToYYYYMMDD(date)}</Text>
                    </TouchableOpacity>
                    {showDatePicker && (<DateTimePicker value={date} mode="date" display="default" onChange={(event: any, selectedDate?: Date) => { setShowDatePicker(Platform.OS === 'ios'); if (selectedDate) setDate(selectedDate); }} minimumDate={new Date(selectedItinerary.start_date)} maximumDate={new Date(selectedItinerary.end_date)} />)}
                </View>
                <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.text }]}>Time</Text>
                    <TouchableOpacity style={[styles.dateInput, { backgroundColor: colors.secondary }]} onPress={() => setShowTimePicker(true)}>
                        <Text style={{ color: colors.text }}>{time}</Text>
                    </TouchableOpacity>
                    {showTimePicker && (<DateTimePicker value={new Date()} mode="time" display="default" onChange={(event: any, selectedDate?: Date) => { setShowTimePicker(Platform.OS === 'ios'); if (selectedDate) { const hours = selectedDate.getHours().toString().padStart(2, '0'); const minutes = selectedDate.getMinutes().toString().padStart(2, '0'); setTime(`${hours}:${minutes}`); } }} />)}
                </View>
              </>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.secondary }]} onPress={() => setShowItineraryModal(false)}>
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton, (!selectedItinerary || loadingModal) && styles.disabledButton, { backgroundColor: colors.primary }]} onPress={handleAddToItinerary} disabled={!selectedItinerary || loadingModal}>
                {loadingModal ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmButtonText}>Add</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      {place?.images && (
        <Modal visible={isImageViewerVisible} transparent={true} onRequestClose={closeImageViewer}>
          <ImageViewer imageUrls={place.images.map((url) => ({ url }))} index={currentImageIndex} onCancel={closeImageViewer} enableSwipeDown renderHeader={() => (
              <TouchableOpacity style={styles.closeButton} onPress={closeImageViewer}>
                <MaterialIcons name="close" size={30} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          />
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  fullScreenLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  imageBackground: { width: "100%", height: 350, justifyContent: "space-between" },
  gradientOverlay: { flex: 1, paddingTop: Platform.OS === "android" ? 40 : 50, paddingBottom: 40, paddingHorizontal: 20, justifyContent: "space-between" },
  header: { flexDirection: "row", justifyContent: "space-between" },
  headerButton: { backgroundColor: "rgba(0,0,0,0.4)", width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  imageTextContainer: {},
  placeType: { color: COLORS.lightGray, fontSize: 16, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  placeName: { color: COLORS.white, fontSize: 32, fontWeight: "bold", lineHeight: 38 },
  contentContainer: { padding: 20, paddingBottom: 100, backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -20 },
  detailsRow: { flexDirection: "row", gap: 16, marginBottom: 24 },
  detailBox: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primaryLight, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, gap: 8 },
  detailText: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
  addressSection: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: COLORS.lightGray, borderRadius: 12, marginBottom: 24 },
  addressText: { flex: 1, fontSize: 16, color: COLORS.text, lineHeight: 22 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.dark, marginBottom: 12 },
  descriptionText: { fontSize: 16, lineHeight: 26, color: COLORS.text },
  galleryImage: {
    width: 160,
    height: 120,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
  },
  // <-- THE FIX 7: Add style for the close button in the image viewer -->
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: { position: "absolute", bottom: 30, right: 20, backgroundColor: COLORS.primary, borderRadius: 30, height: 56, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
  fabText: { color: COLORS.white, fontSize: 16, fontWeight: "bold", marginLeft: 8 },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", justifyContent: "center", alignItems: "center" },
  modalContainer: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, width: "90%", maxHeight: "85%" },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.dark, marginBottom: 24, textAlign: "center" },
  formGroup: { marginBottom: 20 },
  formLabel: { fontSize: 16, fontWeight: "600", color: COLORS.text, marginBottom: 8 },
  dropdownContainer: { maxHeight: 200, borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8 },
  itineraryOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  selectedItinerary: { backgroundColor: COLORS.primaryLight },
  itineraryName: { fontSize: 16, fontWeight: "600", color: COLORS.dark },
  noItinerariesText: { textAlign: "center", color: COLORS.gray, padding: 20 },
  loadingContainer: { height: 100, justifyContent: "center", alignItems: "center" },
  errorContainer: { backgroundColor: COLORS.dangerLight, padding: 16, borderRadius: 8, alignItems: "center" },
  errorText: { color: COLORS.danger, textAlign: "center", marginBottom: 12 },
  retryButton: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  retryButtonText: { color: COLORS.white, fontWeight: "600" },
  dateInput: { borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 14, backgroundColor: COLORS.lightGray, justifyContent: 'center' },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, gap: 12 },
  modalButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: "center" },
  cancelButton: { backgroundColor: COLORS.lightGray },
  cancelButtonText: { color: COLORS.text, fontWeight: "bold", fontSize: 16 },
  confirmButton: { backgroundColor: COLORS.primary },
  confirmButtonText: { color: COLORS.white, fontWeight: "bold", fontSize: 16 },
  disabledButton: { opacity: 0.5 },
  durationInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 8,
  },
});