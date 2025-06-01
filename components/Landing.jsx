import { Colors } from "@/constants/Colors";
import { useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Login() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.mainContainer}>
        <Image
          source={require("./../assets/images/Index-images.jpg")}
          style={styles.image}
        />
        <View style={styles.container}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.titleText}>InTra</Text>
          <Text style={styles.subtitleText}>AI Travel Insight Application</Text>
          <Text style={styles.descriptionText}>
            Discover Your Journey — Smart Itineraries Designed Just for You.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("auth/sign-in")}
          >
            <Text style={styles.buttonText}>Let's get started!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: 480,
  },
  container: {
    backgroundColor: Colors.BLUE,
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 40, // Added padding at the bottom
    alignItems: "center",
    minHeight: 400, // Ensure minimum height
  },
  welcomeText: {
    fontSize: 20,
    fontFamily: "outfit",
    color: Colors.WHITE,
    textAlign: "center",
    marginTop: 50,
    marginBottom: 10,
  },
  titleText: {
    fontSize: 54,
    fontFamily: "cinzelDeco-bold",
    color: Colors.WHITE,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 18,
    fontFamily: "outfit-bold",
    color: Colors.WHITE,
    textAlign: "center",
  },
  descriptionText: {
    fontSize: 17,
    fontFamily: "outfit-medium",
    color: Colors.GRAY,
    textAlign: "center",
    marginTop: 20,
    width: "90%",
    marginBottom: 30, // Added margin at the bottom
  },
  button: {
    padding: 15,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 99,
    marginTop: 10,
    width: "90%",
  },
  buttonText: {
    fontSize: 20,
    fontFamily: "outfit",
    color: Colors.WHITE,
    textAlign: "center",
  },
});