import AsyncStorage from "@react-native-async-storage/async-storage";
import { isSameDay, parse } from 'date-fns';
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import ItineraryModal from "../../../components/ItineraryModal";

const BACKEND_API_URL = Platform.select({
  android: "http://10.0.2.2:8000/api/itineraries",
  ios: "http://localhost:8000/api/itineraries",
  default: "http://localhost:8000/api/itineraries",
});

type ScheduleItem = {
  place_id: string;
  place_name: string;
  place_type?: string;
  place_address?: string;
  place_rating?: number;
  place_image?: string;
  scheduled_date: string; // Keep as string, format: "YYYY-MM-DD"
  scheduled_time: string;
  duration_minutes: number;
};

type Itinerary = {
  id: string;
  type: string;
  budget: string;
  name: string;
  startDate: Date;
  endDate: Date;
  schedule_items: ScheduleItem[];
};

export default function CalendarScreen() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingItinerary, setCreatingItinerary] = useState(false);

  const panY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_: any, gestureState: { dy: number }) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (
        _: any,
        gestureState: { dy: number; vy: number }
      ) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(panY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setModalVisible(false));
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const resetModal = () => {
    panY.setValue(0);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);

    const initialWeekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });

    setWeekDates(initialWeekDates);
    return () => clearInterval(timer);
  }, []);

  const fetchItineraries = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${BACKEND_API_URL}/`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server returned ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid response format - expected array");
      }

      const fetchedItineraries = data.map((it: any) => ({
        id: it.id.toString(),
        type: it.type,
        budget: it.budget,
        name: it.name,
        startDate: new Date(it.start_date),
        endDate: new Date(it.end_date),
        schedule_items: it.schedule_items || [], // Ensure schedule_items is always an array
      }));

      setItineraries(fetchedItineraries);

      if (fetchedItineraries.length > 0 && !selectedItinerary) {
        setSelectedItinerary(fetchedItineraries[0]);
      }
    } catch (err) {
      console.error("Error fetching itineraries:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load itineraries"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItineraries();
  }, []);

  const handleCreateItinerary = async (newItinerary: Itinerary) => {
    try {
      // Optimistically update the state
      setItineraries([...itineraries, newItinerary]);
      setSelectedItinerary(newItinerary);
      setModalVisible(false);
    } catch (err) {
      console.error("[Error] Create itinerary failed:", err);
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to create itinerary"
      );
    }
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
    if (hours < 12) return "Morning";
    if (hours < 17) return "Afternoon";
    return "Evening";
  };

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 6 + i;
    return `${hour.toString().padStart(2, "0")}:00 ${
      hour < 12 ? "AM" : hour === 12 ? "PM" : "PM"
    }`;
  });

  const getScheduleItemsForTimeSlot = (timeSlot: string): ScheduleItem[] => {
    if (!selectedItinerary) return [];
  
    const [time, ampm] = timeSlot.split(' ');
    const [hourStr] = time.split(':');
    let hour = parseInt(hourStr, 10);
  
    if (ampm === 'PM' && hour !== 12) {
      hour += 12;
    } else if (ampm === 'AM' && hour === 12) {
      hour = 0; // Midnight
    }
  
    return selectedItinerary.schedule_items.filter(item => {
      const itemDate = parse(item.scheduled_date, 'yyyy-MM-dd', new Date());
      if (!isSameDay(itemDate, selectedDate)) {
        return false;
      }
  
      const [itemHour] = item.scheduled_time.split(':').map(Number);
      return itemHour === hour;
    });
  };

  const renderContent = () => {
    if (isLoading) {
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
            onPress={fetchItineraries}
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
            Good {getTimeOfDay(currentTime)}, User
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
                  data={itineraries.map((it) => ({
                    label: it.name || "Itinerary",
                    value: it.id,
                  }))}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Itinerary"
                  value={selectedItinerary?.id}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => setIsDropdownOpen(false)}
                  onChange={(item) => {
                    const itinerary = itineraries.find(
                      (it) => it.id === item.value
                    );
                    setSelectedItinerary(itinerary ?? null);
                  }}
                  renderRightIcon={() => (
                    <Text
                      style={[
                        styles.dropdownArrow,
                        isDropdownOpen && styles.dropdownArrowOpen,
                      ]}
                    >
                      ▼
                    </Text>
                  )}
                />
              </View>
            )}
          </View>
        </View>

        <View style={styles.calendarContainer}>
          <View style={styles.dayHeaders}>
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
              <View key={day} style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
          </View>
          <View style={styles.datesRow}>
            {weekDates.map((date, index) => {
              const normalizedDate = new Date(date);
              normalizedDate.setHours(0, 0, 0, 0);

              const normalizedEndDate = new Date(selectedItinerary?.endDate || new Date());
              normalizedEndDate.setHours(0, 0, 0, 0);

              const normalizedStartDate = new Date(selectedItinerary?.startDate || new Date());
              normalizedStartDate.setHours(0, 0, 0, 0);


              const isWithinItinerary = selectedItinerary &&
                  normalizedDate >= normalizedStartDate &&
                  normalizedDate <= normalizedEndDate;

              return (
                  <TouchableOpacity
                      key={index}
                      style={[
                          styles.dateCell,
                          date.toDateString() === selectedDate.toDateString() &&
                          styles.selectedDateCell,
                          isWithinItinerary ? styles.itineraryDateCell : null,
                      ]}
                      onPress={() => setSelectedDate(date)}
                  >
                      <Text
                          style={[
                              styles.dateNumber,
                              date.toDateString() === selectedDate.toDateString() &&
                              styles.selectedDateNumber,
                              isWithinItinerary ? styles.itineraryDateNumber : null,
                          ]}
                      >
                          {date.getDate()}
                      </Text>
                  </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedItinerary ? (
          <View style={styles.timelineContainer}>
            <View style={styles.timelineHeader}>
              <Text style={styles.timelineTitle}>Timeline</Text>
            </View>
            {timeSlots.map((time, index) => {
              const scheduleItems = getScheduleItemsForTimeSlot(time);

              return (
                <View key={time} style={styles.timelineRow}>
                  <Text style={styles.timelineTime}>{time}</Text>
                  <View style={styles.timelineDivider}>
                    <View style={styles.timelineLine} />
                    <View style={styles.cardsContainer}>
                      {scheduleItems.map((item, itemIndex) => {
                        const formatScheduleTime = (timeStr: string) => {
                          const [h, m] = timeStr.split(":");
                          const hour = parseInt(h, 10);
                          const ampm = hour >= 12 ? "PM" : "AM";
                          const formattedHour = hour % 12 || 12;
                          return `${formattedHour}:${m} ${ampm}`;
                        };

                        return (
                          <View
                            key={itemIndex}
                            style={styles.scheduleItemCard}
                          >
                            <View>
                              <Text style={styles.scheduleItemText}>
                                {item.place_name}
                              </Text>
                              <Text style={styles.scheduleItemDetails}>
                                {item.place_type || "Scheduled Activity"}
                              </Text>
                            </View>
                            <Text style={styles.scheduleItemTimeText}>
                              {formatScheduleTime(item.scheduled_time)}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>It is empty now.</Text>
            <Text style={styles.emptySubtitle}>Enter your first</Text>
            <Text style={styles.emptySubtitle}>itinerary</Text>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={styles.safeArea}>
        {selectedItinerary ? (
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {renderContent()}
          </ScrollView>
        ) : (
          <View style={styles.container}>{renderContent()}</View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={async () => {
            resetModal();
            setModalVisible(true);
          }}
          disabled={isLoading}
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
        backendApiUrl={BACKEND_API_URL}
      />
    </View>
  );
}

interface Styles {
  screenContainer: any;
  safeArea: any;
  container: any;
  loadingContainer: any;
  loadingText: any;
  errorContainer: any;
  errorText: any;
  retryButton: any;
  retryButtonText: any;
  header: any;
  headerRow: any;
  greeting: any;
  date: any;
  itineraryPicker: any;
  dropdown: any;
  placeholderStyle: any;
  selectedTextStyle: any;
  iconStyle: any;
  dropdownArrow: any;
  dropdownArrowOpen: any;
  calendarContainer: any;
  dayHeaders: any;
  dayHeaderCell: any;
  dayHeaderText: any;
  datesRow: any;
  dateCell: any;
  selectedDateCell: any;
  dateNumber: any;
  selectedDateNumber: any;
  timelineContainer: any;
  timelineHeader: any;
  timelineTitle: any;
  timelineRow: any;
  timelineTime: any;
  timelineDivider: any;
  timelineLine: any;
  emptyState: any;
  emptyTitle: any;
  emptySubtitle: any;
  addButton: any;
  addButtonText: any;
  itineraryDateCell: any;
  itineraryDateNumber: any;
  scheduleItemCard: any;
  scheduleItemText: any;
  cardsContainer: any;
  scheduleItemDetails: any;
  scheduleItemTimeText: any;
}

const styles = StyleSheet.create<Styles>({
  screenContainer: {
    flex: 1,
    position: "relative",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    padding: 20,
    paddingBottom: 100,
    minHeight: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#6B7280",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  header: {
    marginBottom: 30,
    paddingTop: 40,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  date: {
    fontSize: 18,
    fontWeight: "500",
    color: "#6B7280",
  },
  itineraryPicker: {
    flexDirection: "row",
    alignItems: "center",
  },
  dropdown: {
    height: 40,
    width: 150,
    backgroundColor: "#6366F1",
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  dropdownArrow: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 5,
  },
  dropdownArrowOpen: {
    transform: [{ rotate: "180deg" }],
  },
  calendarContainer: {
    marginBottom: 5,
  },
  dayHeaders: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dayHeaderCell: {
    width: 40,
    alignItems: "center",
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  datesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateCell: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  selectedDateCell: {
    backgroundColor: "#6366F1",
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  selectedDateNumber: {
    color: "#FFFFFF",
  },
  timelineContainer: {
    marginTop: 20,
    paddingLeft: 10,
  },
  timelineHeader: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 10,
  },
  timelineTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 60,
  },
  timelineTime: {
    fontSize: 16,
    color: "#6B7280",
    width: 80,
    marginRight: 10,
  },
  timelineDivider: {
    flex: 1,
    position: "relative",
    paddingLeft: 15,
  },
  timelineLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 2,
    backgroundColor: "#E5E7EB",
  },
  emptyState: {
    alignItems: "center",
    marginBottom: 60,
    padding: 20,
    flex: 1,
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    color: "#9CA3AF",
    marginBottom: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 36,
    color: "#1F2937",
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 34,
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    fontSize: 30,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 2,
  },
  itineraryDateCell: {
    backgroundColor: 'rgba(100, 102, 241, 0.3)',
  },
  itineraryDateNumber: {
    fontWeight: 'bold',
  },
  scheduleItemCard: {
    backgroundColor: "#E6F4EA",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  scheduleItemText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
  },
  cardsContainer: {
    flex: 1,
  },
  scheduleItemDetails: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  scheduleItemTimeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
} as const);