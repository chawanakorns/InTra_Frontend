import { MaterialIcons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Attraction {
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

interface AttractionCardProps {
  attraction: Attraction;
  onPress: (attraction: Attraction) => void;
  style?: any;
}

export default function AttractionCard({ attraction, onPress, style }: AttractionCardProps) {
  const getAttractionIcon = (types: string[] = []) => {
    if (types.includes('museum')) return 'museum';
    if (types.includes('park')) return 'park';
    if (types.includes('zoo')) return 'pets';
    if (types.includes('amusement_park')) return 'attractions';
    if (types.includes('tourist_attraction')) return 'place';
    if (types.includes('church') || types.includes('place_of_worship')) return 'church';
    if (types.includes('shopping_mall') || types.includes('store')) return 'shopping-bag';
    return 'place';
  };

  const getPopularityBadge = (rating: number) => {
    if (rating >= 4.5) return { text: 'Popular', color: '#10B981' };
    if (rating >= 4.0) return { text: 'Good', color: '#F59E0B' };
    if (rating >= 3.5) return { text: 'Fair', color: '#6B7280' };
    return null;
  };

  const popularityBadge = getPopularityBadge(attraction.rating);

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={() => onPress(attraction)}
    >
      <View style={styles.imageWrapper}>
        {attraction.image ? (
          <Image 
            source={{ uri: attraction.image }} 
            style={styles.image}
            defaultSource={require('../assets/images/attraction.jpg')}
          />
        ) : (
          <View style={styles.placeholder}>
            <MaterialIcons 
              name={getAttractionIcon(attraction.types)} 
              size={40} 
              color="#888" 
            />
          </View>
        )}
        
        {popularityBadge && (
          <View style={[styles.popularityBadge, { backgroundColor: popularityBadge.color }]}>
            <Text style={styles.popularityText}>
              {popularityBadge.text}
            </Text>
          </View>
        )}

        {attraction.isOpen !== undefined && (
          <View style={[styles.statusBadge, attraction.isOpen ? styles.openBadge : styles.closedBadge]}>
            <Text style={styles.statusText}>
              {attraction.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.name} numberOfLines={2}>{attraction.name}</Text>
        
        <View style={styles.ratingContainer}>
          <View style={styles.ratingWrapper}>
            <MaterialIcons name="star" size={14} color="#FFD700" />
            <Text style={styles.rating}>
              {attraction.rating > 0 ? attraction.rating.toFixed(1) : 'N/A'}
            </Text>
          </View>
          
          {attraction.priceLevel && (
            <Text style={styles.priceLevel}>
              {'$'.repeat(attraction.priceLevel)}
            </Text>
          )}
        </View>
        
        {attraction.address && (
          <Text style={styles.address} numberOfLines={1}>
            <MaterialIcons name="location-on" size={12} color="#666" />
            {' '}{attraction.address}
          </Text>
        )}
        
        {attraction.types && attraction.types.length > 0 && (
          <View style={styles.typeContainer}>
            <Text style={styles.type} numberOfLines={1}>
              {attraction.types
                .filter(type => 
                  !type.includes('establishment') && 
                  !type.includes('point_of_interest') &&
                  type !== 'tourist_attraction'
                )
                .slice(0, 2)
                .map(type => type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
                .join(' • ')
              }
            </Text>
          </View>
        )}
        
        <View style={styles.visitContainer}>
          <MaterialIcons name="schedule" size={12} color="#8B5CF6" />
          <Text style={styles.visitText}>Tap to explore</Text>
        </View>
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
  popularityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
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
    color: '#8B5CF6',
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
    marginBottom: 8,
  },
  type: {
    color: '#8B5CF6',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  visitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  visitText: {
    color: '#8B5CF6',
    fontSize: 11,
    fontWeight: '500',
  },
});