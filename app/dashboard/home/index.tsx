import { useRouter } from "expo-router";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import CategoryItem from "../../../components/CategoryItem";

export default function Dashboard() {
  const currentDate = new Date().toISOString().split("T")[0];
  const router = useRouter();

  const markedDates = {
    [currentDate]: {
      selected: true,
      selectedColor: "#6366F1",
    },
  };

  const popularDestinations = [
    { id: "1", title: "Destination 1" },
    { id: "2", title: "Destination 2" },
    { id: "3", title: "Destination 3" },
    { id: "4", title: "Destination 4" },
    { id: "5", title: "Destination 5" },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>InTra</Text>
          <View style={styles.headerRight}>
            <View style={styles.dateContainer}>
              <Text style={styles.day}>{new Date().getDate()}</Text>
              <View>
                <Text style={styles.month}>
                  {new Date().toLocaleString("default", { month: "short" })}
                </Text>
                <Text style={styles.year}>{new Date().getFullYear()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Calendar */}
        <Calendar
          current={currentDate}
          markedDates={markedDates}
          hideExtraDays
          disableMonthChange
          theme={{
            backgroundColor: "#ffffff",
            calendarBackground: "#ffffff",
            textSectionTitleColor: "#666",
            selectedDayBackgroundColor: "#6366F1",
            selectedDayTextColor: "#ffffff",
            todayTextColor: "#6366F1",
            dayTextColor: "#2d4150",
            textDisabledColor: "#d9e1e8",
            dotColor: "#6366F1",
            selectedDotColor: "#ffffff",
            arrowColor: "#6366F1",
            monthTextColor: "#6366F1",
            textDayFontWeight: "300",
            textMonthFontWeight: "bold",
            textDayHeaderFontWeight: "300",
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
          style={styles.calendar}
        />

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
              image={require("../../../assets/images/attraction.jpg")}
              onPress={() =>
                router.push("/dashboard/home/recommendations/attractions")
              }
            />
            <CategoryItem
              title="Restaurants"
              image={require("../../../assets/images/attraction.jpg")}
              onPress={() =>
                router.push("/dashboard/home/recommendations/restaurants")
              }
            />
          </View>
        </View>

        {/* Popular Destinations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Destinations</Text>
          <FlatList
            data={popularDestinations}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularList}
            renderItem={({ item }) => (
              <View style={styles.popularItem}>
                <CategoryItem
                  title={item.title}
                  image={require("../../../assets/images/attraction.jpg")}
                />
              </View>
            )}
            keyExtractor={(item) => item.id}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    padding: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  day: {
    fontSize: 32,
    fontWeight: "bold",
    marginRight: 8,
  },
  month: {
    fontSize: 16,
    fontWeight: "bold",
  },
  year: {
    fontSize: 14,
    color: "#666",
  },
  bellIconContainer: {
    padding: 8,
  },
  notificationBadge: {
    position: "absolute",
    right: 4,
    top: 4,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  calendar: {
    borderRadius: 10,
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 0,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  searchContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    fontSize: 16,
    color: "#333",
  },
  categoriesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  popularList: {
    paddingBottom: 10,
  },
  popularItem: {
    width: 160,
    marginRight: 12,
  },
});
