import { MaterialIcons } from "@expo/vector-icons";
import polyline from "@mapbox/polyline";
import { useFocusEffect } from "@react-navigation/native";
import { format, isSameDay, isToday, parse } from "date-fns";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { auth } from '../../../config/firebaseConfig';
import { AuthContext } from '../../../context/AuthContext';

import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  LayoutAnimation,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import MapView, { MapStyleElement, Marker, Polyline } from "react-native-maps";
import ItineraryModal from "../../../components/ItineraryModal";
import { ScheduleItemEditModal } from "../../../components/ScheduleItemEditModal";
import { useNotification } from "../../../context/NotificationContext";
import { useTheme } from "../../../context/ThemeContext";
import { API_URL } from "../../config";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const BACKEND_ITINERARY_API_URL = `${API_URL}/api/itineraries`;
const BACKEND_AUTH_API_URL = `${API_URL}/auth`;
const BACKEND_RECOMMENDATIONS_API_URL = `${API_URL}/api`;
const BACKEND_NOTIFICATION_API_URL = `${API_URL}/api/notifications`;
const HOUR_ROW_HEIGHT = 80;
const TIME_LABEL_WIDTH = 80;

type ScheduleItem = { id: string; place_id: string; place_name: string; description?: string; place_type?: string; place_address?: string; place_rating?: number; place_image?: string; scheduled_date: string; scheduled_time: string; duration_minutes: number; };
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

const dayHours = Array.from({ length: 18 }, (_, i) => i + 6);
const nightHours = Array.from({ length: 6 }, (_, i) => i);
const orderedHours = [...dayHours, ...nightHours];
const hourToRowIndexMap = new Map(orderedHours.map((hour, index) => [hour, index]));

const LoginRequiredView = ({ onLoginPress }: { onLoginPress: () => void }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.centeredMessageContainer, { backgroundColor: colors.background }]}>
      <MaterialIcons name="event-note" size={60} color={colors.icon} />
      <Text style={[styles.messageTitle, { color: colors.text }]}>View Your Itineraries</Text>
      <Text style={[styles.messageText, { color: colors.icon }]}>Log in to create, view, and manage your personalized travel plans.</Text>
      <TouchableOpacity style={[styles.loginButton, { backgroundColor: colors.primary }]} onPress={onLoginPress}><Text style={styles.loginButtonText}>Log In or Sign Up</Text></TouchableOpacity>
    </View>
  );
};

const SkeletonLoader = () => {
  const { colors } = useTheme();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 60 }}>
        <View style={{ width: '70%', height: 30, backgroundColor: colors.secondary, borderRadius: 8, marginBottom: 10 }} />
        <View style={{ width: '50%', height: 20, backgroundColor: colors.secondary, borderRadius: 8, marginBottom: 20 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, paddingVertical: 10 }}>
            {Array.from({ length: 7 }).map((_, i) => <View key={i} style={{ width: 40, height: 60, backgroundColor: colors.secondary, borderRadius: 20 }} />)}
        </View>
        <View style={{ width: '30%', height: 24, backgroundColor: colors.secondary, borderRadius: 8, marginBottom: 20 }} />
    </View>
  );
};

