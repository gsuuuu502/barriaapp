import { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function AlertButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePress = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/emergencia');
    }, 1200);
  };

  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonLoading]}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={styles.text}>ENVIAR ALERTA</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(201,60,9,0.76)',
    borderRadius: 22,
    height: 56,
    width: 344,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  buttonLoading: {
    opacity: 0.85,
  },
  text: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
  },
});
