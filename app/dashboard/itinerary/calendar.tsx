import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { isSameDay, parse } from "date-fns";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import ItineraryModal from "../../../components/ItineraryModal";

const BACKEND_ITINERARY_API_URL = Platform.select({
  android: "http://10.0.2.2:8000/api/itineraries",
  ios: "http://localhost:8000/api/itineraries",
  default: "http://localhost:8000/api/itineraries",
});

const BACKEND_AUTH_API_URL = Platform.select({
  android: "http://10.0.2.2:8000/auth",
  ios: "http://localhost:8000/auth",
  default: "http://localhost:8000/auth",
});

type ScheduleItem = {
  place_id: string;
  place_name: string;
  place_type?: string;
  place_address?: string;
  place_rating?: number;
  place_image?: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
};

type Itinerary = {
  id: string;
  type: string;
  budget: string | null;
  name: string;
  startDate: Date;
  endDate: Date;
  schedule_items: ScheduleItem[];
};

export default function CalendarScreen() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [displayDate, setDisplayDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");

  const panY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        // Only respond to downward swipes
        return gestureState.dy > 0;
      },
      onPanResponderMove: Animated.event([null, { dy: panY }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(panY, {
            toValue: 500, // Moves it off-screen
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setModalVisible(false);
            // It's crucial to reset panY after the modal is hidden
            panY.setValue(0);
          });
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const today = new Date(displayDate);
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);

    const newWeekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });

    setWeekDates(newWeekDates);
  }, [displayDate]);

  // It is the key to fixing the bug on initial load.
  useEffect(() => {
    if (selectedItinerary) {
      // Normalize dates to compare days only, ignoring time.
      const selectedDay = new Date(selectedDate);
      selectedDay.setHours(0, 0, 0, 0);

      const itineraryStartDay = new Date(selectedItinerary.startDate);
      itineraryStartDay.setHours(0, 0, 0, 0);

      const itineraryEndDay = new Date(selectedItinerary.endDate);
      itineraryEndDay.setHours(0, 0, 0, 0);

      if (!(selectedDay >= itineraryStartDay && selectedDay <= itineraryEndDay)) {
        setSelectedDate(selectedItinerary.startDate);
        setDisplayDate(selectedItinerary.startDate);
      }
    }
    // We intentionally only listen to `selectedItinerary` changes. This ensures the hook
    // runs when the itinerary is first loaded or changed, but not when the user
    // is simply clicking different dates in the calendar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItinerary]);

  const fetchUserName = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) return;
      const response = await fetch(`${BACKEND_AUTH_API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const firstName = data.full_name ? data.full_name.split(" ")[0] : "User";
        setUserName(firstName);
      }
    } catch (err) {
      console.error("Failed to fetch user name:", err);
    }
  }, []);

  const fetchItineraries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) throw new Error("Authentication token not found");

      const response = await fetch(`${BACKEND_ITINERARY_API_URL}/`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server returned ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid response format");

      const fetchedItineraries: Itinerary[] = data.map((it: any) => ({
        id: it.id.toString(),
        type: it.type,
        budget: it.budget,
        name: it.name,
        startDate: new Date(it.start_date),
        endDate: new Date(it.end_date),
        schedule_items: (it.schedule_items || []).map((item: any) => ({
          ...item,
          scheduled_date: item.scheduled_date,
        })),
      }));

      setItineraries(fetchedItineraries);

      setSelectedItinerary((current) => {
        if (current) {
          const updated = fetchedItineraries.find((it) => it.id === current.id);
          return updated || (fetchedItineraries.length > 0 ? fetchedItineraries[0] : null);
        }
        return fetchedItineraries.length > 0 ? fetchedItineraries[0] : null;
      });

      return fetchedItineraries;
    } catch (err) {
      console.error("Error fetching itineraries:", err);
      setError(err instanceof Error ? err.message : "Failed to load itineraries");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        await Promise.all([fetchItineraries(), fetchUserName()]);
      };
      fetchData();
    }, [fetchItineraries, fetchUserName])
  );
  
  const handleCreateItinerary = (newItineraryFromResponse: any) => {
    setModalVisible(false);

    const newItineraryForState: Itinerary = {
      id: newItineraryFromResponse.id.toString(),
      name: newItineraryFromResponse.name,
      type: newItineraryFromResponse.type,
      budget: newItineraryFromResponse.budget,
      startDate: new Date(newItineraryFromResponse.start_date),
      endDate: new Date(newItineraryFromResponse.end_date),
      schedule_items: (newItineraryFromResponse.schedule_items || []).map((item: any) => ({
        ...item,
        scheduled_date: item.scheduled_date,
      })),
    };

    setItineraries(prev => [newItineraryForState, ...prev]);
    setSelectedItinerary(newItineraryForState);
    // These two lines are already correct, but our new useEffect would handle this anyway
    setSelectedDate(newItineraryForState.startDate);
    setDisplayDate(newItineraryForState.startDate);
  };

  const handlePreviousWeek = () => {
    setDisplayDate((current) => {
      const newDate = new Date(current);
      newDate.setDate(current.getDate() - 7);
      return newDate;
    });
  };

  const handleNextWeek = () => {
    setDisplayDate((current) => {
      const newDate = new Date(current);
      newDate.setDate(current.getDate() + 7);
      return newDate;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTimeOfDay = (date: Date) => {
    const hours = date.getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = 6 + i;
    const ampm = hour >= 12 ? "PM" : "AM";
    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;
    return `${displayHour.toString().padStart(2, "0")}:00 ${ampm}`;
  });

  const getScheduleItemsForTimeSlot = (timeSlot: string): ScheduleItem[] => {
    if (!selectedItinerary) return [];
    const [time, ampm] = timeSlot.split(" ");
    const [hourStr] = time.split(":");
    let hour = parseInt(hourStr, 10);
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;

    return selectedItinerary.schedule_items.filter((item) => {
      const itemDate = parse(item.scheduled_date, "yyyy-MM-dd", new Date());
      if (!isSameDay(itemDate, selectedDate)) return false;
      const [itemHour] = item.scheduled_time.split(":").map(Number);
      return itemHour === hour;
    });
  };

  const renderContent = () => {
    if (isLoading && itineraries.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading your itineraries...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => Promise.all([fetchItineraries(), fetchUserName()])}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {getTimeOfDay(currentTime)}, {userName}
          </Text>
          <View style={styles.headerRow}>
            <Text style={styles.date}>{formatDate(selectedDate)}</Text>
            {itineraries.length > 0 && (
              <View style={styles.itineraryPicker}>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  iconStyle={styles.iconStyle}
                  data={itineraries.map((it) => ({ label: it.name, value: it.id }))}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Itinerary"
                  value={selectedItinerary?.id}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => setIsDropdownOpen(false)}
                  onChange={(item) => {
                    const itinerary = itineraries.find((it) => it.id === item.value);
                    if (itinerary) {
                        setSelectedItinerary(itinerary);
                        // These updates are now technically redundant because of our new
                        // useEffect, but they make the UI feel faster on user interaction.
                        setSelectedDate(itinerary.startDate);
                        setDisplayDate(itinerary.startDate);
                    }
                  }}
                  renderRightIcon={() => (
                    <Text style={[styles.dropdownArrow, isDropdownOpen && styles.dropdownArrowOpen]}>▼</Text>
                  )}
                />
              </View>
            )}
          </View>
        </View>

        <View style={styles.calendarContainer}>
          <View style={styles.weekControlContainer}>
            <TouchableOpacity onPress={handlePreviousWeek} style={styles.navButton}>
              <Text style={styles.navButtonText}>{"<"}</Text>
            </TouchableOpacity>
            <View style={styles.datesRow}>
              {weekDates.map((date, index) => {
                const dayName = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
                const isSelected = isSameDay(date, selectedDate);
                const normalizedDate = new Date(date);
                normalizedDate.setHours(0, 0, 0, 0);
                
                const itineraryStartDate = selectedItinerary ? new Date(selectedItinerary.startDate) : null;
                if (itineraryStartDate) itineraryStartDate.setHours(0,0,0,0);
                
                const itineraryEndDate = selectedItinerary ? new Date(selectedItinerary.endDate) : null;
                if(itineraryEndDate) itineraryEndDate.setHours(0,0,0,0);

                const isWithinItinerary = selectedItinerary && 
                    normalizedDate >= itineraryStartDate! && 
                    normalizedDate <= itineraryEndDate!;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateCell,
                      isSelected && styles.selectedDateCell,
                      isWithinItinerary && !isSelected ? styles.itineraryDateCell : null,
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[styles.dayHeaderText, isSelected && styles.selectedDateNumber]}>{dayName}</Text>
                    <Text style={[styles.dateNumber, isSelected && styles.selectedDateNumber]}>{date.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity onPress={handleNextWeek} style={styles.navButton}>
              <Text style={styles.navButtonText}>{">"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {selectedItinerary ? (
          <View style={styles.timelineContainer}>
            <View style={styles.timelineHeader}>
              <Text style={styles.timelineTitle}>Timeline</Text>
            </View>
            {timeSlots.map((time) => {
              const scheduleItems = getScheduleItemsForTimeSlot(time);
              const formatTimeRange = (startTimeStr: string, duration: number) => {
                const [h, m] = startTimeStr.split(":").map(Number);
                const startDate = new Date();
                startDate.setHours(h, m, 0, 0);
                const endDate = new Date(startDate.getTime() + duration * 60000);
                const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return `Time: ${formatTime(startDate)} - ${formatTime(endDate)}`;
              };

              return (
                <View key={time} style={styles.timelineRow}>
                  <Text style={styles.timelineTime}>{time}</Text>
                  <View style={styles.timelineDivider}>
                    <View style={styles.timelineLine} />
                    <View style={styles.cardsContainer}>
                      {scheduleItems.map((item, itemIndex) => (
                        <View key={itemIndex} style={styles.scheduleItemCard}>
                          <Image
                            source={item.place_image ? { uri: item.place_image } : require("../../../assets/images/icon.png")}
                            style={styles.cardImage}
                          />
                          <View style={styles.cardContent}>
                            <Text style={styles.scheduleItemText} numberOfLines={1}>{item.place_name}</Text>
                            <Text style={styles.scheduleItemDetails}>{item.place_type || "Activity"}</Text>
                            <Text style={styles.scheduleItemTimeText}>
                              {formatTimeRange(item.scheduled_time, item.duration_minutes)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>It is empty now.</Text>
            <Text style={styles.emptySubtitle}>Create your first</Text>
            <Text style={styles.emptySubtitle}>itinerary</Text>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            // Reset the panY value just before showing the modal
            panY.setValue(0);
            setModalVisible(true);
          }}
          disabled={isLoading && itineraries.length === 0}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ItineraryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreateItinerary={handleCreateItinerary}
        panY={panY}
        panResponder={panResponder} 
        backendApiUrl={BACKEND_ITINERARY_API_URL}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, position: "relative" },
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { padding: 20, paddingBottom: 100, minHeight: '100%' },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, color: "#6B7280", fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { color: "#EF4444", fontSize: 16, textAlign: "center", marginBottom: 20 },
  retryButton: { backgroundColor: "#6366F1", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: "#FFFFFF", fontWeight: "bold" },
  header: { marginBottom: 30, paddingTop: Platform.OS === 'android' ? 20 : 0 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  greeting: { fontSize: 24, fontWeight: "bold", color: "#1F2937", marginBottom: 8 },
  date: { fontSize: 18, fontWeight: "500", color: "#6B7280" },
  itineraryPicker: { flexDirection: "row", alignItems: "center" },
  dropdown: { height: 40, width: 150, backgroundColor: "#6366F1", borderRadius: 8, paddingHorizontal: 12 },
  placeholderStyle: { fontSize: 16, color: "#FFFFFF" },
  selectedTextStyle: { fontSize: 16, color: "#FFFFFF" },
  iconStyle: { width: 20, height: 20 },
  dropdownArrow: { color: "#FFFFFF", fontSize: 16, marginLeft: 5 },
  dropdownArrowOpen: { transform: [{ rotate: "180deg" }] },
  calendarContainer: { marginBottom: 5 },
  weekControlContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navButton: { padding: 8 },
  navButtonText: { fontSize: 22, fontWeight: "bold", color: "#6366F1" },
  dayHeaderText: { fontSize: 12, fontWeight: "500", color: "#6B7280", textTransform: "uppercase", marginBottom: 6 },
  datesRow: { flexDirection: "row", justifyContent: "space-between", flex: 1, marginHorizontal: 5 },
  dateCell: { width: 42, height: 60, justifyContent: "center", alignItems: "center", borderRadius: 21 },
  selectedDateCell: { backgroundColor: "#6366F1" },
  dateNumber: { fontSize: 16, fontWeight: "500", color: "#1F2937" },
  selectedDateNumber: { color: "#FFFFFF", fontWeight: 'bold' },
  timelineContainer: { marginTop: 20 },
  timelineHeader: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E5E7EB", marginBottom: 10 },
  timelineTitle: { fontSize: 20, fontWeight: "bold", color: "#1F2937" },
  timelineRow: { flexDirection: "row", alignItems: "stretch", minHeight: 60 },
  timelineTime: { fontSize: 14, color: "#9CA3AF", width: 80, marginRight: 10, paddingTop: 5, textAlign: 'right' },
  timelineDivider: { flex: 1, position: "relative", paddingLeft: 15, borderLeftWidth: 2, borderLeftColor: '#E5E7EB' },
  timelineLine: {}, 
  emptyState: { alignItems: "center", flex: 1, justifyContent: "center", paddingBottom: 100 },
  emptyTitle: { fontSize: 16, color: "#9CA3AF", marginBottom: 16, textAlign: "center" },
  emptySubtitle: { fontSize: 36, color: "#1F2937", fontWeight: "bold", textAlign: "center", lineHeight: 40 },
  addButton: { position: "absolute", bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center", elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  addButtonText: { fontSize: 30, color: "#FFFFFF", fontWeight: "bold", marginBottom: 2 },
  itineraryDateCell: { backgroundColor: "rgba(99, 102, 241, 0.15)", borderRadius: 21 },
  scheduleItemCard: { backgroundColor: "#F9FAFB", borderRadius: 12, marginBottom: 15, width: "100%", overflow: "hidden", flexDirection: 'row', borderWidth: 1, borderColor: '#F3F4F6' },
  scheduleItemText: { fontSize: 16, fontWeight: "bold", color: "#1F2937", marginBottom: 4 },
  cardsContainer: { flex: 1, paddingLeft: 15, paddingTop: 5, paddingBottom: 5 },
  scheduleItemDetails: { fontSize: 14, color: "#6B7280", marginBottom: 8 },
  scheduleItemTimeText: { fontSize: 14, fontWeight: "bold", color: "#374151" },
  cardImage: { width: 90, height: '100%', backgroundColor: "#E5E7EB" },
  cardContent: { padding: 12, flex: 1, justifyContent: 'center' },
});