import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { MarkedDates } from "react-native-calendars/src/types";
import { SafeAreaView } from "react-native-safe-area-context";
import CategoryItem from "../../../components/CategoryItem";
import PopularDestinationCard from "../../../components/PopularDestinationCard";
import { API_URL } from "../../config";

interface Itinerary {
  id: number;
  start_date: string;
  end_date: string;
  name: string;
}

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

const isDateInCurrentMonth = (
  dateStr: string,
  currentMonthStr: string
): boolean => {
  return dateStr.substring(0, 7) === currentMonthStr.substring(0, 7);
};

export default function Dashboard() {
  const router = useRouter();
  const todayDateString = new Date().toISOString().split("T")[0];

  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);
  const [currentCalendarMonth, setCurrentCalendarMonth] =
    useState(todayDateString);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<Place[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);

  const fetchItineraries = useCallback(async () => {
    setIsLoadingCalendar(true);
    try {
      // --- THE FIX: Use the correct Firebase token key ---
      const token = await AsyncStorage.getItem("firebase_id_token");
      
      if (!token) {
        // If no token, user is not logged in. Don't fetch itineraries.
        setItineraries([]);
        return;
      }

      const itinerariesResponse = await fetch(`${API_URL}/api/itineraries/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!itinerariesResponse.ok) {
        // Handle cases like expired token by clearing itineraries
        setItineraries([]);
        return;
      }

      const fetchedItineraries: Itinerary[] = await itinerariesResponse.json();
      setItineraries(fetchedItineraries);
    } catch (error) {
      console.error("Error fetching itineraries:", error);
      setItineraries([]); // Clear itineraries on error
    } finally {
      setIsLoadingCalendar(false);
    }
  }, []);

  const fetchPopularDestinations = useCallback(async () => {
    setIsLoadingPopular(true);
    try {
      const popularResponse = await fetch(
        `${API_URL}/api/recommendations/popular`
      );
      if (!popularResponse.ok)
        throw new Error("Failed to fetch popular destinations");
      const fetchedPopular: Place[] = await popularResponse.json();
      setPopularDestinations(fetchedPopular);
    } catch (error) {
      console.error("Error fetching popular destinations:", error);
      setPopularDestinations([]);
    } finally {
      setIsLoadingPopular(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchItineraries();
      fetchPopularDestinations();
    }, [fetchItineraries, fetchPopularDestinations])
  );

  const markedDates = useMemo(() => {
    const newMarkedDates: MarkedDates = {};
    const baseColor = "#6366F1";
    const lighterColor = "#A5B4FC";

    itineraries.forEach(({ start_date, end_date }) => {
      const datesInRange = getDatesInRange(start_date, end_date);
      if (datesInRange.length === 0) return;

      datesInRange.forEach((date, index) => {
        const isInCurrentMonth = isDateInCurrentMonth(
          date,
          currentCalendarMonth
        );
        const color = isInCurrentMonth ? baseColor : lighterColor;
        const marking: any = { color: color, textColor: "white" };

        if (datesInRange.length === 1) {
          marking.startingDay = true;
          marking.endingDay = true;
        } else if (index === 0) {
          marking.startingDay = true;
        } else if (index === datesInRange.length - 1) {
          marking.endingDay = true;
        }
        // NOTE: The original code had `disableTouchEvent`, which is often better handled
        // by the calendar's period markingType itself. Keeping it simple.
        newMarkedDates[date] = marking;
      });
    });
    return newMarkedDates;
  }, [itineraries, currentCalendarMonth]);

  const handleMonthChange = (month: DateData) => {
    setCurrentCalendarMonth(month.dateString);
  };

  const handlePlacePress = (place: Place) => {
    router.push({
      pathname: "/dashboard/home/recommendations/placeDetail",
      params: {
        placeId: place.id,
        placeName: place.name,
        placeData: JSON.stringify(place),
        origin: "home",
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>InTra</Text>
          <View style={styles.headerRight}>
            <View style={styles.dateContainer}>
              <Text style={styles.day}>{new Date().getDate()}</Text>
              <View>
                <Text style={styles.month}>
                  {new Date().toLocaleString("default", { month: "short" })}
                </Text>
                <Text style={styles.year}>{new Date().getFullYear()}</Text>
              </View>
            </View>
          </View>
        </View>

        {isLoadingCalendar ? (
          <View style={styles.calendarLoader}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : (
          <Calendar
            key={currentCalendarMonth}
            current={currentCalendarMonth}
            markedDates={markedDates}
            markingType={"period"}
            onMonthChange={handleMonthChange}
            theme={{
              backgroundColor: "#ffffff",
              calendarBackground: "#ffffff",
              textSectionTitleColor: "#b6c1cd",
              selectedDayBackgroundColor: "#6366F1",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#6366F1",
              dayTextColor: "#2d4150",
              textDisabledColor: "#d9e1e8",
              arrowColor: "#6366F1",
              monthTextColor: "#2d4150",
              textDayFontWeight: "300",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "300",
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
          />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesContainer}>
            <CategoryItem
              title="Attractions"
              image={require("../../../assets/images/attraction.jpg")}
              onPress={() =>
                router.push("/dashboard/home/recommendations/attractions")
              }
            />
            <CategoryItem
              title="Restaurants"
              image={require("../../../assets/images/restaurant.jpg")}
              onPress={() =>
                router.push("/dashboard/home/recommendations/restaurants")
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Destinations</Text>
          {isLoadingPopular ? (
            <View style={styles.popularLoader}>
              <ActivityIndicator size="large" color="#6366F1" />
            </View>
          ) : (
            <FlatList
              data={popularDestinations}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularList}
              renderItem={({ item }) => (
                <View style={styles.popularItem}>
                  <PopularDestinationCard
                    name={item.name}
                    image={item.image ?? null}
                    rating={item.rating}
                    onPress={() => handlePlacePress(item)}
                  />
                </View>
              )}
              keyExtractor={(item) => item.id}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  dateContainer: { flexDirection: "row", alignItems: "center", marginRight: 12 },
  day: { fontSize: 32, fontWeight: "bold", marginRight: 8 },
  month: { fontSize: 16, fontWeight: "bold" },
  year: { fontSize: 14, color: "#666" },
  calendar: { borderRadius: 10, elevation: 0, shadowOpacity: 0, borderWidth: 0, marginBottom: 10 },
  calendarLoader: { height: 370, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  section: { marginTop: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
  categoriesContainer: { flexDirection: "row", justifyContent: "space-between" },
  popularList: { paddingBottom: 10, paddingLeft: 4 },
  popularItem: { marginRight: 16 },
  popularLoader: { height: 220, justifyContent: "center", alignItems: "center" },
});