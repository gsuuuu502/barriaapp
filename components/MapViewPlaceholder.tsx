import { View, Text, StyleSheet } from 'react-native';

export default function MapViewPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mapa en vivo (próximamente)</Text>
      <Text style={styles.subtext}>MapLibre GL + OpenStreetMap</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 12,
    color: '#999',
  },
});
