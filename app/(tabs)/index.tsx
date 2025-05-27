import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryItem from '../../components/CategoryItem';

export default function Dashboard() {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const markedDates = {
    [currentDate]: {
      selected: true,
      selectedColor: '#0066CC',
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>InTra</Text>
          <View style={styles.dateContainer}>
            <Text style={styles.day}>{new Date().getDate()}</Text>
            <View>
              <Text style={styles.month}>
                {new Date().toLocaleString('default', { month: 'short' })}
              </Text>
              <Text style={styles.year}>
                {new Date().getFullYear()}
              </Text>
            </View>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={currentDate}
            markedDates={markedDates}
            hideExtraDays
            disableMonthChange
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#666',
              selectedDayBackgroundColor: '#0066CC',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#0066CC',
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              dotColor: '#0066CC',
              selectedDotColor: '#ffffff',
              arrowColor: '#0066CC',
              monthTextColor: '#0066CC',
              textDayFontWeight: '300',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '300',
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            style={styles.calendar}
          />
        </View>

        {/* Search Section */}
        <View style={styles.section}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesContainer}>
            <CategoryItem
              title="Attractions"
              image={require('../../assets/images/attraction.jpg')}
            />
            <CategoryItem
              title="Restaurants"
              image={require('../../assets/images/attraction.jpg')}
            />
          </View>
        </View>

        {/* Popular Destination */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Destinations</Text>
          <View style={styles.categoriesContainer}>
            <CategoryItem
              title="1"
              image={require('../../assets/images/attraction.jpg')}
            />
            <CategoryItem
              title="2"
              image={require('../../assets/images/attraction.jpg')}
            />
            <CategoryItem
              title="3"
              image={require('../../assets/images/attraction.jpg')}
            />
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  day: {
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 8,
  },
  month: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  year: {
    fontSize: 14,
    color: '#666',
  },
  calendarContainer: {
    marginBottom: 20,
  },
  calendar: {
    borderRadius: 10,
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 0,
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  searchContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    fontSize: 16,
    color: '#333',
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});