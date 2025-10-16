import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { MarkedDates } from "react-native-calendars/src/types";
import { SafeAreaView } from "react-native-safe-area-context";
import CategoryItem from "../../../components/CategoryItem";
import PopularDestinationCard from "../../../components/PopularDestinationCard";
import { useTheme } from "../../../context/ThemeContext";
import { API_URL } from "../../config";

interface Itinerary {
  id: number;
  start_date: string;
  end_date: string;
  name: string;
}
interface Place {
  id: string; name: string; rating: number; image?: string;
  address?: string; priceLevel?: number; isOpen?: boolean;
  types?: string[]; placeId: string;
}
interface NotificationStatus {
  id: number; is_read: boolean;
}

const getDatesInRange = (startDateStr: string, endDateStr: string): string[] => {
  const dates = [];
  let currentDate = new Date(`${startDateStr}T00:00:00Z`);
  const endDate = new Date(`${endDateStr}T00:00:00Z`);
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

export default function Dashboard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const todayDateString = new Date().toISOString().split("T")[0];

  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(todayDateString);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<Place[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [popularError, setPopularError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isGuest, setIsGuest] = useState(true);

  const fetchInitialData = useCallback(async () => {
    const token = await AsyncStorage.getItem("firebase_id_token");
    setIsGuest(!token);
    
    fetchItineraries(token);
    fetchUnreadCount(token);
    fetchPopularDestinations();
  }, []);

  const fetchItineraries = async (token: string | null) => {
    if (!token) { setItineraries([]); return; }
    try {
      const response = await fetch(`${API_URL}/api/itineraries/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch itineraries');
      const data: Itinerary[] = await response.json();
      setItineraries(data);
    } catch (error) {
      console.error("Error fetching itineraries:", error);
      setItineraries([]);
    }
  };

  const fetchPopularDestinations = useCallback(async () => {
    setIsLoadingPopular(true);
    setPopularError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") throw new Error("Permission to access location was denied.");
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;
      const response = await fetch(`${API_URL}/api/recommendations/popular?latitude=${latitude}&longitude=${longitude}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch popular destinations");
      }
      const data: Place[] = await response.json();
      setPopularDestinations(data);
    } catch (error) {
      console.error("Error fetching popular destinations:", error);
      setPopularDestinations([]);
    } finally {
      setIsLoadingPopular(false);
    }
  }, []);

  const fetchUnreadCount = async (token: string | null) => {
    if (!token) { setUnreadCount(0); return; }
    try {
      const response = await fetch(`${API_URL}/api/notifications/`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const notifications: NotificationStatus[] = await response.json();
        setUnreadCount(notifications.filter(n => !n.is_read).length);
      } else { setUnreadCount(0); }
    } catch (error) {
      console.error("Error fetching unread count:", error);
      setUnreadCount(0);
    }
  };

  useFocusEffect(useCallback(() => { fetchInitialData(); }, [fetchInitialData]));

  const markedDates = useMemo(() => {
    const newMarkedDates: MarkedDates = {};
    itineraries.forEach(({ start_date, end_date }) => {
      const datesInRange = getDatesInRange(start_date, end_date);
      if (datesInRange.length === 0) return;
      datesInRange.forEach((date, index) => {
        const isSingleDay = datesInRange.length === 1;
        const isStartingDay = index === 0;
        const isEndingDay = index === datesInRange.length - 1;
        
        // --- START OF THE FIX ---
        newMarkedDates[date] = {
          color: colors.primary,   // Use the main primary color for the background
          textColor: 'white',      // Always use white text for high contrast on the primary color
          startingDay: isSingleDay || isStartingDay,
          endingDay: isSingleDay || isEndingDay,
        };
        // --- END OF THE FIX ---
      });
    });
    return newMarkedDates;
  }, [itineraries, colors]);

  const calendarTheme = useMemo(() => ({
    backgroundColor: colors.card,
    calendarBackground: colors.card,
    textSectionTitleColor: colors.icon,
    todayTextColor: colors.primary,
    dayTextColor: colors.text,
    textDisabledColor: colors.icon,
    arrowColor: colors.primary,
    monthTextColor: colors.text,
    textDayFontWeight: '500',
    textMonthFontWeight: "bold",
    textDayHeaderFontWeight: '600',
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 14,
  }), [colors]);

  const handlePlacePress = (place: Place) => {
    router.push({
      pathname: "/dashboard/home/recommendations/placeDetail",
      params: { placeId: place.id, placeData: JSON.stringify(place) },
    });
  };
  
  const renderPopularDestinations = () => {
    if (isLoadingPopular) {
        return (
            <View style={styles.popularLoader}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        )
    }
    if (popularError) {
      return (
        <View style={styles.popularErrorContainer}>
          <Text style={styles.popularErrorText}>{popularError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPopularDestinations}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (popularDestinations.length === 0) {
        return <Text style={[styles.emptyText, { color: colors.icon }]}>No popular destinations found nearby.</Text>
    }
    return (
      <FlatList
        data={popularDestinations}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.popularList}
        renderItem={({ item }) => (
          <PopularDestinationCard
            name={item.name}
            image={item.image ?? null}
            rating={item.rating}
            onPress={() => handlePlacePress(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
            <Text style={[styles.greeting, { color: colors.text }]}>InTra</Text>
            {!isGuest && (
              <TouchableOpacity
                onPress={() => router.push("/dashboard/notifications")}
                style={styles.notificationButton}
              >
                <Ionicons name="notifications-outline" size={26} color={colors.icon} />
                {unreadCount > 0 && (
                  <View style={[styles.notificationBadge, { borderColor: colors.background }]}>
                    <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
        </View>

        <View style={[styles.calendarWrapper, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Calendar
            key={isDark ? 'dark-calendar' : 'light-calendar'}
            current={currentCalendarMonth}
            markedDates={markedDates}
            markingType={"period"}
            onMonthChange={(month) => setCurrentCalendarMonth(month.dateString)}
            theme={calendarTheme}
            style={styles.calendar}
            hideExtraDays={true}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
          <View style={styles.categoriesContainer}>
            <CategoryItem
              title="Attractions"
              image={require("../../../assets/images/attraction.jpg")}
              onPress={() => router.push("/dashboard/home/recommendations/attractions")}
            />
            <CategoryItem
              title="Restaurants"
              image={require("../../../assets/images/restaurant.jpg")}
              onPress={() => router.push("/dashboard/home/recommendations/restaurants")}
            />
          </View>
        </View>

        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Near You</Text>
            </View>
          {renderPopularDestinations()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: { fontSize: 28, fontWeight: 'bold' },
  notificationButton: { padding: 4 },
  notificationBadge: {
    position: 'absolute', right: 0, top: 0, backgroundColor: '#EF4444',
    borderRadius: 9, width: 18, height: 18, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1.5,
  },
  notificationBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  calendarWrapper: {
    borderRadius: 16,
    padding: 8,
    marginBottom: 30,
    borderWidth: 1,
    shadowColor: "#4A5568",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  calendar: { borderRadius: 12 },
  section: { marginBottom: 30 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  categoriesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  popularList: { paddingHorizontal: 2, paddingBottom: 5 },
  popularLoader: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  popularErrorContainer: {
    height: 180, justifyContent: "center", alignItems: "center",
    backgroundColor: '#FFFBEB', borderRadius: 12, padding: 16,
  },
  popularErrorText: { color: '#B45309', textAlign: 'center', marginBottom: 16, fontSize: 14, },
  retryButton: { backgroundColor: '#6366F1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 },
  retryButtonText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { padding: 20, textAlign: 'center' },
});