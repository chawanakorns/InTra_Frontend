// app/(tabs)/index.tsx
import CategoryButton from '@/components/CategoryButton';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Dashboard() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          {/* Days of Week */}
          <View style={styles.daysRow}>
            {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map(day => (
              <Text key={day} style={styles.dayHeader}>{day}</Text>
            ))}
          </View>
          
          {/* Calendar Days - Corrected to 7 columns */}
          <View style={styles.calendarGrid}>
            {/* Week 1 */}
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <TouchableOpacity key={day} style={styles.dayCell}>
                <Text style={styles.dayText}>{day}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Week 2 */}
            {[8, 9, 10, 11, 12, 13, 14].map(day => (
              <TouchableOpacity key={day} style={styles.dayCell}>
                <Text style={styles.dayText}>{day}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Week 3 */}
            {[15, 16, 17, 18, 19, 20, 21].map(day => (
              <TouchableOpacity key={day} style={styles.dayCell}>
                <Text style={styles.dayText}>{day}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Week 4 */}
            {[22, 23, 24, 25, 26, 27, 28].map(day => (
              <TouchableOpacity key={day} style={styles.dayCell}>
                <Text style={styles.dayText}>{day}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Week 5 */}
            {[29, 30, 31, ...Array(4).fill('')].map((day, index) => (
              day ? (
                <TouchableOpacity key={day} style={styles.dayCell}>
                  <Text style={styles.dayText}>{day}</Text>
                </TouchableOpacity>
              ) : (
                <View key={`empty-${index}`} style={styles.emptyCell} />
              )
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search</Text>
        </View>

        <View style={styles.divider} />

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <CategoryButton title="Attractions" checked={false} />
          <CategoryButton title="Restaurants" checked={false} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  calendarContainer: {
    marginBottom: 20,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayHeader: {
    width: '14.28%', // 100% / 7 days
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCell: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayText: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});