export default function CalendarScreen() {
  const router = useRouter();
  const { addNotification } = useNotification();
  const { colors, isDark } = useTheme();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [displayDate, setDisplayDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginRequired, setLoginRequired] = useState(false);
  const { user, initializing } = useContext(AuthContext);
  const [userName, setUserName] = useState("Guest");
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [expandedDetailsHeight, setExpandedDetailsHeight] = useState(0); 
  const [placeDetailsCache, setPlaceDetailsCache] = useState<Record<string, PlaceDetails>>({});
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);
  const mapRef = useRef<MapView>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ScheduleItem | null>(null);
  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_evt, gestureState) => Math.abs(gestureState.dy) > 5,
    onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100 || gestureState.vy > 0.5) {
        Animated.timing(panY, { toValue: 500, duration: 200, useNativeDriver: true }).start(() => { setModalVisible(false); panY.setValue(0); });
      } else {
        Animated.spring(panY, { toValue: 0, stiffness: 100, damping: 20, useNativeDriver: true }).start();
      }
    },
  })).current;

  const handleOpenModal = () => { panY.setValue(0); setModalVisible(true); };

  useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 60000); return () => clearInterval(timer); }, []);
  useEffect(() => { const startOfWeek = new Date(displayDate); startOfWeek.setDate(displayDate.getDate() - displayDate.getDay()); setWeekDates(Array.from({ length: 7 }, (_, i) => new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i))); }, [displayDate]);
  useEffect(() => { if (selectedItinerary) { const selectedDay = new Date(selectedDate); selectedDay.setHours(0, 0, 0, 0); const itineraryStartDay = new Date(selectedItinerary.startDate); itineraryStartDay.setHours(0, 0, 0, 0); const itineraryEndDay = new Date(selectedItinerary.endDate); itineraryEndDay.setHours(0, 0, 0, 0); if (selectedDay < itineraryStartDay || selectedDay > itineraryEndDay) { setSelectedDate(new Date(selectedItinerary.startDate)); setDisplayDate(new Date(selectedItinerary.startDate)); } } }, [selectedItinerary, selectedDate]);
  
  const fetchUserName = useCallback(async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) { setUserName("Guest"); return; }
      const response = await fetch(`${BACKEND_AUTH_API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) { const data = await response.json(); setUserName(data.full_name?.split(" ")[0] || "User"); } else { setUserName("User"); }
    } catch (err) { console.error("Failed to fetch user name:", err); setUserName("User"); }
  }, []);

  const fetchItineraries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLoginRequired(false);
    try {
      if (initializing) return;
      if (!user) { setLoginRequired(true); setItineraries([]); return; }
      await fetchUserName();
      const token = await auth.currentUser?.getIdToken();
      if (!token) { setLoginRequired(true); setItineraries([]); return; }
      const response = await fetch(`${BACKEND_ITINERARY_API_URL}/`, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
      if (response.status === 401) { setLoginRequired(true); try { await auth.signOut(); } catch {} setItineraries([]); return; }
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
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    await fetch(BACKEND_NOTIFICATION_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title, body })
    });
  } catch (err) { console.error("Failed to create persistent notification:", err); }
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
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Authentication token not found.");
      const payload = { scheduled_date: newDate, scheduled_time: newTime, duration_minutes: newDuration };
      const response = await fetch(`${BACKEND_ITINERARY_API_URL}/items/${itemId}`, {
        method: "PUT",
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).detail || "Failed to save changes.");
      const combinedDateTime = parse(`${newDate} ${newTime}`, 'yyyy-MM-dd HH:mm', new Date());
      addNotification(`Updated to ${format(combinedDateTime, "MMM do 'at' h:mm a")}`, 'info');
      await createPersistentNotification("Itinerary Item Updated", `You changed '${itemToEdit.place_name}' to ${format(combinedDateTime, "MMM do 'at' h:mm a")}.`);
    } catch (error) {
      setSelectedItinerary(originalItinerary);
      Alert.alert("Update Failed", error instanceof Error ? error.message : "An unknown error occurred.");
    }
  };

  const handleDeleteScheduleItem = async (itemToDelete: ScheduleItem) => {
    if (!selectedItinerary) return;
    Alert.alert(`Delete "${itemToDelete.place_name}"?`, "This action cannot be undone.",
      [{ text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const token = await auth.currentUser?.getIdToken();
          if (!token) { setLoginRequired(true); return; }
          const response = await fetch(`${BACKEND_ITINERARY_API_URL}/items/${itemToDelete.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
          if (response.status === 204) {
            setSelectedItinerary(prev => {
              if (!prev) return null;
              return { ...prev, schedule_items: prev.schedule_items.filter(i => i.id !== itemToDelete.id) };
            });
            setExpandedItemId(null);
            const notificationMessage = `Deleted "${itemToDelete.place_name}" from your itinerary.`;
            addNotification(notificationMessage, 'info'); 
            await createPersistentNotification("Plan Item Deleted", notificationMessage);
          } else { throw new Error((await response.json()).detail || "Failed to delete item."); }
        } catch (error) { Alert.alert("Error", error instanceof Error ? error.message : "An unknown error occurred."); }
      },
    }]);
  };
  
  const handleCreateItinerary = (newItineraryFromResponse: any) => { 
    setModalVisible(false); 
    const newItineraryForState: Itinerary = { 
      id: newItineraryFromResponse.id.toString(), name: newItineraryFromResponse.name, type: newItineraryFromResponse.type, budget: newItineraryFromResponse.budget, 
      startDate: parseDateStringSafe(newItineraryFromResponse.start_date), endDate: parseDateStringSafe(newItineraryFromResponse.end_date), 
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
    Alert.alert(`Delete "${itineraryName}"?`, "This will permanently delete the itinerary and all its scheduled items.", [{ text: "Cancel", style: "cancel" }, { 
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) { setLoginRequired(true); return; }
            const response = await fetch(`${BACKEND_ITINERARY_API_URL}/${selectedItinerary.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            if (response.status === 204) {
              const updatedItineraries = itineraries.filter(it => it.id !== selectedItinerary!.id);
              setItineraries(updatedItineraries);
              setIsDetailsVisible(false);
              setSelectedItinerary(updatedItineraries[0] || null);
              if (updatedItineraries.length > 0) { setSelectedDate(updatedItineraries[0].startDate); setDisplayDate(updatedItineraries[0].startDate); }
              addNotification(`Deleted "${itineraryName}".`, 'info');
              await createPersistentNotification("Plan Deleted", `You deleted the travel plan: "${itineraryName}".`);
            } else { Alert.alert("Error", (await response.json()).detail || "Failed to delete itinerary."); }
          } catch (err) { Alert.alert("Error", "An unexpected error occurred during deletion."); }
        },
      }],
    );
  };
  
  const handleItemPress = async (item: ScheduleItem) => { 
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedItemId === item.id) { 
        setExpandedItemId(null);
    } else {
        setExpandedItemId(item.id); 
        setRouteCoordinates([]); 
        setIsDescriptionExpanded(null); 
        if (!placeDetailsCache[item.place_id]) { 
            setIsFetchingDetails(true); 
      try { 
        const token = await auth.currentUser?.getIdToken(); 
        const response = await fetch(`${BACKEND_RECOMMENDATIONS_API_URL}/recommendations/place/${item.place_id}/details`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }); 
        if (!response.ok) throw new Error("Failed to fetch place details"); 
        const details: PlaceDetails = await response.json(); setPlaceDetailsCache(prev => ({ ...prev, [item.place_id]: details })); 
            } catch { Alert.alert("Error", "Could not load place details."); setExpandedItemId(null); 
      } finally { setIsFetchingDetails(false); } 
        } 
    } 
  };
  
  const handleShowDirections = async (item: ScheduleItem) => {
    if (routeCoordinates.length > 0) { setRouteCoordinates([]); return; }
    setIsFetchingRoute(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission Denied", "Location access is required to show directions."); return; }
      const location = await Location.getCurrentPositionAsync({});
      const origin = `${location.coords.latitude},${location.coords.longitude}`;
      const response = await fetch(`${BACKEND_RECOMMENDATIONS_API_URL}/recommendations/directions?origin=${origin}&destination_place_id=${item.place_id}`);
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.detail || "Failed to fetch directions."); }
      const data = await response.json();
      const coords = polyline.decode(data.encoded_polyline).map(point => ({ latitude: point[0], longitude: point[1] }));
      setRouteCoordinates(coords);
      mapRef.current?.fitToCoordinates(coords, { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true });
    } catch (error) { Alert.alert("Error", error instanceof Error ? error.message : "Could not get directions.");
    } finally { setIsFetchingRoute(false); }
  };
  
  const getTimeOfDay = (date: Date) => { const h = date.getHours(); if (h < 12) return "Good Morning"; if (h < 17) return "Good Afternoon"; return "Good Evening"; };
  
  const itemsForSelectedDay = useMemo(() => {
    if (!selectedItinerary) return [];
    return selectedItinerary.schedule_items
      .filter(item => isSameDay(parse(item.scheduled_date, "yyyy-MM-dd", new Date()), selectedDate))
      .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
      .map(item => {
        const [hour, minute] = item.scheduled_time.split(':').map(Number);
        const rowIndex = hourToRowIndexMap.get(hour) ?? 0;
        const top = (rowIndex * HOUR_ROW_HEIGHT) + ((minute / 60) * HOUR_ROW_HEIGHT);
        const height = (item.duration_minutes / 60) * HOUR_ROW_HEIGHT;
        
        return {
          ...item,
          layout: {
            top,
            height: Math.max(height, HOUR_ROW_HEIGHT / 2) // Ensure a minimum height
          }
        };
      });
  }, [selectedItinerary, selectedDate]);

  const renderContent = () => {
    if (isLoading) return <SkeletonLoader />;
    if (loginRequired) return <LoginRequiredView onLoginPress={() => router.replace("/auth/sign-in")} />;
    if (error) return <View style={[styles.centeredMessageContainer, { backgroundColor: colors.background }]}><Text style={styles.errorText}>{error}</Text><TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={fetchItineraries}><Text style={styles.retryButtonText}>Retry</Text></TouchableOpacity></View>;
    
    const expandedItem = itemsForSelectedDay.find(i => i.id === expandedItemId);
    const totalTimelineHeight = (orderedHours.length * HOUR_ROW_HEIGHT) + (expandedItem ? expandedDetailsHeight : 0);

    return (
      <>
        <View style={styles.header}>
            <Text style={[styles.greeting, { color: colors.text }]}>{`${getTimeOfDay(currentTime)}, ${userName}`}</Text>
            <Text style={[styles.date, { color: colors.icon }]}>{format(selectedDate, "EEEE, MMMM do")}</Text>
        </View>

        {itineraries.length > 0 && (
            <View style={[styles.itineraryPickerContainer, { backgroundColor: colors.secondary }]}>
              <Dropdown 
                style={styles.dropdown} 
                containerStyle={[styles.dropdownContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                data={itineraries.map(it => ({ label: it.name, value: it.id }))} 
                value={selectedItinerary?.id} 
                onChange={item => { const it = itineraries.find(i => i.id === item.value); if (it) { setSelectedItinerary(it); setSelectedDate(new Date(it.startDate)); setDisplayDate(new Date(it.startDate)); setIsDetailsVisible(false); } }} 
                labelField="label" valueField="value" 
                placeholder="Select Itinerary" 
                placeholderStyle={[styles.placeholderStyle, { color: colors.icon }]} 
                selectedTextStyle={[styles.selectedTextStyle, { color: colors.text }]} 
                activeColor={colors.secondary}
                renderLeftIcon={() => <MaterialIcons name="calendar-today" style={styles.dropdownIcon} size={20} color={colors.primary} />}
              />
              <TouchableOpacity onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsDetailsVisible(!isDetailsVisible); }} style={styles.detailsButton}>
                  <MaterialIcons name="info-outline" size={24} color={colors.icon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteItinerary} style={styles.deleteButton}>
                  <MaterialIcons name="delete-outline" size={24} color={colors.danger} />
              </TouchableOpacity>
            </View>
        )}
        
        {isDetailsVisible && selectedItinerary && (
          <View style={[styles.detailsContainer, { backgroundColor: colors.secondary, borderColor: colors.cardBorder }]}>
            <View style={styles.detailRow}><Text style={[styles.detailLabel, { color: colors.icon }]}>Type:</Text><Text style={[styles.detailValue, { color: colors.text }]}>{selectedItinerary.type}</Text></View>
            <View style={styles.detailRow}><Text style={[styles.detailLabel, { color: colors.icon }]}>Budget:</Text><Text style={[styles.detailValue, { color: colors.text }]}>{formatAndCapitalize(selectedItinerary.budget ?? undefined) || "Not Specified"}</Text></View>
            <View style={styles.detailRow}><Text style={[styles.detailLabel, { color: colors.icon }]}>Dates:</Text><Text style={[styles.detailValue, { color: colors.text }]}>{`${format(selectedItinerary.startDate, "MMM d")} - ${format(selectedItinerary.endDate, "MMM d, yyyy")}`}</Text></View>
          </View>
        )}

        <View style={styles.calendarContainer}>
            <View style={styles.weekControlContainer}>
                <TouchableOpacity onPress={() => setDisplayDate(d => new Date(d.setDate(d.getDate() - 7)))} style={styles.navButton}><MaterialIcons name="chevron-left" size={28} color={colors.icon} /></TouchableOpacity>
                <View style={styles.datesRow}>
                    {weekDates.map(date => {
                        const isSelected = isSameDay(date, selectedDate);
                        const isCurrentDay = isToday(date);
                        const normDate = new Date(date).setHours(0,0,0,0);
                        const isWithinItinerary = selectedItinerary && normDate >= new Date(selectedItinerary.startDate).setHours(0,0,0,0) && normDate <= new Date(selectedItinerary.endDate).setHours(0,0,0,0);
                        return (
                            <TouchableOpacity key={date.toISOString()} style={styles.dateCell} onPress={() => setSelectedDate(date)}>
                                <Text style={[styles.dayHeaderText, { color: colors.icon }, isSelected && { color: colors.primary }]}>{format(date, "EEE")}</Text>
                                <View style={[styles.dateNumberContainer, isSelected ? [styles.selectedDateCell, { backgroundColor: colors.primary }] : isCurrentDay ? [styles.todayDateCell, { borderColor: colors.primary }] : null]}>
                                    <Text style={[styles.dateNumber, { color: colors.text }, isSelected ? styles.selectedDateNumber : isCurrentDay ? [styles.todayDateNumber, { color: colors.primary }] : {}]}>{date.getDate()}</Text>
                                </View>
                                {isWithinItinerary && <View style={[styles.itineraryDot, { backgroundColor: colors.primary }]} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <TouchableOpacity onPress={() => setDisplayDate(d => new Date(d.setDate(d.getDate() + 7)))} style={styles.navButton}><MaterialIcons name="chevron-right" size={28} color={colors.icon} /></TouchableOpacity>
            </View>
        </View>

        {selectedItinerary ? (
          <View style={[styles.timelineContainer, { height: totalTimelineHeight }]}>
            {orderedHours.map(hourIndex => {
              const time = `${(hourIndex % 12 || 12)}:00 ${hourIndex >= 12 ? "PM" : "AM"}`;
              return (
                <View key={hourIndex} style={styles.timelineRow}>
                  <Text style={[styles.timelineTime, { color: colors.icon }]}>{time}</Text>
                  <View style={[styles.timelineDivider, { borderLeftColor: colors.cardBorder }]} />
                </View>
              )
            })}
            
            <View style={styles.scheduleItemsContainer}>
              {itemsForSelectedDay.map(item => {
                const isExpanded = expandedItemId === item.id;
                const details = placeDetailsCache[item.place_id];
                
                const desc = item.description || details?.description || "No description available.";
                const isDescLong = desc.length > 120;
                const isDescCurrentlyExpanded = isDescriptionExpanded === item.id;

                const toggleDescription = () => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setIsDescriptionExpanded(prev => (prev === item.id ? null : item.id));
                };

                const startTime = parse(item.scheduled_time, "HH:mm", new Date());
                const endTime = new Date(startTime.getTime() + item.duration_minutes * 60000);
                
                let pushDownOffset = 0;
                if (expandedItem && item.id !== expandedItem.id && item.layout.top > expandedItem.layout.top) {
                    pushDownOffset = expandedDetailsHeight;
                }

                return (
                  <Animated.View 
                    key={item.id} 
                    style={[
                        styles.scheduleItemWrapper, 
                        { top: item.layout.top, transform: [{ translateY: pushDownOffset }] },
                        isExpanded ? { height: item.layout.height + expandedDetailsHeight } : { height: item.layout.height },
                        isExpanded && styles.expandedZIndex
                    ]}
                  >
                    <TouchableOpacity onPress={() => handleItemPress(item)} activeOpacity={0.8} >
                      <View style={[styles.scheduleItemCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, minHeight: item.layout.height - 4 }, isExpanded && { borderColor: colors.primary }]}>
                        <Image source={item.place_image ? { uri: item.place_image } : require("../../../assets/images/icon.png")} style={styles.cardImage} />
                        <View style={styles.cardContent}>
                          <Text style={[styles.scheduleItemText, { color: colors.text }]} numberOfLines={1}>{item.place_name}</Text>
                          <Text style={[styles.scheduleItemDetails, { color: colors.icon }]}>{`${format(startTime, "h:mm a")} - ${format(endTime, "h:mm a")}`}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {isExpanded && (
                       <View onLayout={(event) => setExpandedDetailsHeight(event.nativeEvent.layout.height)} style={[styles.expandedDetailsContainer, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
                       {isFetchingDetails && !details ? <ActivityIndicator style={{ marginVertical: 20 }} color={colors.primary} /> : (
                         <>
                           <Text 
                             style={[styles.detailsDescription, { color: colors.icon }]}
                             numberOfLines={isDescLong && !isDescCurrentlyExpanded ? 3 : undefined}
                           >
                             {desc}
                           </Text>
                           {isDescLong && (
                            <TouchableOpacity onPress={toggleDescription}>
                              <Text style={[styles.showMoreText, { color: colors.primary }]}>
                                {isDescCurrentlyExpanded ? "Show Less" : "Read More"}
                              </Text>
                            </TouchableOpacity>
                           )}
                           <View style={styles.detailRow}><Text style={[styles.detailLabel, { color: colors.icon }]}>Status:</Text><Text style={[styles.detailValue, { color: details?.isOpen ? "#10B981" : colors.danger }]}>{details?.isOpen ? "Open Now" : "Currently Closed"}</Text></View>
                           <View style={styles.actionButtonsRow}>
                             <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => handleOpenEditModal(item)}><MaterialIcons name="edit" size={18} color="#FFFFFF" /><Text style={styles.actionButtonText}>Edit</Text></TouchableOpacity>
                             <TouchableOpacity style={[styles.actionButton, styles.directionsButton]} onPress={() => handleShowDirections(item)}>
                               {isFetchingRoute ? <ActivityIndicator size="small" color="#FFFFFF"/> : <><MaterialIcons name="directions" size={18} color="#FFFFFF" /><Text style={styles.actionButtonText}>{routeCoordinates.length > 0 ? "Hide" : "Route"}</Text></>}
                             </TouchableOpacity>
                           </View>
                           {routeCoordinates.length > 0 && <MapView ref={mapRef} style={styles.mapView} provider="google" customMapStyle={isDark ? mapStyleDark : []} showsUserLocation initialRegion={{ latitude: routeCoordinates[0].latitude, longitude: routeCoordinates[0].longitude, latitudeDelta: 0.0922, longitudeDelta: 0.0421 }}><Marker coordinate={routeCoordinates[routeCoordinates.length - 1]} title="Destination" /><Polyline coordinates={routeCoordinates} strokeColor={colors.primary} strokeWidth={5} /></MapView>}
                           <TouchableOpacity style={[styles.deleteItemButton, { borderTopColor: colors.cardBorder }]} onPress={() => handleDeleteScheduleItem(item)}><MaterialIcons name="delete" size={16} color={colors.danger} /><Text style={[styles.deleteItemButtonText, { color: colors.danger }]}>Delete Item</Text></TouchableOpacity>
                         </>
                       )}
                     </View>
                    )}
                  </Animated.View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="map" size={50} color={colors.icon} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Itinerary Selected</Text>
            <Text style={[styles.emptySubtitle, { color: colors.icon }]}>Create or select an itinerary to see your plans.</Text>
          </View>
        )}
      </>
    );
  };
  
  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>
        {!loginRequired && !isLoading && (
          <TouchableOpacity style={[styles.addButton, { backgroundColor: isDark ? colors.card : colors.text }]} onPress={handleOpenModal}>
            <MaterialIcons name="add" size={30} color={isDark ? colors.text : colors.card} />
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

const mapStyleDark: MapStyleElement[] | undefined = [ /* Google Maps Dark Style JSON */ ];

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  safeArea: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
  centeredMessageContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, minHeight: 500 },
  messageTitle: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  messageText: { fontSize: 16, textAlign: "center", marginBottom: 24, lineHeight: 22 },
  loginButton: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 100 },
  loginButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 },
  errorText: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100 },
  retryButtonText: { fontWeight: "bold" },
  header: { marginBottom: 20, paddingHorizontal: 5 },
  greeting: { fontSize: 32, fontWeight: "bold" },
  date: { fontSize: 16, marginTop: 4 },
  itineraryPickerContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15, borderRadius: 12, paddingHorizontal: 5 },
  dropdown: { flex: 1, height: 50 },
  dropdownContainer: { borderRadius: 12, borderWidth: 1 },
  placeholderStyle: { fontSize: 16, marginLeft: 10 },
  selectedTextStyle: { fontSize: 16, marginLeft: 10, fontWeight: '500' },
  dropdownIcon: { marginRight: 10 },
  detailsButton: { padding: 8, marginHorizontal: 5 },
  deleteButton: { padding: 8 },
  detailsContainer: { borderRadius: 12, padding: 15, marginTop: -10, marginBottom: 20, borderWidth: 1 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 5 },
  detailLabel: { fontSize: 14, fontWeight: "500" },
  detailValue: { fontSize: 14, fontWeight: "600" },
  calendarContainer: { marginBottom: 25 },
  weekControlContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navButton: { padding: 8 },
  datesRow: { flexDirection: "row", justifyContent: "space-between", flex: 1 },
  dateCell: { justifyContent: 'flex-start', alignItems: 'center', height: 70 },
  dayHeaderText: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", marginBottom: 8 },
  dateNumberContainer: { width: 36, height: 36, justifyContent: "center", alignItems: "center", borderRadius: 2 },
  selectedDateCell: {},
  todayDateCell: { borderWidth: 2 },
  dateNumber: { fontSize: 16, fontWeight: "600" },
  selectedDateNumber: { color: "#FFFFFF" },
  todayDateNumber: {},
  itineraryDot: { width: 5, height: 5, borderRadius: 3, marginTop: 6 },
  timelineContainer: { marginTop: 10, position: 'relative' },
  timelineRow: { flexDirection: "row", height: HOUR_ROW_HEIGHT, alignItems: 'flex-start' },
  timelineTime: { fontSize: 14, width: TIME_LABEL_WIDTH, textAlign: "right", paddingRight: 10, marginTop: -8 },
  timelineDivider: { flex: 1, borderLeftWidth: 1 },
  scheduleItemsContainer: { position: 'absolute', top: 0, left: TIME_LABEL_WIDTH, right: 0, bottom: 0 },
  scheduleItemWrapper: { position: 'absolute', right: 0, left: 10, paddingVertical: 2 },
  expandedZIndex: { zIndex: 100 },
  scheduleItemCard: { flexDirection: "row", borderRadius: 8, borderWidth: 1, shadowColor: "#4A5568", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, overflow: 'hidden' },
  cardImage: { width: 60 },
  cardContent: { paddingVertical: 8, paddingHorizontal: 12, flex: 1, justifyContent: "center" },
  scheduleItemText: { fontSize: 15, fontWeight: "bold", marginBottom: 2 },
  scheduleItemDetails: { fontSize: 13 },
  expandedDetailsContainer: { borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderWidth: 1, borderTopWidth: 0, padding: 12, marginTop: -1, zIndex: 99 },
  detailsDescription: { fontSize: 14, lineHeight: 21, marginBottom: 12 },
  showMoreText: { fontSize: 14, fontWeight: "bold", marginBottom: 15, marginTop: -5 },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 15 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, flex: 1 },
  actionButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginLeft: 6 },
  editButton: { backgroundColor: '#4338CA', marginRight: 5 },
  directionsButton: { backgroundColor: '#10B981', marginLeft: 5 },
  deleteItemButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 12, marginTop: 8, borderTopWidth: 1 },
  deleteItemButtonText: { fontSize: 14, fontWeight: '600', marginLeft: 6 },
  mapView: { height: 200, width: "100%", marginTop: 15, borderRadius: 12 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 160 },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
  addButton: { position: "absolute", bottom: 30, right: 20, width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
});