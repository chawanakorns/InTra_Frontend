import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PlaceDetail() {
  const { placeId, placeName, placeData } = useLocalSearchParams();
  const router = useRouter();
  const place = JSON.parse(placeData as string);

  // Sample description based on place type, can be expanded with API data
  const getDescription = () => {
    if (place.types?.includes('restaurant')) {
      return `The weather is nice these days. The atmosphere at the restaurant, especially the al fresco area, is very festive. There is a big Christmas tree in the middle and soft jazz music is playing.

We ordered 4 dishes: Fresh Local Fig Salad with Goat Cheese and Balsamic Honey Dressing, Gambas al Ajillo, Linguine with Seafood, and Chang Mai Lamb Chops with Tomatoes and Mint Salsa. The dish that we think is good is the Lamb Chops. It is cooked to perfection. The garnish is flavorful. The other dishes are just so-so.`;
    } else if (place.types?.includes('tourist_attraction')) {
      return `The atmosphere at ${placeName} is nice these days. The al fresco area is vibrant, and soft jazz music is playing. We recommend trying the local specialties!`;
    }
    return `The atmosphere at ${placeName} is nice these days. The al fresco area is vibrant, and soft jazz music is playing. We recommend trying the local specialties!`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Main Card */}
      <View style={styles.mainCard}>
        <Image 
          source={{ uri: place.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop' }} 
          style={styles.mainImage} 
        />
        <View style={styles.cardOverlay}>
          <Text style={styles.placeName}>{placeName}</Text>
          <Text style={styles.placeSubtitle}>Fine Dining Wine</Text>
        </View>
      </View>

      {/* Thumbnail Images */}
      <View style={styles.thumbnailContainer}>
        {[
          '1514933817-b8ccc92d7b84',
          '1465101046530-73398c7f28ca',
          '1506744038136-46273834b3fb',
          '1500534314209-a25ddb2bd429'
        ].map((photoId, index) => (
          <View key={index} style={styles.thumbnail}>
            <Image 
              source={{ uri: `https://images.unsplash.com/photo-${photoId}?w=80&h=80&fit=crop` }} 
              style={styles.thumbnailImage} 
            />
          </View>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{placeName} Restaurant</Text>
        </View>

        <Text style={styles.description}>
          {getDescription()}
        </Text>

        {/* Details */}
        <View style={styles.detailsSection}>
          {place.address && (
            <Text style={styles.detailText}>Address: {place.address}</Text>
          )}
          {place.rating && (
            <Text style={styles.detailText}>Rating: {place.rating} / 5</Text>
          )}
          {place.isOpen !== null && (
            <Text style={styles.detailText}>Status: {place.isOpen ? 'Open' : 'Closed'}</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    padding: 4,
  },
  mainCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  mainImage: {
    width: '100%',
    height: 200,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  placeName: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  placeSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    letterSpacing: 1,
    marginTop: 4,
  },
  thumbnailContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  thumbnail: {
    width: 70,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    marginBottom: 24,
  },
  detailsSection: {
    marginBottom: 100,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 80,
    right: 20,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    justifyContent: 'space-around',
  },
  navItem: {
    padding: 8,
  },
});