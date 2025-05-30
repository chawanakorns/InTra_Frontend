import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Bookmark {
  id: string;
  name: string;
  category: 'attraction' | 'restaurant';
  location: string;
  rating: number;
  image: string;
  tags: string[];
  saved_date: string;
  description: string;
}

export default function BookmarksScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'attraction' | 'restaurant'>('all');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([
    {
      id: '1',
      name: 'Eiffel Tower',
      category: 'attraction',
      location: 'Paris, France',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400',
      tags: ['Iconic', 'History', 'Photography'],
      saved_date: '2025-05-20',
      description: 'Iconic iron lattice tower and symbol of Paris'
    },
    {
      id: '2',
      name: 'Le Bernardin',
      category: 'restaurant',
      location: 'New York, USA',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
      tags: ['Fine Dining', 'Seafood', 'Michelin Star'],
      saved_date: '2025-05-18',
      description: 'Elegant French seafood restaurant with Michelin stars'
    },
    {
      id: '3',
      name: 'Santorini Sunset',
      category: 'attraction',
      location: 'Oia, Greece',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400',
      tags: ['Sunset', 'Romantic', 'Views'],
      saved_date: '2025-05-15',
      description: 'Breathtaking sunset views over the Aegean Sea'
    },
    {
      id: '4',
      name: 'Sukiyabashi Jiro',
      category: 'restaurant',
      location: 'Tokyo, Japan',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
      tags: ['Sushi', 'Traditional', 'Master Chef'],
      saved_date: '2025-05-12',
      description: 'World-renowned sushi restaurant by master Jiro'
    },
    {
      id: '5',
      name: 'Machu Picchu',
      category: 'attraction',
      location: 'Cusco, Peru',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400',
      tags: ['Ancient', 'Hiking', 'UNESCO'],
      saved_date: '2025-05-10',
      description: 'Ancient Incan citadel high in the Andes Mountains'
    },
    {
      id: '6',
      name: 'Osteria Francescana',
      category: 'restaurant',
      location: 'Modena, Italy',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
      tags: ['Italian', 'Fine Dining', 'Traditional'],
      saved_date: '2025-05-08',
      description: 'Traditional Italian cuisine with modern techniques'
    }
  ]);

  const removeBookmark = (id: string) => {
    setBookmarks(bookmarks.filter(bookmark => bookmark.id !== id));
  };

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = bookmark.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bookmark.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bookmark.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || bookmark.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryCount = (category: 'all' | 'attraction' | 'restaurant') => {
    if (category === 'all') return bookmarks.length;
    return bookmarks.filter(b => b.category === category).length;
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Text key={i} style={styles.star}>★</Text>);
    }
    
    if (hasHalfStar) {
      stars.push(<Text key="half" style={styles.star}>☆</Text>);
    }

    return stars;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Bookmarks</Text>
        <Text style={styles.subtitle}>{bookmarks.length} saved places</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Category Filters */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: 'All', icon: '📍' },
            { key: 'attraction', label: 'Attractions', icon: '🏛️' },
            { key: 'restaurant', label: 'Restaurants', icon: '🍽️' }
          ].map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                selectedCategory === category.key && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.key as any)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryText,
                selectedCategory === category.key && styles.categoryTextActive
              ]}>
                {category.label}
              </Text>
              <View style={[
                styles.categoryBadge,
                selectedCategory === category.key && styles.categoryBadgeActive
              ]}>
                <Text style={[
                  styles.categoryBadgeText,
                  selectedCategory === category.key && styles.categoryBadgeTextActive
                ]}>
                  {getCategoryCount(category.key as any)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bookmarks List */}
      <ScrollView 
        style={styles.bookmarksList}
        showsVerticalScrollIndicator={false}
      >
        {filteredBookmarks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No bookmarks found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search' : 'Start saving your favorite places!'}
            </Text>
          </View>
        ) : (
          filteredBookmarks.map((bookmark) => (
            <View key={bookmark.id} style={styles.bookmarkCard}>
              <Image source={{ uri: bookmark.image }} style={styles.bookmarkImage} />
              
              <View style={styles.bookmarkContent}>
                <View style={styles.bookmarkHeader}>
                  <View style={styles.bookmarkInfo}>
                    <Text style={styles.bookmarkName}>{bookmark.name}</Text>
                    <Text style={styles.bookmarkLocation}>📍 {bookmark.location}</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeBookmark(bookmark.id)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.bookmarkDescription}>{bookmark.description}</Text>
                
                <View style={styles.bookmarkMeta}>
                  <View style={styles.rating}>
                    {renderStars(bookmark.rating)}
                    <Text style={styles.ratingText}>{bookmark.rating}</Text>
                  </View>
                  
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>
                      {bookmark.category === 'attraction' ? '🏛️ Attraction' : '🍽️ Restaurant'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.tags}>
                  {bookmark.tags.slice(0, 3).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
                
                <Text style={styles.savedDate}>
                  Saved on {new Date(bookmark.saved_date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  categoryContainer: {
    paddingLeft: 20,
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: '#6366F1',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginRight: 8,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  categoryBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryBadgeTextActive: {
    color: '#FFFFFF',
  },
  bookmarksList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bookmarkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  bookmarkImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  bookmarkContent: {
    padding: 16,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bookmarkInfo: {
    flex: 1,
  },
  bookmarkName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  bookmarkLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  removeButtonText: {
    fontSize: 18,
    color: '#DC2626',
    fontWeight: 'bold',
  },
  bookmarkDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  bookmarkMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: 14,
    color: '#FBBF24',
    marginRight: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  categoryTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  savedDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});