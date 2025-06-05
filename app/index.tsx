import { Colors } from "@/constants/Colors";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const router = useRouter();
  return (
    <View style={styles.mainContainer}>
      <Image
        source={require("../assets/images/Index-images.jpg")}
        style={styles.image}
      />
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.titleText}>INTRA</Text>
          <Text style={styles.subtitleText}>AI Travel Insight Application</Text>
          <Text style={styles.descriptionText}>
            Discover Your Journey — Smart Itineraries Designed Just for You.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/auth/sign-in")}
        >
          <Text style={styles.buttonText}>Let's get started!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.BLUE,
  },
  image: {
    width: "100%",
    height: screenHeight * 0.55,
    filter: "brightness(50%) blur(3px)",
  },
  container: {
    flex: 1,
    backgroundColor: Colors.BLUE,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    justifyContent: 'flex-start',
  },
  contentWrapper: {
    marginTop: 30,
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontFamily: "outfit",
    color: Colors.WHITE,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  titleText: {
    fontSize: 48,
    fontFamily: "cinzelDeco",
    color: Colors.WHITE,
    textAlign: "center",
    marginVertical: 20,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  subtitleText: {
    fontSize: 18,
    fontFamily: "outfit-bold",
    color: Colors.WHITE,
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
    marginBottom: 25,
  },
  descriptionText: {
    fontSize: 17,
    fontFamily: "outfit-medium",
    color: Colors.GRAY,
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
    lineHeight: 24,
    width: "90%",
    marginBottom: 15,
  },
  button: {
    padding: 15,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 99,
    width: "100%",
    alignSelf: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 20,
    fontFamily: "outfit",
    color: Colors.WHITE,
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});