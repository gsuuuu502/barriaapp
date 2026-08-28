import { View, StyleSheet } from 'react-native';
import OsmMap from './OsmMap';

interface Props {
  center?: { latitude: number; longitude: number };
  onCenterChange?: (center: { latitude: number; longitude: number }) => void;
}

export default function MapViewPlaceholder({ center, onCenterChange }: Props) {
  return (
    <View style={styles.container}>
      <OsmMap interactive zoom={13} center={center} onCenterChange={onCenterChange} />
      <View style={styles.crosshair} pointerEvents="none">
        <View style={styles.crosshairRing}>
          <View style={styles.crosshairDot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  crosshair: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D95C27',
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D95C27',
  },
});
