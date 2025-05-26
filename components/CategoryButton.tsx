import { CheckBox } from '@rneui/themed';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function CategoryButton({ title, checked }: { title: string; checked: boolean }) {
  return (
    <TouchableOpacity style={styles.container}>
      <CheckBox
        checked={checked}
        onPress={() => {}}
        containerStyle={styles.checkbox}
      />
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    padding: 0,
    margin: 0,
    marginLeft: 0,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
  },
});