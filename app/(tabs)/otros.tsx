import { View, Text, StyleSheet } from 'react-native';

export default function OtrosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Otros</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});
