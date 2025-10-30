import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ProgressIndicator from "../../../components/ProgressIndicator";
import { API_URL } from '../../config';

const STEPS = [
  {
    key: 'tourist_type',
    question: 'What kind of tourist are you?',
    data: [
      { id: "1", label: "Adventurous", image: require("../../../assets/images/adventurous.jpg") },
      { id: "2", label: "Relaxed", image: require("../../../assets/images/relaxed.jpg") },
      { id: "3", label: "Cultural", image: require("../../../assets/images/cultural.jpg") },
      { id: "4", label: "Foodie", image: require("../../../assets/images/foodie.jpg") },
    ]
  },
  {
    key: 'preferred_activities',
    question: 'What activities do you prefer?',
    data: [
      { id: "1", label: "Sightseeing", image: require("../../../assets/images/Sightseeing.jpg") },
      { id: "2", label: "Nature", image: require("../../../assets/images/Nature.jpg") },
      { id: "3", label: "Shopping", image: require("../../../assets/images/Shopping.jpg") },
      { id: "4", label: "Museum", image: require("../../../assets/images/Museum.jpg") },
    ]
  },
  {
    key: 'preferred_cuisines',
    question: 'What kind of cuisine do you prefer?',
    data: [
      { id: "1", label: "Local", image: require("../../../assets/images/Local.jpg") },
      { id: "2", label: "International", image: require("../../../assets/images/International.avif") },
      { id: "3", label: "Street Food", image: require("../../../assets/images/StreetFood.jpg") },
      { id: "4", label: "Vegetarian", image: require("../../../assets/images/Vegetarian.jpg") },
    ]
  },
  {
    key: 'preferred_dining',
    question: 'What types of dining experiences interest you?',
    data: [
      { id: "1", label: "Riverside Dining", image: require("../../../assets/images/RiversideRestaurants.jpg") },
      { id: "2", label: "Night Market Vibes", image: require("../../../assets/images/NightMarket.jpg") },
      { id: "3", label: "Quiet Cafes", image: require("../../../assets/images/QiuetCafe.png") },
      { id: "4", label: "Scenic Views", image: require("../../../assets/images/ScenicViewDinning.jpg") },
    ]
  },
  {
    key: 'preferred_times',
    question: 'What are your preferred times to travel?',
    data: [
      { id: "1", label: "Daytime", image: require("../../../assets/images/DayTime.avif") },
      { id: "2", label: "Nighttime", image: require("../../../assets/images/NightTime.jpg") },
    ]
  }
];

