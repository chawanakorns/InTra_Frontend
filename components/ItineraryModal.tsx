import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from "expo-location";
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponderInstance,
  Platform,
  StyleSheet,
  Switch,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SimpleItinerary {
  startDate: Date;
  endDate: Date;
}

interface ItineraryModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateItinerary: (newItinerary: any) => void;
  panY: Animated.Value;
  panResponder: PanResponderInstance;
  backendApiUrl: string;
  itineraries: SimpleItinerary[];
}

const BUDGET_OPTIONS = ["Low", "Medium", "High", "Custom"];

const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ItineraryModal({
  visible,
  onClose,
  onCreateItinerary,
  panY,
  panResponder,
  backendApiUrl,
  itineraries,
}: ItineraryModalProps) {
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [budgetType, setBudgetType] = useState<string | null>(null);
  const [customBudget, setCustomBudget] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      setName('');
      setBudgetType(null);
      setCustomBudget('');
      setCurrency('USD');
      setStartDate(today);
      setEndDate(tomorrow);
      setAutoGenerate(false);
      setOverlapWarning(null);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !itineraries || itineraries.length === 0) {
      setOverlapWarning(null);
      return;
    }
    const currentStart = new Date(startDate);
    currentStart.setHours(0, 0, 0, 0);
    const currentEnd = new Date(endDate);
    currentEnd.setHours(23, 59, 59, 999);
    const overlappingItinerary = itineraries.find(it => {
      const existingStart = new Date(it.startDate);
      existingStart.setHours(0, 0, 0, 0);
      const existingEnd = new Date(it.endDate);
      existingEnd.setHours(23, 59, 59, 999);
      return currentStart <= existingEnd && currentEnd >= existingStart;
    });
    if (overlappingItinerary) {
      setOverlapWarning('Warning: This date range overlaps with an existing itinerary.');
    } else {
      setOverlapWarning(null);
    }
  }, [startDate, endDate, itineraries, visible]);

  const handleSave = async () => {
    if (!name) {
      Alert.alert('Missing Information', 'Please provide a name for your itinerary.');
      return;
    }
    setIsCreating(true);

    let deviceLocation: { latitude: number; longitude: number } | null = null;

    if (autoGenerate) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permission Denied", "Location access is required for AI itinerary generation.");
          setIsCreating(false);
          return;
        }
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        deviceLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      } catch (error) {
        Alert.alert("Location Error", "Could not fetch your location. Please ensure location services are enabled and try again.");
        setIsCreating(false);
        return;
      }
    }

    const token = await AsyncStorage.getItem('firebase_id_token');
    if (!token) {
      Alert.alert('Authentication Error', 'Please log in again.');
      setIsCreating(false);
      onClose();
      return;
    }

    let budgetPayload: string | null = null;
    if (budgetType === 'Custom') {
      budgetPayload = customBudget ? `${customBudget} ${currency}`.trim() : null;
    } else {
      budgetPayload = budgetType;
    }

    const payload: any = {
      name,
      budget: budgetPayload,
      start_date: formatDateToYYYYMMDD(startDate),
      end_date: formatDateToYYYYMMDD(endDate),
    };

    if (autoGenerate && deviceLocation) {
        payload.latitude = deviceLocation.latitude;
        payload.longitude = deviceLocation.longitude;
    }

    const endpoint = autoGenerate ? `${backendApiUrl}/generate` : `${backendApiUrl}/`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to create itinerary');
      }
      
      onCreateItinerary(responseData);

    } catch (error: any) {
      Alert.alert('Creation Failed', error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const renderBudgetButtons = () => (
    <View>
      <Text style={[styles.label, { color: colors.text }]}>Budget (Optional)</Text>
      <View style={styles.budgetButtonsContainer}>
        {BUDGET_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.budgetButton, { borderColor: colors.cardBorder }, budgetType === option && [styles.budgetButtonSelected, { backgroundColor: colors.primary, borderColor: colors.primary }]]}
            onPress={() => setBudgetType(budgetType === option ? null : option)}
          >
            <Text style={[styles.budgetButtonText, { color: colors.icon }, budgetType === option && [styles.budgetButtonTextSelected, { color: colors.primary }]]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCustomBudgetInput = () => {
    if (budgetType !== 'Custom') return null;
    return (
      <View style={styles.customBudgetContainer}>
        <TextInput style={[styles.customBudgetInput, { backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }]} placeholder="e.g., 500" keyboardType="numeric" value={customBudget} onChangeText={setCustomBudget} placeholderTextColor={colors.icon} />
        <TextInput style={[styles.currencyInput, { backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }]} value={currency} onChangeText={setCurrency} autoCapitalize="characters" maxLength={3} />
      </View>
    );
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <Animated.View
          style={[styles.modalContent, { backgroundColor: colors.card }, { transform: [{ translateY: panY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.dragHandle} />
          <Text style={[styles.modalTitle, { color: colors.text }]}>New Itinerary</Text>

          <Text style={[styles.label, { color: colors.text }]}>Itinerary Name</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }]} placeholder="e.g., Tokyo Trip" value={name} onChangeText={setName} placeholderTextColor={colors.icon} />

          {renderBudgetButtons()}
          {renderCustomBudgetInput()}

          <View style={[styles.datePickerContainer, { borderBottomColor: colors.secondary }]}>
            <Text style={[styles.dateLabel, { color: colors.text }]}>Start Date</Text>
            <TouchableOpacity onPress={() => setShowStartDatePicker(true)}>
              <Text style={[styles.dateText, { color: colors.primary }]}>{formatDateToYYYYMMDD(startDate)}</Text>
            </TouchableOpacity>
          </View>
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(_, selectedDate) => {
                setShowStartDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setStartDate(selectedDate);
                  if (selectedDate >= endDate) {
                    const newEndDate = new Date(selectedDate);
                    newEndDate.setDate(newEndDate.getDate() + 1);
                    setEndDate(newEndDate);
                  }
                }
              }}
            />
          )}

          <View style={[styles.datePickerContainer, { borderBottomColor: colors.secondary }]}>
            <Text style={[styles.dateLabel, { color: colors.text }]}>End Date</Text>
            <TouchableOpacity onPress={() => setShowEndDatePicker(true)}>
              <Text style={[styles.dateText, { color: colors.primary }]}>{formatDateToYYYYMMDD(endDate)}</Text>
            </TouchableOpacity>
          </View>
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              minimumDate={startDate}
              onChange={(_, selectedDate) => {
                setShowEndDatePicker(Platform.OS === 'ios');
                if (selectedDate) setEndDate(selectedDate);
              }}
            />
          )}

          {overlapWarning && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>{overlapWarning}</Text>
            </View>
          )}

          <View style={[styles.modalSwitchContainer, { borderTopColor: colors.secondary }]}>
            <Text style={[styles.modalSwitchLabel, { color: colors.text }]}>Auto-generate with AI ✨</Text>
            <Switch
              trackColor={{ false: "#E5E7EB", true: colors.primary }}
              thumbColor={autoGenerate ? colors.primary : "#f4f3f4"}
              onValueChange={setAutoGenerate}
              value={autoGenerate}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }, isCreating && styles.disabledButton]}
            onPress={handleSave}
            disabled={isCreating}
          >
            {isCreating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Create Itinerary</Text>}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { paddingHorizontal: 20, paddingTop: 10, borderTopRightRadius: 20, borderTopLeftRadius: 20, paddingBottom: 40 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#D1D5DB', borderRadius: 3, alignSelf: 'center', marginVertical: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  input: { borderWidth: 1, padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 15 },
  budgetButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  budgetButton: { flex: 1, paddingVertical: 12, borderWidth: 1.5, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  budgetButtonSelected: {},
  budgetButtonText: { fontSize: 14, fontWeight: '600' },
  budgetButtonTextSelected: { fontWeight: 'bold' },
  customBudgetContainer: { flexDirection: 'row', marginBottom: 15 },
  customBudgetInput: { flex: 3, borderWidth: 1, padding: 12, borderRadius: 8, fontSize: 16, marginRight: 10 },
  currencyInput: { flex: 1, borderWidth: 1, padding: 12, borderRadius: 8, fontSize: 16, textAlign: 'center', fontWeight: 'bold' },
  datePickerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  dateLabel: { fontSize: 16, fontWeight: '500' },
  dateText: { fontSize: 16, fontWeight: 'bold' },
  warningContainer: { backgroundColor: '#FFFBEB', borderColor: '#FBBF24', borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 10, marginBottom: 5 },
  warningText: { color: '#B45309', fontSize: 14, fontWeight: '500', textAlign: 'center' },
  modalSwitchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, marginTop: 10, marginBottom: 20 },
  modalSwitchLabel: { fontSize: 16, fontWeight: '500' },
  saveButton: { padding: 15, borderRadius: 8, alignItems: 'center' },
  disabledButton: { opacity: 0.5 },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});