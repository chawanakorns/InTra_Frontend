import { Colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from '../../config'; // <-- THE FIX: Import the centralized URL

const data = [
  { id: "1", label: "Daytime", image: require("../../../assets/images/adventurous.jpg") },
  { id: "2", label: "Nighttime", image: require("../../../assets/images/adventurous.jpg") },
];

export default function PrefersTimes() {
  const router = useRouter();
  const navigation = useNavigation();
  const { editMode } = useLocalSearchParams();
  const [selected, setSelected] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });

    const loadSelections = async () => {
      try {
        const saved = await AsyncStorage.getItem("preferred_times");
        if (saved) {
          const savedLabels = JSON.parse(saved);
          const savedIds = data.filter((item) => savedLabels.includes(item.label)).map((item) => item.id);
          setSelected(savedIds);
        }
      } catch (error) {
        console.error("Error loading preferred_times:", error);
      }
    };
    loadSelections();
  }, []);

  const toggleSelection = async (id) => {
    const newSelected = selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id];
    setSelected(newSelected);

    const labelsToSave = newSelected.map((selectedId) => data.find((item) => item.id === selectedId)?.label || "");
    await AsyncStorage.setItem("preferred_times", JSON.stringify(labelsToSave));
  };

  const savePersonalization = async () => {
    if (selected.length === 0) {
      Alert.alert("Selection Required", "Please select at least one preferred time to finish.");
      return;
    }

    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem("firebase_id_token");
      if (!token) {
        Alert.alert("Authentication Error", "You are not logged in.");
        router.replace("/auth/sign-in");
        setIsLoading(false);
        return;
      }

      const personalizationData = {
        tourist_type: JSON.parse(await AsyncStorage.getItem("tourist_type") || "[]"),
        preferred_activities: JSON.parse(await AsyncStorage.getItem("preferred_activities") || "[]"),
        preferred_cuisines: JSON.parse(await AsyncStorage.getItem("preferred_cuisines") || "[]"),
        preferred_dining: JSON.parse(await AsyncStorage.getItem("preferred_dining") || "[]"),
        preferred_times: selected.map((selectedId) => data.find((item) => item.id === selectedId)?.label || ""),
      };

      await axios.post(
        `${API_URL}/auth/personalization`, // <-- THE FIX: Use API_URL
        personalizationData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await AsyncStorage.multiRemove([
        "tourist_type",
        "preferred_activities",
        "preferred_cuisines",
        "preferred_dining",
        "preferred_times",
      ]);

      Alert.alert("Success!", "Your preferences have been saved.");
      router.replace("/dashboard");

    } catch (error) {
      console.error("Error saving personalization:", error.response ? error.response.data : error);
      Alert.alert("Error", "Failed to save your preferences. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selected.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.selectedCard]}
        onPress={() => toggleSelection(item.id)}
      >
        <Image source={item.image} style={styles.image} />
        <View style={styles.overlay}><Text style={styles.label}>{item.label}</Text></View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Almost Finished!</Text>
      <Text style={styles.subtitle}>We need to question some questionnaires,{"\n"}for improving your itinerary plans.</Text>
      <Text style={styles.question}>What is your preferred times to travel?</Text>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        style={{ marginTop: 15 }}
      />

      <TouchableOpacity onPress={savePersonalization} style={[styles.button, styles.primaryButton]} disabled={isLoading}>
        {isLoading ? (<ActivityIndicator color={Colors.WHITE} />) : (<Text style={styles.buttonText}>Finished</Text>)}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace({ pathname: "./typeOfdining", params: { editMode }})}
        style={[styles.button, styles.secondaryButton]}
        disabled={isLoading}
      >
        <Text style={[styles.buttonText, { color: Colors.BLACK }]}>Previous</Text>
      </TouchableOpacity>
    </View>
  );
}

const CARD_SIZE = (Dimensions.get("window").width - 70) / 2;
const styles = StyleSheet.create({
  container: { padding: 25, paddingTop: 50, backgroundColor: Colors.BLUE, flex: 1 },
  title: { fontSize: 28, color: Colors.WHITE, fontFamily: "outfit-bold", textAlign: "center", marginTop: 80 },
  subtitle: { fontSize: 14, color: Colors.WHITE, fontFamily: "outfit", textAlign: "center", marginTop: 10 },
  question: { fontSize: 16, color: Colors.WHITE, fontFamily: "outfit-bold", marginTop: 120 },
  card: { width: CARD_SIZE, height: 130, marginVertical: 10, borderRadius: 15, overflow: "hidden", backgroundColor: Colors.GRAY },
  selectedCard: { borderWidth: 2, borderColor: '#FFC107' },
  image: { width: "100%", height: "100%", position: "absolute" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  label: { color: Colors.WHITE, fontFamily: "outfit-bold", fontSize: 16 },
  button: { padding: 15, borderRadius: 15, marginTop: 20, borderWidth: 1, flexDirection: 'row', justifyContent: 'center' },
  primaryButton: { borderColor: Colors.PRIMARY, backgroundColor: Colors.PRIMARY },
  secondaryButton: { backgroundColor: Colors.WHITE },
  buttonText: { fontFamily: "outfit", fontSize: 16, color: Colors.WHITE, textAlign: "center" },
});