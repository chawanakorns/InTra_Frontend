import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ItineraryDetailsStepProps {
  itineraryName: string;
  setItineraryName: (name: string) => void;
  startDate: Date;
  setStartDate: (date: Date) => void;
  endDate: Date;
  setEndDate: (date: Date) => void;
  onCreate: () => void;
  onPrevious: () => void;
  isCreating: boolean;
}

const ItineraryDetailsStep: React.FC<ItineraryDetailsStepProps> = ({
  itineraryName,
  setItineraryName,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onCreate,
  onPrevious,
  isCreating,
}) => {
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  return (
    <View style={styles.modalContent}>
      <View style={styles.progressBar}>
        <View style={[styles.progressSegment, styles.activeProgress]} />
        <View style={[styles.progressSegment, styles.activeProgress]} />
        <View style={[styles.progressSegment, styles.activeProgress]} />
      </View>
      <Text style={styles.modalTitle}>Create new itinerary</Text>
      <Text style={styles.modalSubtitle}>
        Build an itinerary and map out your upcoming travel plans
      </Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Museum tour, Food & Drink"
          value={itineraryName}
          onChangeText={setItineraryName}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Trip dates</Text>
        <View style={styles.dateInputContainer}>
          <TouchableOpacity
            style={[styles.textInput, styles.dateInput]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {startDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) setStartDate(selectedDate);
              }}
            />
          )}
          
          <TouchableOpacity
            style={[styles.textInput, styles.dateInput]}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {endDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) setEndDate(selectedDate);
              }}
            />
          )}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            (!itineraryName || !startDate || !endDate || isCreating) && styles.disabledButton,
          ]}
          onPress={onCreate}
          disabled={!itineraryName || !startDate || !endDate || isCreating}
        >
          <Text style={styles.actionButtonText}>
            {isCreating ? 'Creating...' : 'Create Itinerary'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={onPrevious}
          disabled={isCreating}
        >
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            Previous
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingTop: 0,
    flex: 1,
    minHeight: "100%",
    justifyContent: "space-between",
  },
  progressBar: {
    flexDirection: "row",
    marginBottom: 30,
    gap: 8,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
  },
  activeProgress: {
    backgroundColor: "#6366F1",
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
    opacity: 0.9,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dateInputContainer: {
    flexDirection: "row",
    gap: 12,
  },
  dateInput: {
    flex: 1,
    justifyContent: "center",
  },
  dateText: {
    fontSize: 16,
    color: "#1F2937",
  },
  actionButton: {
    backgroundColor: "#6366F1",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: "#E5E7EB",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#6366F1",
  },
  secondaryButtonText: {
    color: "#6366F1",
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
});

export default ItineraryDetailsStep;