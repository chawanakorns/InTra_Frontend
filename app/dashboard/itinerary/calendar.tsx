import { MaterialIcons } from "@expo/vector-icons";
import polyline from "@mapbox/polyline";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { format, isSameDay, parse } from "date-fns";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  PanResponder,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import MapView, { Marker, Polyline } from "react-native-maps";
import ItineraryModal from "../../../components/ItineraryModal";
import { ScheduleItemEditModal } from "../../../components/ScheduleItemEditModal";
import { useNotification } from "../../../context/NotificationContext";
import { API_URL } from "../../config";

const BACKEND_ITINERARY_API_URL = `${API_URL}/api/itineraries`;
const BACKEND_AUTH_API_URL = `${API_URL}/auth`;
const BACKEND_RECOMMENDATIONS_API_URL = `${API_URL}/api`;
const BACKEND_NOTIFICATION_API_URL = `${API_URL}/api/notifications`;

type ScheduleItem = { id: string; place_id: string; place_name: string; place_type?: string; place_address?: string; place_rating?: number; place_image?: string; scheduled_date: string; scheduled_time: string; duration_minutes: number; };
type Itinerary = { id: string; type: string; budget: string | null; name: string; startDate: Date; endDate: Date; schedule_items: ScheduleItem[]; };
type PlaceDetails = { id: string; name: string; description: string; isOpen?: boolean; address?: string; rating?: number; };

