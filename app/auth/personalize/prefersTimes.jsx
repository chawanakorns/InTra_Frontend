import { Colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { useRouter } from "expo-router";
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
  { id: "1", label: "Daytime", image: require("../../../assets/images/adventurous.jpg") },
  { id: "2", label: "Nighttime", image: require("../../../assets/images/adventurous.jpg") },
];

export default function PrefersTimes() {
  const router = useRouter();
  const navigation = useNavigation();
  const [selected, setSelected] = useState([]);
  const [personalizationCompleted, setPersonalizationCompleted] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });

    const loadAndCheckSelections = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        if (!token) {
          router.replace("/auth/sign-in");
          return;
        }

        const response = await axios.get("http://10.0.2.2:8000/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.has_completed_personalization) {
          setPersonalizationCompleted(true);
          router.replace("/dashboard");
          return;
        }

        // Load preferred times if personalization not completed yet
        const saved = await AsyncStorage.getItem("preferred_times");
        if (saved) {
          // Parse the saved labels and find their corresponding IDs to set the 'selected' state
          const savedLabels = JSON.parse(saved);
          const savedIds = data
            .filter((item) => savedLabels.includes(item.label))
            .map((item) => item.id);
          setSelected(savedIds);
        }
      } catch (error) {
        console.error("Error checking personalization status or loading times:", error);
        if (error.response && error.response.status === 401) {
          await AsyncStorage.removeItem("access_token");
          router.replace("/auth/sign-in");
        }
      }
    };

    loadAndCheckSelections();
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

    // Save labels to AsyncStorage
    AsyncStorage.setItem(
      "preferred_times",
      JSON.stringify(newSelected.map((selectedId) => data.find((item) => item.id === selectedId)?.label || ""))
    );
  };

  const savePersonalization = async () => {
    if (selected.length === 0) {
      Alert.alert("Selection Required", "Please select at least one preferred time to finish.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        router.replace("/auth/sign-in");
        return;
      }

      const personalizationData = {
        tourist_type: JSON.parse(await AsyncStorage.getItem("tourist_type") || "[]"),
        preferred_activities: JSON.parse(await AsyncStorage.getItem("preferred_activities") || "[]"),
        preferred_cuisines: JSON.parse(await AsyncStorage.getItem("preferred_cuisines") || "[]"),
        preferred_dining: JSON.parse(await AsyncStorage.getItem("preferred_dining") || "[]"),
        // Ensure preferred_times are collected from the current 'selected' state, mapped to labels
        preferred_times: selected.map((selectedId) => data.find((item) => item.id === selectedId)?.label || ""),
      };

      // The line below is redundant as the selected state is already being saved in toggleSelection
      // and we collect it again from `selected` for the API call.
      // await AsyncStorage.setItem("preferred_times", JSON.stringify(personalizationData.preferred_times));

      const response = await axios.post("http://10.0.2.2:8000/auth/personalization", personalizationData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        await AsyncStorage.multiRemove([
          "tourist_type",
          "preferred_activities",
          "preferred_cuisines",
          "preferred_dining",
          "preferred_times",
        ]);
        router.replace("/dashboard"); // Changed to dashboard
      } else {
        Alert.alert("Error", "Failed to save personalization");
      }
    } catch (error) {
      console.error("Error saving personalization:", error);
      Alert.alert("Error", "Network error or invalid data");
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

  if (personalizationCompleted) {
    return null; // Don't render the component if personalization is already completed
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Almost Finished!</Text>
      <Text style={styles.subtitle}>
        We need to question some questionnaires,{"\n"}for improving your
        itinerary plans.
      </Text>

      <Text style={styles.question}>What is your preferred times to travel?</Text>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        style={{ marginTop: 15 }}
      />

      <TouchableOpacity
        onPress={savePersonalization}
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
          Finished
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("./typeOfdining")}
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
    marginTop: 120,
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
    // Changed borderColor to a brighter, more distinct color
    borderColor: '#FFC107', // Amber color for better visibility
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