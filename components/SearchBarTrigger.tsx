import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function SearchBarTrigger() {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push('/ruta/buscar')}
      activeOpacity={0.8}
    >
      <TextInput
        style={styles.input}
        placeholder="¿A dónde vamos?"
        placeholderTextColor="rgba(0,0,0,0.4)"
        editable={false}
        pointerEvents="none"
      />
      <View style={styles.iconContainer}>
        <View style={styles.magnifier} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderRadius: 25,
    height: 48,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Inter',
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  magnifier: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#666',
  },
});
