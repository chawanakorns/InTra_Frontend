import { Colors } from "@/constants/Colors";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Login() {
  const router = useRouter();
  return (
    <View>
      <Image
        source={require("./../assets/images/Index-images.jpg")}
        style={{
          width: "100%",
          height: 480,
        }}
      />
      <View style={styles.container}>
        <Text
          Text
          style={{
            fontSize: 20,
            fontFamily: "outfit",
            color: Colors.WHITE,
            textAlign: "center",
            marginTop: 50,
          }}
        >
          {" "}
          Welcome to
        </Text>

        <Text
          style={{
            fontSize: 54,
            fontFamily: "cinzelDeco-bold",
            color: Colors.WHITE,
            textAlign: "center",
            marginTop: 10,
          }}
        >
          {" "}
          InTra
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontFamily: "outfit-bold",
            color: Colors.WHITE,
            textAlign: "center",
          }}
        >
          {" "}
          AI Travel Insight Application
        </Text>

        <Text
          style={{
            fontSize: 17,
            fontFamily: "outfit-medium",
            color: Colors.GRAY,
            textAlign: "center",
            marginTop: 20,
            width: "90%",
          }}
        >
          Discover Your Journey — Smart Itineraries Designed Just for You.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("auth/sign-in")}
        >
          <Text
            style={{
              fontSize: 20,
              fontFamily: "outfit",
              color: Colors.WHITE,
              textAlign: "center",
            }}
          >
            {" "}
            Let get started!{" "}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.BLUE,
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: "100%",
    alignItems: "center",
  },
  button: {
    padding: 15,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 99,
    marginTop: "10%",
    width: "90%",
  },
});
