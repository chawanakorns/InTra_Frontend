import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type ScheduleItem = {
  id: string;
  place_id: string;
  place_name: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  [key: string]: any; 
};

type Itinerary = {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  [key: string]: any;
};

interface Props {
  visible: boolean;
  item: ScheduleItem | null;
  itinerary: Itinerary | null;
  onClose: () => void;
  onSave: (itemId: string | null, newDate: string, newTime: string, newDuration: number) => void;
}

const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ScheduleItemEditModal: React.FC<Props> = ({ visible, item, itinerary, onClose, onSave }) => {
  const { colors } = useTheme();

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [duration, setDuration] = useState('60');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (item) {
        const [year, month, day] = item.scheduled_date.split('-').map(Number);
        const [hours, minutes] = item.scheduled_time.split(':').map(Number);
        const initialDateTime = new Date(year, month - 1, day, hours, minutes);
        
        setDate(initialDateTime);
        setTime(initialDateTime);
        setDuration(item.duration_minutes.toString());
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
    const itemId = item.id || null; 
    const scheduled_date = formatDateToYYYYMMDD(date);
    const scheduled_time = time.toTimeString().slice(0, 5);
    const newDuration = parseInt(duration, 10) || 60;
    onSave(itemId, scheduled_date, scheduled_time, newDuration);
  };

  const getSafeDate = (dateSource: Date | string) => {
    if (dateSource instanceof Date) {
        return dateSource;
    }
    const [year, month, day] = dateSource.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Schedule Item</Text>
          <Text style={[styles.itemName, { color: colors.icon }]}>{item.place_name}</Text>

          <View style={styles.pickerContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Date:</Text>
            <TouchableOpacity style={[styles.pickerButton, { backgroundColor: colors.secondary, borderColor: colors.cardBorder }]} onPress={() => setShowDatePicker(true)}>
                <Text style={[styles.pickerText, { color: colors.text }]}>{formatDateToYYYYMMDD(date)}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.pickerContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Time:</Text>
             <TouchableOpacity style={[styles.pickerButton, { backgroundColor: colors.secondary, borderColor: colors.cardBorder }]} onPress={() => setShowTimePicker(true)}>
                <Text style={[styles.pickerText, { color: colors.text }]}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.pickerContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Duration (min):</Text>
            <TextInput
              style={[styles.durationInput, { backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }]}
              value={duration}
              onChangeText={setDuration}
              placeholder="e.g., 60"
              keyboardType="number-pad"
              placeholderTextColor={colors.icon}
            />
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={getSafeDate(itinerary.startDate)}
              maximumDate={getSafeDate(itinerary.endDate)}
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
            <TouchableOpacity style={[styles.button, styles.buttonClose, { backgroundColor: colors.secondary }]} onPress={onClose}>
              <Text style={[styles.textStyleClose, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonSave, { backgroundColor: colors.primary }]} onPress={handleSave}>
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
    modalView: { width: '90%', borderRadius: 20, padding: 25, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    itemName: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
    pickerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, width: '100%' },
    label: { fontSize: 16, marginRight: 10, fontWeight: '500'},
    pickerButton: { flex: 1, padding: 12, borderWidth: 1, borderRadius: 8 },
    pickerText: { fontSize: 16 },
    durationInput: {
      flex: 1,
      padding: 12,
      borderWidth: 1,
      borderRadius: 8,
      fontSize: 16,
      textAlign: 'left',
    },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, width: '100%' },
    button: { borderRadius: 10, paddingVertical: 12, elevation: 2, flex: 1, marginHorizontal: 5 },
    buttonClose: {},
    buttonSave: {},
    textStyleSave: { color: "white", fontWeight: "bold", textAlign: "center" },
    textStyleClose: { fontWeight: "bold", textAlign: "center" },
});