const formatAndCapitalize = (s: string | undefined): string => {
  if (!s) return "";
  return s.replace(/_/g, " ").split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const parseDateStringSafe = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const LoginRequiredView = ({ onLoginPress }: { onLoginPress: () => void }) => (
  <View style={styles.centeredMessageContainer}>
    <MaterialIcons name="event-note" size={60} color="#9CA3AF" />
    <Text style={styles.messageTitle}>View Your Itineraries</Text>
    <Text style={styles.messageText}>Log in to create, view, and manage your personalized travel plans.</Text>
    <TouchableOpacity style={styles.loginButton} onPress={onLoginPress}><Text style={styles.loginButtonText}>Log In or Sign Up</Text></TouchableOpacity>
  </View>
);

export default function CalendarScreen() {
  const router = useRouter();
  const { addNotification } = useNotification();
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
  const [loginRequired, setLoginRequired] = useState(false);
  const [userName, setUserName] = useState("Guest");
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [placeDetailsCache, setPlaceDetailsCache] = useState<Record<string, PlaceDetails>>({});
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);
  const mapRef = useRef<MapView>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ScheduleItem | null>(null);
  const panY = useRef(new Animated.Value(0)).current;
  // Add this state for location loading
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  // Optionally, add deviceLocation if you use it in ItineraryModal
  const [deviceLocation, setDeviceLocation] = useState<Location.LocationObject | null>(null);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_evt, gestureState) => gestureState.dy > 0,
    onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100 || gestureState.vy > 0.5) {
        Animated.timing(panY, { toValue: 500, duration: 200, useNativeDriver: true }).start(() => { setModalVisible(false); panY.setValue(0); });
      } else {
        Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  })).current;

  const handleOpenModal = () => {
    panY.setValue(0);
    setModalVisible(true);
  };

  const coveredTimeSlots = useMemo(() => {
    const covered = new Set<string>();
    if (!selectedItinerary) return covered;
    const itemsForDay = selectedItinerary.schedule_items.filter((item) => isSameDay(parse(item.scheduled_date, "yyyy-MM-dd", new Date()), selectedDate));
    itemsForDay.forEach((item) => {
      const [sH] = item.scheduled_time.split(":").map(Number);
      const startTimeInMinutes = sH * 60 + parseInt(item.scheduled_time.split(":")[1], 10);
      const endTimeInMinutes = startTimeInMinutes + item.duration_minutes;
      for (let hour = sH + 1; hour * 60 < endTimeInMinutes; hour++) {
        const ampm = hour >= 12 ? "PM" : "AM";
        let displayHour = hour % 12 || 12;
        covered.add(`${displayHour.toString().padStart(2, "0")}:00 ${ampm}`);
      }
    });
    return covered;
  }, [selectedItinerary, selectedDate]);

  useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 60000); return () => clearInterval(timer); }, []);
  useEffect(() => { const startOfWeek = new Date(displayDate); startOfWeek.setDate(displayDate.getDate() - displayDate.getDay()); setWeekDates(Array.from({ length: 7 }, (_, i) => new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i))); }, [displayDate]);
  useEffect(() => { if (selectedItinerary) { const selectedDay = new Date(selectedDate); selectedDay.setHours(0, 0, 0, 0); const itineraryStartDay = new Date(selectedItinerary.startDate); itineraryStartDay.setHours(0, 0, 0, 0); const itineraryEndDay = new Date(selectedItinerary.endDate); itineraryEndDay.setHours(0, 0, 0, 0); if (selectedDay < itineraryStartDay || selectedDay > itineraryEndDay) { setSelectedDate(new Date(selectedItinerary.startDate)); setDisplayDate(new Date(selectedItinerary.startDate)); } } }, [selectedItinerary, selectedDate]);

  const fetchUserName = useCallback(async (token: string | null) => {
    if (!token) { setUserName("Guest"); return; }
    try {
      const response = await fetch(`${BACKEND_AUTH_API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) { const data = await response.json(); setUserName(data.full_name?.split(" ")[0] || "User"); } else { setUserName("User"); }
    } catch (err) { console.error("Failed to fetch user name:", err); setUserName("User"); }
  }, []);

  const fetchItineraries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLoginRequired(false);
    try {
      const token = await AsyncStorage.getItem("firebase_id_token");
      await fetchUserName(token);
      if (!token) { setLoginRequired(true); setItineraries([]); return; }
      const response = await fetch(`${BACKEND_ITINERARY_API_URL}/`, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
      if (response.status === 401) { setLoginRequired(true); await AsyncStorage.removeItem("firebase_id_token"); setItineraries([]); return; }
      if (!response.ok) { throw new Error(await response.text() || `Server error: ${response.status}`); }
      const data = await response.json();
      const fetchedItineraries: Itinerary[] = data.map((it: any) => ({ 
          id: it.id.toString(), type: it.type, budget: it.budget, name: it.name, 
          startDate: parseDateStringSafe(it.start_date), 
          endDate: parseDateStringSafe(it.end_date), 
          schedule_items: (it.schedule_items || []).map((item: any, index: number) => ({ ...item, id: item.id?.toString() ?? `${it.id}-${index}` })), 
        }));
      setItineraries(fetchedItineraries);
      setSelectedItinerary(current => updatedSelected(current, fetchedItineraries));
    } catch (err) { console.error("Error fetching itineraries:", err); setError(err instanceof Error ? err.message : "Failed to load itineraries");
    } finally { setIsLoading(false); }
  }, [fetchUserName]);
  
  const updatedSelected = (current: Itinerary | null, all: Itinerary[]) => {
    if (current) { const updated = all.find(it => it.id === current.id); return updated || all[0] || null; }
    return all[0] || null;
  };

  useFocusEffect(useCallback(() => { fetchItineraries(); setExpandedItemId(null); setIsDescriptionExpanded(null); setRouteCoordinates([]); setIsDetailsVisible(false); }, [fetchItineraries]));
  
  const handleOpenEditModal = (item: ScheduleItem) => { setItemToEdit(item); setIsEditModalVisible(true); };
  const handleCloseEditModal = () => { setIsEditModalVisible(false); setItemToEdit(null); };

  const createPersistentNotification = async (title: string, body: string) => {
    try {
        const token = await AsyncStorage.getItem("firebase_id_token");
        if (!token) return;
        await fetch(BACKEND_NOTIFICATION_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title, body })
        });
    } catch (error) { console.error("Failed to create persistent notification:", error); }
  };

  const handleSaveScheduleItem = async (itemId: string | null, newDate: string, newTime: string, newDuration: number) => {
    if (!selectedItinerary || !itemToEdit || !itemId) return;
  
    const originalItinerary = JSON.parse(JSON.stringify(selectedItinerary));
    
    setSelectedItinerary(prev => {
      if (!prev) return null;
      const updatedItems = prev.schedule_items.map(item =>
        item.id === itemId ? { ...item, scheduled_date: newDate, scheduled_time: newTime, duration_minutes: newDuration } : item
      );
      return { ...prev, schedule_items: updatedItems };
    });
    handleCloseEditModal();
  
    try {
      const token = await AsyncStorage.getItem("firebase_id_token");
      if (!token) throw new Error("Authentication token not found.");
  
      const payload = { scheduled_date: newDate, scheduled_time: newTime, duration_minutes: newDuration };
      const response = await fetch(`${BACKEND_ITINERARY_API_URL}/items/${itemId}`, {
        method: "PUT",
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) throw new Error((await response.json()).detail || "Failed to save changes.");
      
      const combinedDateTime = parse(`${newDate} ${newTime}`, 'yyyy-MM-dd HH:mm', new Date());
      const bannerMessage = `Updated to ${format(combinedDateTime, "MMMM do 'at' h:mm a")}`;
      addNotification(bannerMessage, 'info');

      const notificationBody = `You changed '${itemToEdit.place_name}' to ${format(combinedDateTime, "MMMM do 'at' h:mm a")}.`;
      await createPersistentNotification("Itinerary Item Updated", notificationBody);
      
    } catch (error) {
      setSelectedItinerary(originalItinerary);
      console.error("Error updating schedule item:", error);
      Alert.alert("Update Failed", error instanceof Error ? error.message : "An unknown error occurred.");
    }
  };
  
  const handleDeleteScheduleItem = async (itemToDelete: ScheduleItem) => {
    if (!selectedItinerary) return;
    Alert.alert("Delete Item", `Delete "${itemToDelete.place_name}"?`,
      [{ text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const token = await AsyncStorage.getItem("firebase_id_token");
          if (!token) { setLoginRequired(true); return; }

          const response = await fetch(`${BACKEND_ITINERARY_API_URL}/items/${itemToDelete.id}`, {
            method: "DELETE", headers: { Authorization: `Bearer ${token}` }
          });

          if (response.status === 204) {
            setSelectedItinerary(prev => {
              if (!prev) return null;
              return { ...prev, schedule_items: prev.schedule_items.filter(i => i.id !== itemToDelete.id) };
            });
            setExpandedItemId(null);
            
            const notificationMessage = `You deleted the plan "${itemToDelete.place_name}".`;
            addNotification(notificationMessage, 'info'); 
            await createPersistentNotification("Plan Item Deleted", notificationMessage);

          } else {
            throw new Error((await response.json()).detail || "Failed to delete item.");
          }
        } catch (error) {
          console.error("Error deleting schedule item:", error);
          Alert.alert("Error", error instanceof Error ? error.message : "An unknown error occurred.");
        }
      },
    }]);
  };
  
  const handleCreateItinerary = (newItineraryFromResponse: any) => { 
    setModalVisible(false); 
    const newItineraryForState: Itinerary = { 
      id: newItineraryFromResponse.id.toString(), 
      name: newItineraryFromResponse.name, 
      type: newItineraryFromResponse.type, 
      budget: newItineraryFromResponse.budget, 
      startDate: parseDateStringSafe(newItineraryFromResponse.start_date), 
      endDate: parseDateStringSafe(newItineraryFromResponse.end_date), 
      schedule_items: (newItineraryFromResponse.schedule_items || []).map((item: any, index: number) => ({ ...item, id: item.id?.toString() ?? `${newItineraryFromResponse.id}-${index}` })), 
    }; 
    setItineraries(prev => [newItineraryForState, ...prev]); 
    setSelectedItinerary(newItineraryForState); 
    setSelectedDate(newItineraryForState.startDate); 
    setDisplayDate(newItineraryForState.startDate); 
  };

  const handleDeleteItinerary = async () => {
    if (!selectedItinerary) return;
    const itineraryName = selectedItinerary.name;
    Alert.alert("Delete Itinerary", `Delete "${itineraryName}"? This cannot be undone.`, [{ text: "Cancel", style: "cancel" }, { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("firebase_id_token");
            if (!token) { setLoginRequired(true); return; }
            const response = await fetch(`${BACKEND_ITINERARY_API_URL}/${selectedItinerary.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            if (response.status === 204) {
              const updatedItineraries = itineraries.filter(it => it.id !== selectedItinerary!.id);
              setItineraries(updatedItineraries);
              setIsDetailsVisible(false);
              if (updatedItineraries.length > 0) {
                const newSelected = updatedItineraries[0];
                setSelectedItinerary(newSelected);
                setSelectedDate(newSelected.startDate);
                setDisplayDate(newSelected.startDate);
              } else {
                setSelectedItinerary(null);
              }
              addNotification(`You deleted the plan "${itineraryName}".`, 'info');
              await createPersistentNotification("Plan Deleted", `You deleted the travel plan: "${itineraryName}".`);
            } else if (response.status === 401) {
              setLoginRequired(true);
              await AsyncStorage.removeItem("firebase_id_token");
            } else {
              Alert.alert("Error", (await response.json()).detail || "Failed to delete itinerary.");
            }
          } catch (err) {
            console.error("Deletion error:", err);
            Alert.alert("Error", "An unexpected error occurred.");
          }
        },
      }],
    );
  };

  const handlePreviousWeek = () => { setDisplayDate(current => { const newDate = new Date(current); newDate.setDate(current.getDate() - 7); return newDate; }); };
  const handleNextWeek = () => { setDisplayDate(current => { const newDate = new Date(current); newDate.setDate(current.getDate() + 7); return newDate; }); };
  const formatDateHeader = (date: Date) => date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const getTimeOfDay = (date: Date) => { const h = date.getHours(); if (h < 12) return "Good Morning"; if (h < 17) return "Good Afternoon"; return "Good Evening"; };
  const timeSlots = Array.from({ length: 24 }, (_, i) => { const h = i; return `${(h % 12 || 12).toString().padStart(2, "0")}:00 ${h >= 12 ? "PM" : "AM"}`; });
  const getScheduleItemsForTimeSlot = (timeSlot: string): ScheduleItem[] => { if (!selectedItinerary) return []; const parts = timeSlot.match(/(\d+):(\d+)\s(AM|PM)/); if (!parts) return []; let hour12 = parseInt(parts[1], 10); const ampm = parts[3]; let hour24 = hour12; if (ampm === 'PM' && hour12 < 12) { hour24 += 12; } if (ampm === 'AM' && hour12 === 12) { hour24 = 0; } return selectedItinerary.schedule_items.filter((item) => { const itemDate = parse(item.scheduled_date, "yyyy-MM-dd", new Date()); if (!isSameDay(itemDate, selectedDate)) { return false; } const itemHour24 = parseInt(item.scheduled_time.split(":")[0], 10); return itemHour24 === hour24; }); };
  const handleItemPress = async (item: ScheduleItem) => { if (expandedItemId === item.id) { setExpandedItemId(null); setRouteCoordinates([]); return; } setRouteCoordinates([]); setIsDescriptionExpanded(null); setExpandedItemId(item.id); if (!placeDetailsCache[item.place_id]) { setIsFetchingDetails(true); try { const token = await AsyncStorage.getItem("firebase_id_token"); const response = await fetch(`${BACKEND_RECOMMENDATIONS_API_URL}/recommendations/place/${item.place_id}/details`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }); if (!response.ok) throw new Error("Failed to fetch place details"); const details: PlaceDetails = await response.json(); setPlaceDetailsCache(prev => ({ ...prev, [item.place_id]: details })); } catch (error) { console.error("Error fetching place details:", error); Alert.alert("Error", "Could not load place details."); setExpandedItemId(null); } finally { setIsFetchingDetails(false); } } };
  const toggleDescriptionExpansion = (itemId: string) => setIsDescriptionExpanded(isDescriptionExpanded === itemId ? null : itemId);
  const handleShowDirections = async (item: ScheduleItem) => { if (routeCoordinates.length > 0) { setRouteCoordinates([]); return; } setIsFetchingRoute(true); try { let { status } = await Location.requestForegroundPermissionsAsync(); if (status !== "granted") { Alert.alert("Permission Denied", "Location is needed for directions."); return; } const location = await Location.getCurrentPositionAsync({}); const origin = `${location.coords.latitude},${location.coords.longitude}`; const response = await fetch(`${BACKEND_RECOMMENDATIONS_API_URL}/recommendations/directions?origin=${origin}&destination_place_id=${item.place_id}`); if (!response.ok) { throw new Error((await response.json()).detail || "Failed to fetch directions."); } const data = await response.json(); const coords = polyline.decode(data.encoded_polyline).map(p => ({ latitude: p[0], longitude: p[1] })); setRouteCoordinates(coords); mapRef.current?.fitToCoordinates(coords, { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true, }); } catch (error) { console.error(error); Alert.alert("Error", "Could not get directions."); } finally { setIsFetchingRoute(false); } };

  const renderContent = () => {
    if (isLoading) { return <View style={styles.centeredMessageContainer}><ActivityIndicator size="large" color="#6366F1" /><Text style={styles.loadingText}>Loading your itineraries...</Text></View>; }
    if (loginRequired) { return <LoginRequiredView onLoginPress={() => router.replace("/auth/sign-in")} />; }
    if (error) { return <View style={styles.centeredMessageContainer}><Text style={styles.errorText}>{error}</Text><TouchableOpacity style={styles.retryButton} onPress={fetchItineraries}><Text style={styles.retryButtonText}>Retry</Text></TouchableOpacity></View>; }
    return (
      <>
        <View style={styles.header}>
          <Text style={styles.greeting}>{getTimeOfDay(currentTime)}, {userName}</Text>
          <View style={styles.headerRow}>
            <Text style={styles.date}>{formatDateHeader(selectedDate)}</Text>
            {itineraries.length > 0 && (
              <View style={styles.itineraryPicker}>
                <Dropdown style={styles.dropdown} data={itineraries.map(it => ({ label: it.name, value: it.id }))} value={selectedItinerary?.id} onChange={item => { const it = itineraries.find(i => i.id === item.value); if (it) { setSelectedItinerary(it); setSelectedDate(new Date(it.startDate)); setDisplayDate(new Date(it.startDate)); setIsDetailsVisible(false); } }} labelField="label" valueField="value" placeholder="Select Itinerary" placeholderStyle={styles.placeholderStyle} selectedTextStyle={styles.selectedTextStyle} iconStyle={styles.iconStyle} onFocus={() => setIsDropdownOpen(true)} onBlur={() => setIsDropdownOpen(false)} renderRightIcon={() => <Text style={[styles.dropdownArrow, isDropdownOpen && styles.dropdownArrowOpen]}>▼</Text>} />
                <TouchableOpacity onPress={() => setIsDetailsVisible(!isDetailsVisible)} style={styles.detailsButton}><MaterialIcons name={isDetailsVisible ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={28} color="#6366F1" /></TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteItinerary} style={styles.deleteButton}><MaterialIcons name="delete-outline" size={26} color="#B91C1C" /></TouchableOpacity>
              </View>
            )}
          </View>
          {isDetailsVisible && selectedItinerary && (
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Trip Type:</Text><Text style={styles.detailValue}>{selectedItinerary.type}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Budget:</Text><Text style={styles.detailValue}>{formatAndCapitalize(selectedItinerary.budget ?? undefined) || "Not Specified"}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Dates:</Text><Text style={styles.detailValue}>{`${formatDateHeader(selectedItinerary.startDate)} - ${formatDateHeader(selectedItinerary.endDate)}`}</Text></View>
            </View>
          )}
        </View>
        <View style={styles.calendarContainer}>
          <View style={styles.weekControlContainer}>
            <TouchableOpacity onPress={handlePreviousWeek} style={styles.navButton}><Text style={styles.navButtonText}>{"<"}</Text></TouchableOpacity>
            <View style={styles.datesRow}>
              {weekDates.map(date => {
                const isSelected = isSameDay(date, selectedDate);
                const normDate = new Date(date).setHours(0,0,0,0);
                const isWithin = selectedItinerary && normDate >= new Date(selectedItinerary.startDate).setHours(0,0,0,0) && normDate <= new Date(selectedItinerary.endDate).setHours(0,0,0,0);
                return (
                  <TouchableOpacity key={date.toISOString()} style={[styles.dateCell, isSelected && styles.selectedDateCell, isWithin && !isSelected && styles.itineraryDateCell]} onPress={() => setSelectedDate(date)}>
                    <Text style={[styles.dayHeaderText, isSelected && styles.selectedDateNumber]}>{date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}</Text>
                    <Text style={[styles.dateNumber, isSelected && styles.selectedDateNumber]}>{date.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity onPress={handleNextWeek} style={styles.navButton}><Text style={styles.navButtonText}>{">"}</Text></TouchableOpacity>
          </View>
        </View>
        {selectedItinerary ? (
          <View style={styles.timelineContainer}>
            <View style={styles.timelineHeader}><Text style={styles.timelineTitle}>Timeline</Text></View>
            {timeSlots.map(time => {
              const itemsInSlot = getScheduleItemsForTimeSlot(time);
              itemsInSlot.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
              const offset = itemsInSlot.length > 0 ? (parseInt(itemsInSlot[0].scheduled_time.split(":")[1]) / 60) * 60 : 0;
              return (
                <View key={time} style={styles.timelineRow}>
                  {!coveredTimeSlots.has(time) ? <Text style={styles.timelineTime}>{time}</Text> : <View style={{ width: 80, marginRight: 10 }} />}
                  <View style={styles.timelineDivider}>
                    <View style={{ paddingTop: offset }}>
                      {itemsInSlot.length > 0 && <View style={styles.timelineDot} />}
                      <View style={styles.cardsContainer}>
                        {itemsInSlot.map(item => {
                          const isExpanded = expandedItemId === item.id;
                          const details = placeDetailsCache[item.place_id];
                          const desc = details?.description || "";
                          const isDescExpanded = isDescriptionExpanded === item.id;
                          const cardHeight = Math.max(80, (item.duration_minutes / 60) * 60);
                          const timeRange = `${new Date(`1970-01-01T${item.scheduled_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${new Date(new Date(`1970-01-01T${item.scheduled_time}`).getTime() + item.duration_minutes * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
                          return (
                            <View key={item.id} style={{ marginBottom: 15 }}>
                              <TouchableOpacity onPress={() => handleItemPress(item)}>
                                <View style={[styles.scheduleItemCard, { minHeight: cardHeight }, isExpanded && styles.scheduleItemCardExpanded]}>
                                  <Image source={item.place_image ? { uri: item.place_image } : require("../../../assets/images/icon.png")} style={styles.cardImage} />
                                  <View style={styles.cardContent}>
                                    <Text style={styles.scheduleItemText} numberOfLines={1}>{item.place_name}</Text>
                                    <Text style={styles.scheduleItemDetails}>{formatAndCapitalize(item.place_type) || "Activity"}</Text>
                                    <Text style={styles.scheduleItemTimeText}>{timeRange}</Text>
                                  </View>
                                </View>
                              </TouchableOpacity>
                              {isExpanded && (
                                <View style={styles.expandedDetailsContainer}>
                                  {isFetchingDetails && !details ? <ActivityIndicator style={{ marginVertical: 20 }} color="#6366F1" /> : (
                                    <>
                                      <Text style={styles.detailsDescription}>{desc.length > 120 && !isDescExpanded ? `${desc.substring(0, 120)}...` : desc}</Text>
                                      {desc.length > 120 && <TouchableOpacity onPress={() => toggleDescriptionExpansion(item.id)}><Text style={styles.showMoreText}>{isDescExpanded ? "Show less" : "Show more"}</Text></TouchableOpacity>}
                                      <View style={styles.detailRow}><Text style={styles.detailLabel}>Status:</Text><Text style={[styles.detailValue, { color: details?.isOpen ? "#10B981" : "#EF4444" }]}>{details?.isOpen ? "Open Now" : "Closed"}</Text></View>
                                      <View style={styles.actionButtonsRow}>
                                        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => handleOpenEditModal(item)}><MaterialIcons name="edit-calendar" size={20} color="#FFFFFF" /><Text style={styles.actionButtonText}>Edit</Text></TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionButton, styles.deleteItemButton]} onPress={() => handleDeleteScheduleItem(item)}><MaterialIcons name="delete-forever" size={20} color="#FFFFFF" /><Text style={styles.actionButtonText}>Delete</Text></TouchableOpacity>
                                      </View>
                                      <TouchableOpacity style={styles.mapButton} onPress={() => handleShowDirections(item)} disabled={isFetchingRoute}>
                                        {isFetchingRoute ? <ActivityIndicator color="#FFFFFF" /> : <><MaterialIcons name="directions" size={20} color="#FFFFFF" /><Text style={styles.mapButtonText}>{routeCoordinates.length > 0 ? "Hide Directions" : "Show Directions"}</Text></>}
                                      </TouchableOpacity>
                                      {routeCoordinates.length > 0 && <MapView ref={mapRef} style={styles.mapView} showsUserLocation initialRegion={{ latitude: routeCoordinates[0].latitude, longitude: routeCoordinates[0].longitude, latitudeDelta: 0.0922, longitudeDelta: 0.0421 }}><Marker coordinate={routeCoordinates[routeCoordinates.length - 1]} title="Destination" /><Polyline coordinates={routeCoordinates} strokeColor="#6366F1" strokeWidth={4} /></MapView>}
                                    </>
                                  )}
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}><Text style={styles.emptyTitle}>No Itineraries Found</Text><Text style={styles.emptySubtitle}>Create your first itinerary to get started!</Text></View>
        )}
      </>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>
        {!loginRequired && !isLoading && (
          <TouchableOpacity style={styles.addButton} onPress={handleOpenModal} disabled={isLoadingLocation}>
            {isLoadingLocation ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.addButtonText}>+</Text>}
          </TouchableOpacity>
        )}
      </SafeAreaView>
      <ItineraryModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onCreateItinerary={handleCreateItinerary} 
        panY={panY} 
        panResponder={panResponder} 
        backendApiUrl={BACKEND_ITINERARY_API_URL} 
        itineraries={itineraries}
      />
      <ScheduleItemEditModal 
        visible={isEditModalVisible} 
        onClose={handleCloseEditModal} 
        item={itemToEdit} 
        itinerary={selectedItinerary} 
        onSave={handleSaveScheduleItem} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, position: "relative" },
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { paddingHorizontal: 20, paddingTop: 70, paddingBottom: 70, minHeight: "100%" },
  loadingText: { marginTop: 16, color: "#6B7280", fontSize: 16 },
  errorText: { color: "#EF4444", fontSize: 16, textAlign: "center", marginBottom: 20 },
  retryButton: { backgroundColor: "#6366F1", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: "#FFFFFF", fontWeight: "bold" },
  header: { marginBottom: 30 },
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
  deleteButton: { marginLeft: 8, padding: 4 },
  detailsButton: { marginLeft: 4, padding: 4 },
  detailsContainer: { backgroundColor: "#F3F4F6", borderRadius: 8, padding: 12, marginTop: 12 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  detailLabel: { fontSize: 14, color: "#4B5563", fontWeight: "500" },
  detailValue: { fontSize: 14, color: "#1F2937", fontWeight: "600", flex: 1, textAlign: "right" },
  calendarContainer: { marginBottom: 5 },
  weekControlContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navButton: { padding: 8 },
  navButtonText: { fontSize: 22, fontWeight: "bold", color: "#6366F1" },
  dayHeaderText: { fontSize: 12, fontWeight: "500", color: "#6B7280", textTransform: "uppercase", marginBottom: 6 },
  datesRow: { flexDirection: "row", justifyContent: "space-between", flex: 1, marginHorizontal: 5 },
  dateCell: { width: 38, height: 60, justifyContent: "center", alignItems: "center", borderRadius: 21 },
  selectedDateCell: { backgroundColor: "#6366F1" },
  dateNumber: { fontSize: 16, fontWeight: "500", color: "#1F2937" },
  selectedDateNumber: { color: "#FFFFFF", fontWeight: "bold" },
  timelineContainer: { marginTop: 20 },
  timelineHeader: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E5E7EB", marginBottom: 10 },
  timelineTitle: { fontSize: 20, fontWeight: "bold", color: "#1F2937" },
  timelineRow: { flexDirection: "row", alignItems: "stretch", minHeight: 60 },
  timelineTime: { fontSize: 14, color: "#9CA3AF", width: 80, marginRight: 10, paddingTop: 8, textAlign: "right" },
  timelineDivider: { flex: 1, position: "relative", paddingLeft: 20, borderLeftWidth: 2, borderLeftColor: "#E5E7EB" },
  timelineDot: { position: "absolute", top: 9, left: -6, width: 12, height: 12, borderRadius: 6, backgroundColor: "#6366F1", borderWidth: 2, borderColor: "#FFFFFF", zIndex: 1 },
  emptyState: { alignItems: "center", flex: 1, justifyContent: "center", paddingBottom: 100, marginTop: 50 },
  emptyTitle: { fontSize: 16, color: "#9CA3AF", marginBottom: 16, textAlign: "center" },
  emptySubtitle: { fontSize: 24, color: "#1F2937", fontWeight: "bold", textAlign: "center", lineHeight: 30 },
  addButton: { position: "absolute", bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center", elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  addButtonText: { fontSize: 30, color: "#FFFFFF", fontWeight: "bold", marginBottom: 2 },
  itineraryDateCell: { backgroundColor: "rgba(99, 102, 241, 0.15)", borderRadius: 21 },
  scheduleItemCard: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 12, width: "100%", shadowColor: "#4A5568", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  scheduleItemCardExpanded: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderColor: "#6366F1", borderWidth: 1.5, borderBottomWidth: 0 },
  cardsContainer: { flex: 1, paddingTop: 5, paddingBottom: 5 },
  scheduleItemText: { fontSize: 16, fontWeight: "bold", color: "#1F2937", marginBottom: 4 },
  scheduleItemDetails: { fontSize: 14, color: "#6B7280", marginBottom: 8 },
  scheduleItemTimeText: { fontSize: 14, fontWeight: "bold", color: "#374151" },
  cardImage: { width: 90, height: "100%", backgroundColor: "#E5E7EB", borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
  cardContent: { padding: 12, flex: 1, justifyContent: "center" },
  centeredMessageContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  messageTitle: { fontSize: 22, fontWeight: "bold", color: "#1F2937", textAlign: "center", marginBottom: 12 },
  messageText: { fontSize: 16, color: "#6B7280", textAlign: "center", marginBottom: 24, lineHeight: 22 },
  loginButton: { backgroundColor: "#6366F1", paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  loginButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 },
  expandedDetailsContainer: { padding: 15, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginTop: -2, paddingTop: 15, backgroundColor: "#F9FAFB", borderColor: "#6366F1", borderWidth: 1.5, borderTopWidth: 0 },
  detailsDescription: { fontSize: 14, color: "#4B5563", lineHeight: 20, marginBottom: 12 },
  showMoreText: { fontSize: 14, fontWeight: "bold", color: "#6366F1", marginBottom: 10 },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, marginBottom: 5 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, flex: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.22, shadowRadius: 2.22, elevation: 3 },
  actionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  editButton: { backgroundColor: '#4338CA', marginRight: 5 },
  deleteItemButton: { backgroundColor: '#D946EF', marginLeft: 5 },
  mapButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#4B5563", paddingVertical: 10, borderRadius: 8, marginTop: 15, minHeight: 40 },
  mapButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold", marginLeft: 8 },
  mapView: { height: 250, width: "100%", marginTop: 15, borderRadius: 8 },
});