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

const data = [
  { id: "1", label: "Riverside Dining", image: require("../../../assets/images/adventurous.jpg") },
  { id: "2", label: "Night Market Vibes", image: require("../../../assets/images/relaxed.jpg") },
  { id: "3", label: "Quiet Cafes", image: require("../../../assets/images/cultural.jpg") },
  { id: "4", label: "Scenic Views", image: require("../../../assets/images/foodie.jpg") },
];

export default function TypeOfDining() {
  const router = useRouter();
  const navigation = useNavigation();
  const { editMode } = useLocalSearchParams();
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });

    const loadSelections = async () => {
      try {
        const saved = await AsyncStorage.getItem("preferred_dining");
        if (saved) {
          const savedLabels = JSON.parse(saved);
          const savedIds = data.filter((item) => savedLabels.includes(item.label)).map((item) => item.id);
          setSelected(savedIds);
        }
      } catch (error) {
        console.error("Error loading preferred_dining:", error);
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
    await AsyncStorage.setItem("preferred_dining", JSON.stringify(labelsToSave));
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
      Alert.alert("Selection Required", "Please select at least one dining experience to continue.");
      return;
    }
    router.replace({ pathname: "./prefersTimes", params: { editMode } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Almost Finished!</Text>
      <Text style={styles.subtitle}>We need to question some questionnaires,{"\n"}for improving your itinerary plans.</Text>
      <Text style={styles.question}>What types of dining experiences interest you?</Text>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        style={{ marginTop: 15 }}
      />

      <TouchableOpacity onPress={handleNext} style={[styles.button, styles.primaryButton]}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace({ pathname: "./kindOfcuisine", params: { editMode } })} style={[styles.button, styles.secondaryButton]}>
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
  question: { fontSize: 16, color: Colors.WHITE, fontFamily: "outfit-bold", marginTop: 30 },
  card: { width: CARD_SIZE, height: 130, marginVertical: 10, borderRadius: 15, overflow: "hidden", backgroundColor: Colors.GRAY },
  selectedCard: { borderWidth: 2, borderColor: '#FFC107' },
  image: { width: "100%", height: "100%", position: "absolute" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  label: { color: Colors.WHITE, fontFamily: "outfit-bold", fontSize: 16 },
  button: { padding: 15, borderRadius: 15, marginTop: 20, borderWidth: 1 },
  primaryButton: { borderColor: Colors.PRIMARY, backgroundColor: Colors.PRIMARY },
  secondaryButton: { backgroundColor: Colors.WHITE },
  buttonText: { fontFamily: "outfit", fontSize: 16, color: Colors.WHITE, textAlign: "center" },
});