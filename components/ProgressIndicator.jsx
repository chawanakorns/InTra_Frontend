import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors'; // Adjust this import path if necessary

const ProgressIndicator = ({ currentStep, totalSteps = 5 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            // The active dot is black, the rest are light gray
            index < currentStep ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#000000', // Black
  },
  inactiveDot: {
    backgroundColor: '#E0E0E0', // Light Gray
  },
});

export default ProgressIndicator;