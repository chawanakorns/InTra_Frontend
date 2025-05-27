import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CalendarScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  // Update time every minute and initialize week dates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    // Calculate the start of the current week (Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    
    // Generate 7 days starting from Sunday
    const initialWeekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
    setWeekDates(initialWeekDates);
    
    return () => clearInterval(timer);
  }, []);

  // Format date as "May 5, 2025"
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Good {getTimeOfDay(currentTime)}, User</Text>
            <Text style={styles.weather}>
              Today is one {weatherCondition}, {weatherPhrases[weatherCondition]}
            </Text>
            <Text style={styles.date}>{formatDate(currentTime)}</Text>
          </View>

          {/* Perfectly Aligned Calendar Grid */}
          <View style={styles.calendarContainer}>
            {/* Day Headers */}
            <View style={styles.dayHeaders}>
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                <View key={day} style={styles.dayHeaderCell}>
                  <Text style={styles.dayHeaderText}>{day}</Text>
                </View>
              ))}
            </View>
            
            {/* Date Numbers */}
            <View style={styles.datesRow}>
              {weekDates.map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCell,
                    date.toDateString() === selectedDate.toDateString() && styles.selectedDateCell,
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[
                    styles.dateNumber,
                    date.toDateString() === selectedDate.toDateString() && styles.selectedDateNumber
                  ]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Empty State */}
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>It is empty now.</Text>
            <Text style={styles.emptySubtitle}>Enter your first</Text>
            <Text style={styles.emptySubtitle}>itinerary</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// Helper functions
function getTimeOfDay(date: Date) {
  const hours = date.getHours();
  if (hours < 12) return 'Morning';
  if (hours < 17) return 'Afternoon';
  return 'Evening';
}

const weatherCondition = "windy";
const weatherPhrases = {
  windy: "perfect for travelling",
  sunny: "great for outdoor activities",
  rainy: "good for indoor plans",
  cloudy: "nice for exploring",
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    position: 'relative',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    padding: 20,
    paddingBottom: 100,
    minHeight: '100%',
  },
  header: {
    marginBottom: 30,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  weather: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  calendarContainer: {
    marginBottom: 30,
  },
  dayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayHeaderCell: {
    width: 40,  // Fixed width
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateCell: {
    width: 40,  // Same width as header
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  selectedDateCell: {
    backgroundColor: '#6366F1',
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  selectedDateNumber: {
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 36,
    color: '#1F2937',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 34,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 2,
  },
});