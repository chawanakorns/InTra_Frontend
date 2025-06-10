import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { SafeAreaView } from "react-native-safe-area-context";

type Itinerary = {
  id: string;
  type: string;
  budget: string;
  name: string;
  startDate: Date;
  endDate: Date;
  schedule: any[];
};

export default function CalendarScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItineraryType, setSelectedItineraryType] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("");
  const [itineraryName, setItineraryName] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notification, setNotification] = useState({ visible: false, title: "", message: "" });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const panY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(panY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(handleCloseModal);
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    const initialWeekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
    setWeekDates(initialWeekDates);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAddButtonPress = () => {
    Animated.timing(panY, {
      toValue: 0,
      duration: 0,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(true);
      setCurrentStep(1);
    });
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setCurrentStep(1);
    setSelectedItineraryType("");
    setSelectedBudget("");
    setItineraryName("");
    setStartDate(new Date());
    setEndDate(new Date());
    Animated.timing(panY, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateItinerary = async () => {
    const newItinerary = {
      id: Date.now().toString(),
      type: selectedItineraryType,
      budget: selectedBudget,
      name: itineraryName,
      startDate,
      endDate,
      schedule: [],
    };
    setItineraries([...itineraries, newItinerary]);
    setSelectedItinerary(newItinerary);
    handleCloseModal();

    // Show success notification
    setNotification({ visible: true, title: "InTra", message: "Successfully to create itinerary" });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setNotification({ visible: false, title: "", message: "" }));
      }, 3000);
    });
  };

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 6 + i;
    return `${hour.toString().padStart(2, "0")}:00 ${hour < 12 ? "AM" : hour === 12 ? "PM" : "PM"}`;
  });

  const renderModalContent = () => {
    switch (currentStep) {
      case 1:
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
                selectedItineraryType === "auto" && styles.selectedOption,
              ]}
              onPress={() => setSelectedItineraryType("auto")}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor:
                      selectedItineraryType === "auto" ? "#1F2937" : "#9CA3AF",
                  },
                ]}
              />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Auto-generated Itinerary</Text>
                <Text style={styles.optionDescription}>
                  AI-powered solution that creates a tailored itinerary — come
                  with completed itinerary that based on your personalized
                  information.
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedItineraryType === "custom" && styles.selectedOption,
              ]}
              onPress={() => setSelectedItineraryType("custom")}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor:
                      selectedItineraryType === "custom"
                        ? "#1F2937"
                        : "#9CA3AF",
                  },
                ]}
              />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Custom Itinerary</Text>
                <Text style={styles.optionDescription}>
                  Craft your own adventure with a custom itinerary — come with
                  an empty schedule, you can choose your preferred cuisine and
                  dining experiences freely.
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                !selectedItineraryType && styles.disabledButton,
              ]}
              onPress={handleNext}
              disabled={!selectedItineraryType}
            >
              <Text style={styles.actionButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );
      case 2:
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
              onPress={() => setSelectedBudget("budget-friendly")}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor:
                      selectedBudget === "budget-friendly"
                        ? "#1F2937"
                        : "#9CA3AF",
                  },
                ]}
              />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>
                  Budget-friendly{" "}
                  <Text style={styles.budgetRange}>(500-1,000 THB)</Text>
                </Text>
                <Text style={styles.optionDescription}>
                  Affordable local eats and free or low-cost attractions —
                  perfect for stretching your budget while still exploring the
                  best sights.
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedBudget === "comfort" && styles.selectedOption,
              ]}
              onPress={() => setSelectedBudget("comfort")}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor:
                      selectedBudget === "comfort" ? "#1F2937" : "#9CA3AF",
                  },
                ]}
              />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>
                  Comfort & Value{" "}
                  <Text style={styles.budgetRange}>(1,500-2,500 THB)</Text>
                </Text>
                <Text style={styles.optionDescription}>
                  Well-rated restaurants and popular attractions that balance
                  quality and price — offering great experiences without
                  breaking the bank.
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedBudget === "premium" && styles.selectedOption,
              ]}
              onPress={() => setSelectedBudget("premium")}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor:
                      selectedBudget === "premium" ? "#1F2937" : "#9CA3AF",
                  },
                ]}
              />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>
                  Premium & Luxury{" "}
                  <Text style={styles.budgetRange}>(3,500-5,000+ THB)</Text>
                </Text>
                <Text style={styles.optionDescription}>
                  High-end dining, exclusive experiences, and premium
                  attractions for travelers seeking the finest and most
                  indulgent options.
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  !selectedBudget && styles.disabledButton,
                ]}
                onPress={handleNext}
                disabled={!selectedBudget}
              >
                <Text style={styles.actionButtonText}>Next</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={handlePrevious}
              >
                <Text
                  style={[styles.actionButtonText, styles.secondaryButtonText]}
                >
                  Previous
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 3:
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
                  (!itineraryName || !startDate || !endDate) &&
                    styles.disabledButton,
                ]}
                onPress={handleCreateItinerary}
                disabled={!itineraryName || !startDate || !endDate}
              >
                <Text style={styles.actionButtonText}>Create Itinerary</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={handlePrevious}
              >
                <Text
                  style={[styles.actionButtonText, styles.secondaryButtonText]}
                >
                  Previous
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const renderContent = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Good {getTimeOfDay(currentTime)}, User
        </Text>
        <View style={styles.headerRow}>
          <Text style={styles.date}>{formatDate(selectedDate)}</Text>
          {itineraries.length > 0 && (
            <View style={styles.itineraryPicker}>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                iconStyle={styles.iconStyle}
                data={itineraries.map((it) => ({
                  label: it.name || "Itinerary",
                  value: it.id,
                }))}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select Itinerary"
                value={selectedItinerary?.id}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setIsDropdownOpen(false)}
                onChange={(item) => {
                  const itinerary = itineraries.find(
                    (it) => it.id === item.value
                  );
                  setSelectedItinerary(itinerary ?? null);
                }}
                renderRightIcon={() => (
                  <Text
                    style={[
                      styles.dropdownArrow,
                      isDropdownOpen && styles.dropdownArrowOpen,
                    ]}
                  >
                    ▼
                  </Text>
                )}
              />
            </View>
          )}
        </View>
      </View>

      <View style={styles.calendarContainer}>
        <View style={styles.dayHeaders}>
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
            <View key={day} style={styles.dayHeaderCell}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>
        <View style={styles.datesRow}>
          {weekDates.map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateCell,
                date.toDateString() === selectedDate.toDateString() &&
                  styles.selectedDateCell,
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text
                style={[
                  styles.dateNumber,
                  date.toDateString() === selectedDate.toDateString() &&
                    styles.selectedDateNumber,
                ]}
              >
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedItinerary ? (
        <View style={styles.timelineContainer}>
          <View style={styles.timelineHeader}>
            <Text style={styles.timelineTitle}>Timeline</Text>
          </View>
          {timeSlots.map((time, index) => (
            <View key={time} style={styles.timelineRow}>
              <Text style={styles.timelineTime}>{time}</Text>
              <View style={styles.timelineDivider}>
                {index !== timeSlots.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>It is empty now.</Text>
          <Text style={styles.emptySubtitle}>Enter your first</Text>
          <Text style={styles.emptySubtitle}>itinerary</Text>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={styles.safeArea}>
        {selectedItinerary ? (
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {renderContent()}
          </ScrollView>
        ) : (
          <View style={styles.container}>{renderContent()}</View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddButtonPress}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>

        {notification.visible && (
          <Animated.View style={[styles.notification, { opacity: fadeAnim }]}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationClose}
              onPress={() => {
                Animated.timing(fadeAnim, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => setNotification({ visible: false, title: "", message: "" }));
              }}
            >
              <Text style={styles.notificationCloseText}>×</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </SafeAreaView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay} {...panResponder.panHandlers}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: panY }],
                height:
                  currentStep === 1 ? "60%" : currentStep === 2 ? "85%" : "70%",
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
              {renderModalContent()}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function getTimeOfDay(date: Date) {
  const hours = date.getHours();
  if (hours < 12) return "Morning";
  if (hours < 17) return "Afternoon";
  return "Evening";
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    position: "relative",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    padding: 20,
    paddingBottom: 100,
    minHeight: "100%",
  },
  header: {
    marginBottom: 30,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  date: {
    fontSize: 18,
    fontWeight: "500",
    color: "#6B7280",
  },
  itineraryPicker: {
    flexDirection: "row",
    alignItems: "center",
  },
  dropdown: {
    height: 40,
    width: 150,
    backgroundColor: "#6366F1",
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  dropdownArrow: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 5,
  },
  dropdownArrowOpen: {
    transform: [{ rotate: "180deg" }],
  },
  calendarContainer: {
    marginBottom: 5,
  },
  dayHeaders: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dayHeaderCell: {
    width: 40,
    alignItems: "center",
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  datesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateCell: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  selectedDateCell: {
    backgroundColor: "#6366F1",
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  selectedDateNumber: {
    color: "#FFFFFF",
  },
  timelineContainer: {
    marginTop: 20,
    paddingLeft: 10,
  },
  timelineHeader: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 10,
  },
  timelineTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  timelineTime: {
    fontSize: 16,
    color: "#6B7280",
    width: 80,
    marginRight: 10,
  },
  timelineDivider: {
    flex: 1,
    alignItems: "flex-start",
  },
  timelineLine: {
    width: 2,
    height: "100%",
    backgroundColor: "#E5E7EB",
  },
  emptyState: {
    alignItems: "center",
    marginBottom: 60,
    padding: 20,
    flex: 1,
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    color: "#9CA3AF",
    marginBottom: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 36,
    color: "#1F2937",
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 34,
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    fontSize: 30,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 2,
  },
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
  modalContentContainer: {
    paddingBottom: 30,
    minHeight: "100%",
  },
  modalScrollView: {
    flex: 1,
  },
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
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#6366F1",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButtonText: {
    color: "#6366F1",
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 20,
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
  notification: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#6B7280",
  },
  notificationClose: {
    padding: 5,
  },
  notificationCloseText: {
    fontSize: 18,
    color: "#9CA3AF",
  },
});