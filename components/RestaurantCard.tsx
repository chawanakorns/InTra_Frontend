import { MaterialIcons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Restaurant {
  id: string;
  name: string;
  rating: number;
  image?: string;
  address?: string;
  priceLevel?: number;
  isOpen?: boolean;
  types?: string[];
  placeId: string;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: (restaurant: Restaurant) => void;
  style?: any;
}

export default function RestaurantCard({ restaurant, onPress, style }: RestaurantCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={() => onPress(restaurant)}
    >
      <View style={styles.imageWrapper}>
        {restaurant.image ? (
          <Image 
            source={{ uri: restaurant.image }} 
            style={styles.image}
            defaultSource={require('../assets/images/attraction.jpg')}
          />
        ) : (
          <View style={styles.placeholder}>
            <MaterialIcons name="restaurant" size={40} color="#888" />
          </View>
        )}
        
        {restaurant.isOpen !== undefined && (
          <View style={[styles.statusBadge, restaurant.isOpen ? styles.openBadge : styles.closedBadge]}>
            <Text style={styles.statusText}>
              {restaurant.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.name} numberOfLines={2}>{restaurant.name}</Text>
        
        <View style={styles.ratingContainer}>
          <View style={styles.ratingWrapper}>
            <MaterialIcons name="star" size={14} color="#FFD700" />
            <Text style={styles.rating}>
              {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : 'N/A'}
            </Text>
          </View>
          
          {restaurant.priceLevel && (
            <Text style={styles.priceLevel}>
              {'$'.repeat(restaurant.priceLevel)}
            </Text>
          )}
        </View>
        
        {restaurant.address && (
          <Text style={styles.address} numberOfLines={1}>
            <MaterialIcons name="location-on" size={12} color="#666" />
            {' '}{restaurant.address}
          </Text>
        )}
        
        {restaurant.types && restaurant.types.length > 0 && (
          <View style={styles.typeContainer}>
            <Text style={styles.type} numberOfLines={1}>
              {restaurant.types
                .filter(type => !type.includes('establishment') && !type.includes('point_of_interest'))
                .slice(0, 2)
                .map(type => type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
                .join(' • ')
              }
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 16,
  },
  imageWrapper: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
    position: 'relative',
  },
  image: { 
    width: '100%', 
    height: '100%',
    resizeMode: 'cover'
  },
  placeholder: { 
    width: '100%', 
    height: '100%', 
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openBadge: {
    backgroundColor: '#10B981',
  },
  closedBadge: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  contentContainer: {
    flex: 1,
  },
  name: { 
    fontWeight: 'bold', 
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: { 
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  priceLevel: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  address: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeContainer: {
    marginTop: 4,
  },
  type: {
    color: '#8B5CF6',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});