import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
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

export default function ItineraryModal({
  visible,
  onClose,
  onCreateItinerary,
  panY,
  panResponder,
  backendApiUrl,
  itineraries,
}: ItineraryModalProps) {
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

    // --- THE FIX: Use the correct Firebase token key ---
    const token = await AsyncStorage.getItem('firebase_id_token');
    if (!token) {
      Alert.alert('Authentication Error', 'Please log in again.');
      setIsCreating(false);
      onClose(); // Close modal and force re-login
      // You might want to navigate to login screen here: router.replace('/auth/sign-in');
      return;
    }

    let budgetPayload: string | null = null;
    if (budgetType === 'Custom') {
      budgetPayload = customBudget ? `${customBudget} ${currency}`.trim() : null;
    } else {
      budgetPayload = budgetType;
    }

    const payload = {
      name,
      budget: budgetPayload,
      type: "Personalized", // This could be dynamic based on auto-generate
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    };

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
      <Text style={styles.label}>Budget (Optional)</Text>
      <View style={styles.budgetButtonsContainer}>
        {BUDGET_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.budgetButton, budgetType === option && styles.budgetButtonSelected]}
            onPress={() => setBudgetType(budgetType === option ? null : option)}
          >
            <Text style={[styles.budgetButtonText, budgetType === option && styles.budgetButtonTextSelected]}>
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
        <TextInput style={styles.customBudgetInput} placeholder="e.g., 500" keyboardType="numeric" value={customBudget} onChangeText={setCustomBudget} />
        <TextInput style={styles.currencyInput} value={currency} onChangeText={setCurrency} autoCapitalize="characters" maxLength={3} />
      </View>
    );
  };

  return (
    <Modal
      animationType="none" // Use none because we are controlling it with Animated
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <Animated.View
          style={[styles.modalContent, { transform: [{ translateY: panY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.dragHandle} />
          <Text style={styles.modalTitle}>New Itinerary</Text>

          <Text style={styles.label}>Itinerary Name</Text>
          <TextInput style={styles.input} placeholder="e.g., Paris Adventure" value={name} onChangeText={setName} />

          {renderBudgetButtons()}
          {renderCustomBudgetInput()}

          <View style={styles.datePickerContainer}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <TouchableOpacity onPress={() => setShowStartDatePicker(true)}>
              <Text style={styles.dateText}>{startDate.toLocaleDateString('en-CA')}</Text>
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

          <View style={styles.datePickerContainer}>
            <Text style={styles.dateLabel}>End Date</Text>
            <TouchableOpacity onPress={() => setShowEndDatePicker(true)}>
              <Text style={styles.dateText}>{endDate.toLocaleDateString('en-CA')}</Text>
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

          <View style={styles.modalSwitchContainer}>
            <Text style={styles.modalSwitchLabel}>Auto-generate with AI ✨</Text>
            <Switch
              trackColor={{ false: "#E5E7EB", true: "#A5B4FC" }}
              thumbColor={autoGenerate ? "#6366F1" : "#f4f3f4"}
              onValueChange={setAutoGenerate}
              value={autoGenerate}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isCreating && styles.disabledButton]}
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
  modalContent: { backgroundColor: 'white', paddingHorizontal: 20, paddingTop: 10, borderTopRightRadius: 20, borderTopLeftRadius: 20, paddingBottom: 40 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#D1D5DB', borderRadius: 3, alignSelf: 'center', marginVertical: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 15 },
  budgetButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  budgetButton: { flex: 1, paddingVertical: 12, borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  budgetButtonSelected: { backgroundColor: '#EDE9FE', borderColor: '#6366F1' },
  budgetButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  budgetButtonTextSelected: { color: '#6366F1' },
  customBudgetContainer: { flexDirection: 'row', marginBottom: 15 },
  customBudgetInput: { flex: 3, borderWidth: 1, borderColor: '#D1D5DB', padding: 12, borderRadius: 8, fontSize: 16, marginRight: 10 },
  currencyInput: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', padding: 12, borderRadius: 8, fontSize: 16, textAlign: 'center', fontWeight: 'bold' },
  datePickerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  dateLabel: { fontSize: 16, fontWeight: '500', color: '#374151' },
  dateText: { fontSize: 16, color: '#6366F1', fontWeight: 'bold' },
  warningContainer: { backgroundColor: '#FFFBEB', borderColor: '#FBBF24', borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 10, marginBottom: 5 },
  warningText: { color: '#B45309', fontSize: 14, fontWeight: '500', textAlign: 'center' },
  modalSwitchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderColor: '#F3F4F6', marginTop: 10, marginBottom: 20 },
  modalSwitchLabel: { fontSize: 16, color: '#374151', fontWeight: '500' },
  saveButton: { backgroundColor: '#6366F1', padding: 15, borderRadius: 8, alignItems: 'center' },
  disabledButton: { backgroundColor: '#A5B4FC' },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});