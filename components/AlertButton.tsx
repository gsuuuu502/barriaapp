import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { sendAlert } from '../lib/queries/emergency';

export default function AlertButton() {
  const router = useRouter();

  const handlePress = async () => {
    try {
      await sendAlert();
    } catch (e) {
      console.error('Send alert error:', e);
    }
    router.push({ pathname: '/emergencia', params: { sent: '1' } });
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <Text style={styles.text}>ENVIAR ALERTA</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(201,60,9,0.85)',
    borderRadius: 18,
    height: 48,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginHorizontal: 20,
    shadowColor: '#C93C09',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: 0.3,
  },
});