export default function PersonalizationScreen() {
  const router = useRouter();
  const { editMode } = useLocalSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const currentStepData = STEPS[currentStep];

  useEffect(() => {
    const initializeSelections = async () => {
      const allKeys = STEPS.map(step => step.key);
      
      // *** FIX IS HERE: Clear storage if not in edit mode ***
      if (!editMode) {
        await AsyncStorage.multiRemove(allKeys);
        setSelections({});
        return; // Exit early for new users
      }
      
      // Load existing selections if in edit mode
      const allSelections = {};
      for (const step of STEPS) {
        try {
          const saved = await AsyncStorage.getItem(step.key);
          if (saved) {
            allSelections[step.key] = JSON.parse(saved);
          }
        } catch (error) {
          console.error(`Error loading ${step.key}:`, error);
        }
      }
      setSelections(allSelections);
    };

    initializeSelections();

    // Cleanup function to reset state when leaving the screen
    return () => {
        setSelections({});
    }
  }, [editMode]);

  const toggleSelection = (label) => {
    const currentKey = currentStepData.key;
    const currentSelection = selections[currentKey] || [];
    const newSelection = currentSelection.includes(label)
      ? currentSelection.filter((item) => item !== label)
      : [...currentSelection, label];
    setSelections({ ...selections, [currentKey]: newSelection });
  };

  const handleNext = async () => {
    const currentKey = currentStepData.key;
    const currentSelection = selections[currentKey] || [];

    if (currentSelection.length === 0) {
      Alert.alert("Selection Required", `Please select at least one option to continue.`);
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await savePersonalization();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      if (editMode) {
        router.back();
      } else {
        router.replace("/auth/sign-in");
      }
    }
  };

  const savePersonalization = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("firebase_id_token");
      if (!token) {
        Alert.alert("Authentication Error", "You are not logged in.");
        router.replace("/auth/sign-in");
        return;
      }
      
      const allKeys = STEPS.map(step => step.key);
      const personalizationData = {};
      for(const key of allKeys){
         // Ensure the final step's selection is included before saving
        if (key === currentStepData.key) {
            personalizationData[key] = selections[key] || [];
        } else {
            personalizationData[key] = JSON.parse(await AsyncStorage.getItem(key) || "[]");
        }
      }

      await axios.post(
        `${API_URL}/auth/personalization`,
        personalizationData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await AsyncStorage.multiRemove(allKeys);

      Alert.alert("Success!", "Your preferences have been saved.");
      if (editMode) {
        router.back(); // Go back if we were editing
      } else {
        router.replace("/dashboard"); // Go to dashboard for new users
      }

    } catch (error) {
      console.error("Error saving personalization:", error.response ? error.response.data : error);
      Alert.alert("Error", "Failed to save your preferences. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = (selections[currentStepData.key] || []).includes(item.label);
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.selectedCard]}
        onPress={() => toggleSelection(item.label)}
      >
        <Image source={item.image} style={styles.image} />
        <View style={styles.overlay} />
        <Text style={styles.label}>{item.label}</Text>
        {isSelected && (
          <View style={styles.checkmark}>
            <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Let&apos;s Get Personal</Text>
        <Text style={styles.subtitle}>Select your preferences to get tailored itinerary plans.</Text>
        <ProgressIndicator currentStep={currentStep + 1} totalSteps={STEPS.length} />
      </View>
      
      <Text style={styles.question}>{currentStepData.question}</Text>

      <FlatList
        data={currentStepData.data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        style={styles.list}
      />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handlePrevious} style={[styles.button, styles.secondaryButton]}>
          <Text style={styles.secondaryButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} style={[styles.button, styles.primaryButton]} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {currentStep === STEPS.length - 1 ? 'Finish' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const CARD_SIZE = (Dimensions.get("window").width - 60) / 2;

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFFFFF', flex: 1, paddingBottom: 20 },
  header: {
    padding: 25,
    paddingTop: 50,
    alignItems: 'center'
  },
  title: { fontSize: 32, color: '#1F2937', fontFamily: "outfit-bold", textAlign: "center", paddingTop: 40 },
  subtitle: { fontSize: 16, color: '#6B7280', fontFamily: "outfit", textAlign: "center", marginTop: 10, maxWidth: '80%' },
  question: { fontSize: 22, color: '#1F2937', fontFamily: "outfit-bold", marginBottom: 10, paddingHorizontal: 25 },
  list: {
    paddingHorizontal: 25,
  },
  card: { 
    width: CARD_SIZE, 
    height: 150, 
    marginVertical: 10, 
    borderRadius: 16,
    overflow: "hidden", 
    backgroundColor: '#7E9DFF',
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  selectedCard: { 
    borderColor: '#6366F1' 
  },
  image: { width: "100%", height: "100%", position: "absolute" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
  label: { color: '#FFFFFF', fontFamily: "outfit-bold", fontSize: 18, textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 3, },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 20,
    paddingBottom: 50,
  },
  button: { 
    paddingVertical: 15, 
    borderRadius: 99, 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  primaryButton: { 
    backgroundColor: '#1F2937',
    marginLeft: 10,
  },
  secondaryButton: { 
    backgroundColor: '#E5E7EB',
    marginRight: 10,
  },
  primaryButtonText: { fontFamily: "outfit-bold", fontSize: 16, color: '#FFFFFF' },
  secondaryButtonText: { fontFamily: "outfit-bold", fontSize: 16, color: '#374151' },
});