import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Sample data for the restaurant
const restaurantData = {
  id: '1',
  name: 'TERRA',
  description: 'The weather is nice these days. The atmosphere at the restaurant, especially the al fresco area, is very festive. There is a big CHRISTMAS tree in the middle and soft jazz music is playing.',
  menu: [
    'Goat Cheese and Balsamic Honey Fig Dressing',
    'Gambas al Ajillo, Linguine with Seafood',
    'Chang Mai Lamb Chops with Tomatoes and Mint',
    'Chops. It is cooked to perfection. The lamb flavor. The flavor is just so good.',
  ],
  image: require('./../../assets/images/attraction.jpg'),
};

export default function RestaurantDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;

  const restaurant = restaurantData;

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [itineraryName, setItineraryName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Drag to close animation
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

  // Handle opening modal
  const handleAddButtonPress = () => {
    Animated.timing(panY, {
      toValue: 0,
      duration: 0,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(true);
    });
  };

  // Handle closing modal and reset states
  const handleCloseModal = () => {
    setModalVisible(false);
    setItineraryName('');
    setStartDate('');
    setEndDate('');
    Animated.timing(panY, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Handle create itinerary
  const handleCreateItinerary = () => {
    console.log('Creating itinerary:', {
      name: itineraryName,
      startDate,
      endDate,
      restaurantId: id,
    });
    handleCloseModal();
  };

  // Render modal content (only the "Create new itinerary" step)
  const renderModalContent = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Select Itinerary to Add </Text>
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
          <TextInput
            style={[styles.textInput, styles.dateInput]}
            placeholder="Start date"
            value={startDate}
            onChangeText={setStartDate}
          />
          <TextInput
            style={[styles.textInput, styles.dateInput]}
            placeholder="End date"
            value={endDate}
            onChangeText={setEndDate}
          />
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            (!itineraryName || !startDate || !endDate) && styles.disabledButton,
          ]}
          onPress={handleCreateItinerary}
          disabled={!itineraryName || !startDate || !endDate}
        >
          <Text style={styles.actionButtonText}>Create Itinerary</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Restaurant Image */}
        <Image source={restaurant.image} style={styles.image} />

        {/* Restaurant Name */}
        <Text style={styles.name}>{restaurant.name}</Text>

        {/* Description */}
        <Text style={styles.description}>{restaurant.description}</Text>

        {/* Menu Items */}
        <Text style={styles.menuTitle}>We ordered dishes:</Text>
        {restaurant.menu.map((item, index) => (
          <Text key={index} style={styles.menuItem}>
            • {item}
          </Text>
        ))}

        {/* Add Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddButtonPress}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal
        animationType="slide"
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
                height: '70%',
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: {
    paddingBottom: 80, // Add padding to ensure button is visible and scrollable
  },
  header: { 
    padding: 16, 
    flexDirection: 'row', 
    justifyContent: 'flex-end' 
  },
  image: { 
    width: '100%', 
    height: 200, 
    resizeMode: 'cover' 
  },
  name: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    padding: 16 
  },
  description: { 
    fontSize: 16, 
    color: '#444', 
    paddingHorizontal: 16, 
    marginBottom: 16 
  },
  menuTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    paddingHorizontal: 16, 
    marginBottom: 8 
  },
  menuItem: { 
    fontSize: 16, 
    color: '#444', 
    paddingHorizontal: 16, 
    marginBottom: 4 
  },
  buttonContainer: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 32, // Add extra spacing above the button to push it "more below"
  },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    left:340
  },
  addButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: 700,
    width: '100%',
  },
  modalContentContainer: {
    paddingBottom: 30,
    minHeight: '100%',
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 0,
    flex: 1,
    minHeight: '100%',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  actionButton: {
    backgroundColor: '#6366F1',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  dragHandle: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
});