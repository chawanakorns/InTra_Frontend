import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BudgetStepProps {
  selectedBudget: string;
  onSelectBudget: (budget: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const BudgetStep: React.FC<BudgetStepProps> = ({ selectedBudget, onSelectBudget, onNext, onPrevious }) => {
  return (
    <View style={styles.modalContent}>
      <View style={styles.progressBar}>
        <View style={[styles.progressSegment, styles.activeProgress]} />
        <View style={[styles.progressSegment, styles.activeProgress]} />
        <View style={styles.progressSegment} />
      </View>
      <Text style={styles.modalTitle}>Select a budget</Text>
      
      <TouchableOpacity
        style={[
          styles.optionCard,
          selectedBudget === "budget-friendly" && styles.selectedOption,
        ]}
        onPress={() => onSelectBudget("budget-friendly")}
      >
        <View
          style={[
            styles.optionIcon,
            { backgroundColor: selectedBudget === "budget-friendly" ? "#1F2937" : "#9CA3AF" },
          ]}
        />
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>
            Budget-friendly <Text style={styles.budgetRange}>(500-1,000 THB)</Text>
          </Text>
          <Text style={styles.optionDescription}>
            Affordable local eats and free or low-cost attractions — perfect for stretching your budget while still exploring the best sights.
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.optionCard,
          selectedBudget === "comfort" && styles.selectedOption,
        ]}
        onPress={() => onSelectBudget("comfort")}
      >
        <View
          style={[
            styles.optionIcon,
            { backgroundColor: selectedBudget === "comfort" ? "#1F2937" : "#9CA3AF" },
          ]}
        />
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>
            Comfort & Value <Text style={styles.budgetRange}>(1,500-2,500 THB)</Text>
          </Text>
          <Text style={styles.optionDescription}>
            Well-rated restaurants and popular attractions that balance quality and price — offering great experiences without breaking the bank.
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.optionCard,
          selectedBudget === "premium" && styles.selectedOption,
        ]}
        onPress={() => onSelectBudget("premium")}
      >
        <View
          style={[
            styles.optionIcon,
            { backgroundColor: selectedBudget === "premium" ? "#1F2937" : "#9CA3AF" },
          ]}
        />
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>
            Premium & Luxury <Text style={styles.budgetRange}>(3,500-5,000+ THB)</Text>
          </Text>
          <Text style={styles.optionDescription}>
            High-end dining, exclusive experiences, and premium attractions for travelers seeking the finest and most indulgent options.
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, !selectedBudget && styles.disabledButton]}
          onPress={onNext}
          disabled={!selectedBudget}
        >
          <Text style={styles.actionButtonText}>Next</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={onPrevious}
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
  budgetRange: {
    fontWeight: "normal",
    fontSize: 14,
    color: "#6B7280",
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

export default BudgetStep;