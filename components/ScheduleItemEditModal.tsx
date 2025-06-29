import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- FIX: Type definitions moved directly into this file ---
type ScheduleItem = {
  id: string;
  place_id: string;
  place_name: string;
  scheduled_date: string;
  scheduled_time: string;
  // Other properties are optional
  [key: string]: any; 
};

type Itinerary = {
  id: string;
  startDate: Date;
  endDate: Date;
  // Other properties are optional
  [key: string]: any;
};

interface Props {
  visible: boolean;
  item: ScheduleItem | null;
  itinerary: Itinerary | null;
  onClose: () => void;
  onSave: (itemId: string | null, newDate: string, newTime: string) => void;
}
// --- End of Fix ---

export const ScheduleItemEditModal: React.FC<Props> = ({ visible, item, itinerary, onClose, onSave }) => {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (item) {
        // Use a less ambiguous way to set the initial date and time
        const [year, month, day] = item.scheduled_date.split('-').map(Number);
        const [hours, minutes] = item.scheduled_time.split(':').map(Number);
        const initialDateTime = new Date(year, month - 1, day, hours, minutes);
        
        setDate(initialDateTime);
        setTime(initialDateTime);
    }
  }, [item]);

  if (!item || !itinerary) return null;

  const onDateChange = (_event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const onTimeChange = (_event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios');
    setTime(currentTime);
  };

  const handleSave = () => {
    // The item's original ID is used if it exists (update), otherwise it's null (create)
    const itemId = item.id || null; 
    
    // Format date to YYYY-MM-DD
    const scheduled_date = date.toISOString().split('T')[0];
    
    // Format time to HH:MM
    const scheduled_time = time.toTimeString().slice(0, 5);
    
    onSave(itemId, scheduled_date, scheduled_time);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{item.id ? "Edit Schedule Item" : "Add to Itinerary"}</Text>
          <Text style={styles.itemName}>{item.place_name}</Text>

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Date:</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.pickerText}>{date.toLocaleDateString('en-CA')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Time:</Text>
             <TouchableOpacity style={styles.pickerButton} onPress={() => setShowTimePicker(true)}>
                <Text style={styles.pickerText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date(itinerary.startDate)}
              maximumDate={new Date(itinerary.endDate)}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
            />
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.buttonClose]} onPress={onClose}>
              <Text style={styles.textStyleClose}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonSave]} onPress={handleSave}>
              <Text style={styles.textStyleSave}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    centeredView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { width: '90%', backgroundColor: "white", borderRadius: 20, padding: 25, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    itemName: { fontSize: 16, color: '#6b7280', marginBottom: 20, textAlign: 'center' },
    pickerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, width: '100%' },
    label: { fontSize: 16, marginRight: 10, color: '#374151', fontWeight: '500'},
    pickerButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, backgroundColor: '#F9FAFB' },
    pickerText: { fontSize: 16, color: '#1F2937' },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, width: '100%' },
    button: { borderRadius: 10, paddingVertical: 12, elevation: 2, flex: 1, marginHorizontal: 5 },
    buttonClose: { backgroundColor: "#E5E7EB" },
    buttonSave: { backgroundColor: "#6366F1" },
    textStyleSave: { color: "white", fontWeight: "bold", textAlign: "center" },
    textStyleClose: { color: "#1F2937", fontWeight: "bold", textAlign: "center" },
});