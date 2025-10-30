import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Image, ImageBackground, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require("../assets/images/Index-images.jpg")}
        style={styles.imageBackground}
      >
        <View style={styles.overlay}>
          <Image
            source={require('../assets/images/intra_logo_circle.png')}
            style={styles.icon}
          />
        </View>
      </ImageBackground>

      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.titleText}>INTRA</Text>
          <Text style={styles.subtitleText}>AI Travel Insight Application</Text>
          <Text style={styles.descriptionText}>
            Discover Your Journey — Smart Itineraries Designed Just for You.
          </Text>
        
          {/* --- FIX: Button moved inside the content wrapper --- */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/auth/sign-in")}
          >
            <Text style={styles.buttonText}>Let&apos;s get started!</Text>
          </TouchableOpacity>
        </View>
        <StatusBar hidden={true} />
      </View>
    </SafeAreaView>
  );
}

const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#7E9DFF', 
  },
  imageBackground: {
    width: "100%",
    height: screenHeight * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 200,
    height: 200,
  },
  container: {
    flex: 1,
    backgroundColor: '#7E9DFF',
    marginTop: -55,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 25,
    paddingBottom: 40,
    justifyContent: 'flex-start', 
  },
  contentWrapper: {
    paddingTop: 40,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 20,
    fontFamily: "outfit",
    color: '#FFFFFF',
    textAlign: "center",
  },
  titleText: {
    fontSize: 48,
    fontFamily: "cinzelDeco-bold",
    color: '#FFFFFF',
    textAlign: "center",
    marginVertical: 10,
  },
  subtitleText: {
    fontSize: 18,
    fontFamily: "outfit-bold",
    color: '#FFFFFF',
    textAlign: "center",
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 17,
    fontFamily: "outfit-medium",
    color: '#FFFFFF',
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.9,
  },
  button: {
    padding: 18,
    backgroundColor: '#0F172A', 
    borderRadius: 99,
    width: "100%",
    alignSelf: 'center',
    marginTop: 40, 
  },
  buttonText: {
    fontSize: 18,
    fontFamily: "outfit-bold",
    color: '#FFFFFF',
    textAlign: "center",
  },
});