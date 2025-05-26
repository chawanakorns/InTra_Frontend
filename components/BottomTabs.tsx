import { tabIcons } from '@/constants/icons';
import { Link } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BottomTabs({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.container}>
      <Link href="/" asChild>
        <TouchableOpacity style={styles.tab}>
          <tabIcons.index color={state.index === 0 ? '#0066CC' : '#666'} />
          <Text style={[styles.label, { color: state.index === 0 ? '#0066CC' : '#666' }]}>
            Home
          </Text>
        </TouchableOpacity>
      </Link>
      
      <Link href="/(tabs)/calendar" asChild>
        <TouchableOpacity style={styles.tab}>
          <tabIcons.calendar color={state.index === 1 ? '#0066CC' : '#666'} />
          <Text style={[styles.label, { color: state.index === 1 ? '#0066CC' : '#666' }]}>
            Calendar
          </Text>
        </TouchableOpacity>
      </Link>
      
      <Link href="/(tabs)/bookmarks" asChild>
        <TouchableOpacity style={styles.tab}>
          <tabIcons.bookmarks color={state.index === 2 ? '#0066CC' : '#666'} />
          <Text style={[styles.label, { color: state.index === 2 ? '#0066CC' : '#666' }]}>
            Bookmarks
          </Text>
        </TouchableOpacity>
      </Link>
      
      <Link href="/(tabs)/profile" asChild>
        <TouchableOpacity style={styles.tab}>
          <tabIcons.profile color={state.index === 3 ? '#0066CC' : '#666'} />
          <Text style={[styles.label, { color: state.index === 3 ? '#0066CC' : '#666' }]}>
            Profile
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
});