import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ItineraryTypeStepProps {
  selectedType: string;
  onSelectType: (type: string) => void;
  onNext: () => void;
}

const ItineraryTypeStep: React.FC<ItineraryTypeStepProps> = ({ selectedType, onSelectType, onNext }) => {
  return (
    <View style={styles.modalContent}>
      <View style={styles.progressBar}>
        <View style={[styles.progressSegment, styles.activeProgress]} />
        <View style={styles.progressSegment} />
        <View style={styles.progressSegment} />
      </View>
      <Text style={styles.modalTitle}>Select ways to create</Text>
      
      <TouchableOpacity
        style={[
          styles.optionCard,
          selectedType === "auto" && styles.selectedOption,
        ]}
        onPress={() => onSelectType("auto")}
      >
        <View
          style={[
            styles.optionIcon,
            { backgroundColor: selectedType === "auto" ? "#1F2937" : "#9CA3AF" },
          ]}
        />
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>Auto-generated Itinerary</Text>
          <Text style={styles.optionDescription}>
            AI-powered solution that creates a tailored itinerary — come with completed itinerary that based on your personalized information.
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.optionCard,
          selectedType === "custom" && styles.selectedOption,
        ]}
        onPress={() => onSelectType("custom")}
      >
        <View
          style={[
            styles.optionIcon,
            { backgroundColor: selectedType === "custom" ? "#1F2937" : "#9CA3AF" },
          ]}
        />
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>Custom Itinerary</Text>
          <Text style={styles.optionDescription}>
            Craft your own adventure with a custom itinerary — come with an empty schedule, you can choose your preferred cuisine and dining experiences freely.
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.actionButton, !selectedType && styles.disabledButton]}
        onPress={onNext}
        disabled={!selectedType}
      >
        <Text style={styles.actionButtonText}>Next</Text>
      </TouchableOpacity>
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
  optionCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectedOption: {
    borderWidth: 2,
    borderColor: "#6366F1",
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
    marginTop: 4,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
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
});

export default ItineraryTypeStep;