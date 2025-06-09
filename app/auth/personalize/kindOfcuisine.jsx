import { Colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const data = [
  {
    id: "1",
    label: "Local",
    image: require("../../../assets/images/adventurous.jpg"),
  },
  {
    id: "2",
    label: "International",
    image: require("../../../assets/images/relaxed.jpg"),
  },
  {
    id: "3",
    label: "Street Food",
    image: require("../../../assets/images/cultural.jpg"),
  },
  {
    id: "4",
    label: "Vegetarian",
    image: require("../../../assets/images/foodie.jpg"),
  },
];

export default function KindOfCuisine() {
  const router = useRouter();
  const navigation = useNavigation();
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });

    const loadSelections = async () => {
      try {
        const saved = await AsyncStorage.getItem("preferred_cuisines");
        if (saved) {
          setSelected(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Error loading preferred_cuisines:", error);
      }
    };

    loadSelections();
  }, []);

  const toggleSelection = (id) => {
    console.log("Toggling selection for id:", id); // Debug log
    let newSelected;
    if (selected.includes(id)) {
      newSelected = selected.filter((item) => item !== id);
    } else {
      newSelected = [...selected, id];
    }
    setSelected(newSelected);

    // Safety check for data.find
    const label = data.find((item) => item.id === id)?.label;
    if (label) {
      AsyncStorage.setItem(
        "preferred_cuisines",
        JSON.stringify(newSelected.map((id) => data.find((item) => item.id === id)?.label || ""))
      );
    } else {
      console.warn(`No matching label found for id: ${id}`);
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
        <View style={styles.overlay}>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Almost Finished!</Text>
      <Text style={styles.subtitle}>
        We need to question some questionnaires,{"\n"}for improving your
        itinerary plans.
      </Text>

      <Text style={styles.question}>What kind of cuisine do you prefer?</Text>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        style={{ marginTop: 15 }}
      />

      <TouchableOpacity
        onPress={() => router.replace("./typeOfdining")}
        style={{
          padding: 15,
          borderRadius: 15,
          marginTop: 20,
          borderWidth: 1,
          borderColor: Colors.PRIMARY,
          backgroundColor: Colors.PRIMARY,
        }}
      >
        <Text
          style={{
            fontFamily: "outfit",
            fontSize: 16,
            color: Colors.WHITE,
            textAlign: "center",
          }}
        >
          Next
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("./typeOfactivities")}
        style={{
          padding: 15,
          borderRadius: 15,
          marginTop: 20,
          borderWidth: 1,
          backgroundColor: Colors.WHITE,
        }}
      >
        <Text
          style={{
            fontFamily: "outfit",
            fontSize: 16,
            color: Colors.BLACK,
            textAlign: "center",
          }}
        >
          Previous
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const CARD_SIZE = (Dimensions.get("window").width - 70) / 2;

const styles = StyleSheet.create({
  container: {
    padding: 25,
    paddingTop: 50,
    backgroundColor: Colors.BLUE,
    flex: 1,
  },
  title: {
    fontSize: 28,
    color: Colors.WHITE,
    fontFamily: "outfit-bold",
    textAlign: "center",
    marginTop: 80,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.WHITE,
    fontFamily: "outfit",
    textAlign: "center",
    marginTop: 10,
  },
  question: {
    fontSize: 16,
    color: Colors.WHITE,
    fontFamily: "outfit-bold",
    marginTop: 30,
  },
  card: {
    width: CARD_SIZE,
    height: 130,
    marginVertical: 10,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: Colors.GRAY,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
  },
  image: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    color: Colors.WHITE,
    fontFamily: "outfit-bold",
    fontSize: 16,
  },
});