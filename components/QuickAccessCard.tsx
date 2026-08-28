import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface QuickAccessCardProps {
  label: string;
  destinationLat?: number | null;
  destinationLng?: number | null;
  backgroundColor?: string;
}

export default function QuickAccessCard({
  label,
  destinationLat,
  destinationLng,
  backgroundColor = '#FFFDCD',
}: QuickAccessCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (
      destinationLat != null &&
      destinationLng != null &&
      Number.isFinite(Number(destinationLat)) &&
      Number.isFinite(Number(destinationLng))
    ) {
      router.push({
        pathname: '/ruta/activa',
        params: {
          destination: label,
          dlat: String(destinationLat),
          dlng: String(destinationLng),
        },
      });
    } else {
      router.push('/ruta/activa');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={styles.subtitle}>Ir a</Text>
      <Text style={styles.title}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    padding: 10,
    height: 56,
    justifyContent: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: '#888',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a1a1a',
    fontFamily: 'Inter',
  },
});
