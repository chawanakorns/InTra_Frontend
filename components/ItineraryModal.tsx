import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from 'react';
import { Alert, Animated, Modal, ScrollView, StyleSheet, View } from 'react-native';
import BudgetStep from './BudgetStep';
import ItineraryDetailsStep from './ItineraryDetailsStep';
import ItineraryTypeStep from './ItineraryTypeStep';

interface ItineraryModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateItinerary: (itinerary: any) => void;
  panY: Animated.Value;
  panResponder: any;
  backendApiUrl: string; // Receive the backend URL
}

const ItineraryModal: React.FC<ItineraryModalProps> = ({
  visible,
  onClose,
  onCreateItinerary,
  panY,
  panResponder,
  backendApiUrl,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [itineraryName, setItineraryName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isCreating, setIsCreating] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const handleNext = () => setCurrentStep(currentStep + 1);
  const handlePrevious = () => setCurrentStep(currentStep - 1);

  // Fetch the token when the modal is opened (visible)
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("access_token");
        if (storedToken) {
          setToken(storedToken);
        } else {
          Alert.alert("Authentication Error", "No access token found.");
          onClose(); // Close modal if no token
        }
      } catch (error) {
        console.error("Error fetching token:", error);
        Alert.alert(
          "Error",
          "Failed to retrieve authentication token. Please try again."
        );
        onClose();
      }
    };

    if (visible) {
      fetchToken();
    } else {
      // Reset token when modal is closed
      setToken(null);
    }
  }, [visible, onClose]);

  const handleCreate = async () => {
    setIsCreating(true);

    if (!token) {
      Alert.alert(
        "Authentication Error",
        "No access token available. Please log in again."
      );
      setIsCreating(false);
      onClose();
      return;
    }

    try {
      const response = await fetch(`${backendApiUrl}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: selectedType,
          budget: selectedBudget,
          name: itineraryName,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `Failed to create itinerary. Server returned ${response.status}`;
        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      const newItinerary = {
        id: responseData.id.toString(),
        type: selectedType,
        budget: selectedBudget,
        name: itineraryName,
        startDate,
        endDate,
        schedule: [],
      };
      onCreateItinerary(newItinerary);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating itinerary:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create itinerary'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedType('');
    setSelectedBudget('');
    setItineraryName('');
    setStartDate(new Date());
    setEndDate(new Date());
  };

  const getModalHeight = () => {
    switch (currentStep) {
      case 1: return "60%";
      case 2: return "85%";
      case 3: return "70%";
      default: return "60%";
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: panY }],
              height: getModalHeight(),
            },
          ]}
        >
          <View style={styles.dragHandle}>
            <View style={styles.dragIndicator} />
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalContentContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {currentStep === 1 && (
              <ItineraryTypeStep
                selectedType={selectedType}
                onSelectType={setSelectedType}
                onNext={handleNext}
              />
            )}

            {currentStep === 2 && (
              <BudgetStep
                selectedBudget={selectedBudget}
                onSelectBudget={setSelectedBudget}
                onNext={handleNext}
                onPrevious={handlePrevious}
              />
            )}

            {currentStep === 3 && (
              <ItineraryDetailsStep
                itineraryName={itineraryName}
                setItineraryName={setItineraryName}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                onCreate={handleCreate} // Pass the handleCreate function
                onPrevious={handlePrevious}
                isCreating={isCreating}
              />
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: 700,
    width: "100%",
  },
  modalScrollView: {
    flex: 1,
  },
  modalContentContainer: {
    paddingBottom: 30,
    minHeight: "100%",
  },
  dragHandle: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 10,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
  },
});

export default ItineraryModal;