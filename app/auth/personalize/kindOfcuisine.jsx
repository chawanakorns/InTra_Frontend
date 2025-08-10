import { Colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ProgressIndicator from "../../../components/ProgressIndicator"; // Adjust the import path as needed

const data = [
  { id: "1", label: "Local", image: require("../../../assets/images/Local.jpg") },
  { id: "2", label: "International", image: require("../../../assets/images/International.avif") },
  { id: "3", label: "Street Food", image: require("../../../assets/images/StreetFood.jpg") },
  { id: "4", label: "Vegetarian", image: require("../../../assets/images/Vegetarian.jpg") },
];

export default function KindOfCuisine() {
  const router = useRouter();
  const navigation = useNavigation();
  const { editMode } = useLocalSearchParams();
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });

    const loadSelections = async () => {
      try {
        const saved = await AsyncStorage.getItem("preferred_cuisines");
        if (saved) {
          const savedLabels = JSON.parse(saved);
          const savedIds = data.filter((item) => savedLabels.includes(item.label)).map((item) => item.id);
          setSelected(savedIds);
        }
      } catch (error) {
        console.error("Error loading preferred_cuisines:", error);
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
    await AsyncStorage.setItem("preferred_cuisines", JSON.stringify(labelsToSave));
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

  const handleNext = () => {
    if (selected.length === 0) {
      Alert.alert("Selection Required", "Please select at least one cuisine type to continue.");
      return;
    }
    router.replace({ pathname: "./typeOfdining", params: { editMode } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Almost Finished!</Text>
      <Text style={styles.subtitle}>We need to question some questionnaires,{"\n"}for improving your itinerary plans.</Text>
      <Text style={styles.question}>What kind of cuisine do you prefer?</Text>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        style={{ marginTop: 15 }}
      />
      
      <View style={{ marginTop: 'auto' }}>
        <ProgressIndicator currentStep={3} />
        <TouchableOpacity onPress={handleNext} style={[styles.button, styles.primaryButton]}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace({ pathname: "./typeOfactivities", params: { editMode } })} style={[styles.button, styles.secondaryButton]}>
          <Text style={[styles.buttonText, { color: Colors.BLACK }]}>Previous</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CARD_SIZE = (Dimensions.get("window").width - 70) / 2;
const styles = StyleSheet.create({
  container: { padding: 25, paddingTop: 50, backgroundColor: Colors.WHITE, flex: 1 },
  title: { fontSize: 28, color: Colors.PRIMARY, fontFamily: "outfit-bold", textAlign: "center", marginTop: 80 },
  subtitle: { fontSize: 14, color: Colors.PRIMARY, fontFamily: "outfit", textAlign: "center", marginTop: 10 },
  question: { fontSize: 16, color: Colors.PRIMARY, fontFamily: "outfit-bold", marginTop: 30 },
  card: { width: CARD_SIZE, height: 130, marginVertical: 10, borderRadius: 15, overflow: "hidden", backgroundColor: Colors.GRAY, justifyContent: 'center', alignItems: 'center' },
  selectedCard: { borderWidth: 2, borderColor: '#FFC107' },
  image: { width: "100%", height: "100%", position: "absolute" },
  overlay: { flex: 1, ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  label: { color: Colors.WHITE, fontFamily: "outfit-bold", fontSize: 16 },
  footer: { marginTop: 'auto', paddingTop: 10 },
  button: { padding: 15, borderRadius: 15, marginTop: 10, borderWidth: 1 },
  primaryButton: { borderColor: Colors.BLUE, backgroundColor: Colors.BLUE },
  secondaryButton: { backgroundColor: Colors.WHITE },
  buttonText: { fontFamily: "outfit", fontSize: 16, color: Colors.WHITE, textAlign: "center" },
});