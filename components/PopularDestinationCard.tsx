import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface PopularDestinationCardProps {
  image: string | null;
  name: string;
  rating: number;
  onPress?: () => void;
}

const PopularDestinationCard: React.FC<PopularDestinationCardProps> = ({
  image,
  name,
  rating,
  onPress,
}) => {
  const defaultImage = require("../assets/images/attraction.jpg");

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <ImageBackground
        source={image ? { uri: image } : defaultImage}
        style={styles.imageBackground}
        imageStyle={styles.image}
      >
        <View style={styles.overlay} />
        <Text style={styles.name}>{name}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>{rating.toFixed(1)}</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: "#fff",
  },
  imageBackground: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 12,
  },
  image: {
    borderRadius: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 16,
  },
  name: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignSelf: "flex-start",
  },
  rating: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
});

export default PopularDestinationCard;