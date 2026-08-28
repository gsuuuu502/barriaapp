import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import MapView from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { fetchRoute, RoutePoint } from '../../lib/services/osrm';
import {
  assessRouteSafety,
  ColoredSegment,
} from '../../lib/queries/route-safety';
import { RouteMode, routeModeOption } from '../../types/route';
import RouteMap from '../../components/RouteMap';

const COLOR_MAP: Record<string, string> = {
  green: '#2E9A48',
  amber: '#FFB020',
  red: '#E23B2E',
};

export default function ActivaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const rawMode = params.mode;
  const mode: RouteMode = rawMode === 'buena_iluminacion' || rawMode === 'comisarias_cerca'
    ? rawMode
    : 'balance';
  const modeOption = routeModeOption(mode);
  const rawDest = params.destination;
  const destinationLabel =
    (typeof rawDest === 'string' && rawDest.trim().length > 0 ? rawDest : 'Destino').trim();
  const rawDlat = params.dlat;
  const rawDlng = params.dlng;

  const [origin, setOrigin] = useState<RoutePoint | null>(null);
  const [destination, setDestination] = useState<RoutePoint | null>(null);
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [segments, setSegments] = useState<ColoredSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingMode, setApplyingMode] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setApplyingMode(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permiso de ubicación requerido.');
        setLoading(false);
        setApplyingMode(false);
        return;
      }

      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const originPt: RoutePoint = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setOrigin(originPt);

        let destPt: RoutePoint;
        const pLat = typeof rawDlat === 'string' ? Number(rawDlat) : NaN;
        const pLng = typeof rawDlng === 'string' ? Number(rawDlng) : NaN;
        if (Number.isFinite(pLat) && Number.isFinite(pLng)) {
          destPt = { latitude: pLat, longitude: pLng };
        } else {
          destPt = {
            latitude: originPt.latitude + 0.008,
            longitude: originPt.longitude + 0.008,
          };
        }
        setDestination(destPt);

        const r = await fetchRoute({ origin: originPt, destination: destPt });
        let geometry: RoutePoint[];
        let dstToUse = destPt;

        if (r && r.geometry.length >= 2) {
          geometry = r.geometry;
          dstToUse = r.geometry[r.geometry.length - 1];
        } else {
          geometry = [originPt, destPt];
        }

        setDestination(dstToUse);
        setRoute(geometry);
        const safety = await assessRouteSafety(geometry);
        setSegments(safety.segments);

        mapRef.current?.fitToCoordinates(geometry, {
          edgePadding: { top: 120, right: 60, bottom: 260, left: 60 },
          animated: true,
        });
      } catch (e) {
        console.error('Ruta activa error:', e);
        setError('No se pudo cargar la ruta.');
      } finally {
        setLoading(false);
        setApplyingMode(false);
      }
    })();
  }, [params.mode]);

  const handleFinalizar = () => router.back();
  const handleReportar = () => router.push('/ruta/reporte');

  return (
    <View style={styles.container}>
      <RouteMap
        origin={origin}
        destination={destination}
        route={route}
        segments={segments}
        destinationLabel={destinationLabel}
        mapRef={mapRef}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#D95C27" />
          <Text style={styles.loadingText}>
            {applyingMode ? 'Aplicando modo de ruta...' : 'Calculando ruta segura...'}
          </Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <SafeAreaView
        style={styles.safeArea}
        pointerEvents="box-none"
      >
        <View style={[styles.modePill, { marginTop: insets.top + 12 }]}>
          <View style={styles.modeIconBadge}>
            <Ionicons
              name={modeOption.icon as ComponentProps<typeof Ionicons>['name']}
              size={24}
              color="#FFFFFF"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.modeLabel}>{modeOption.label}</Text>
            {route.length > 0 ? (
              <Text style={styles.modeMeta}>Ruta cargada hacia {destinationLabel}</Text>
            ) : (
              <Text style={styles.modeMeta}>{modeOption.description}</Text>
            )}
          </View>
        </View>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.hint}>
            Los tramos se colorean según la seguridad de la zona
          </Text>
          <View style={styles.legend}>
            <LegendItem color={COLOR_MAP.green} label="Seguro" />
            <LegendItem color={COLOR_MAP.amber} label="Precaución" />
            <LegendItem color={COLOR_MAP.red} label="Riesgo" />
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={handleFinalizar}>
              <Text style={styles.btnGhostText}>Finalizar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleReportar}>
              <Text style={styles.btnPrimaryText}>Reportar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  modeIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D95C27',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  modeMeta: {
    fontSize: 13,
    color: '#777',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  bottomBar: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 22,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  hint: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 14,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 5 },
  legendText: { fontSize: 12, color: '#444', fontFamily: 'Inter' },
  actions: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  btnGhost: {
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  btnGhostText: { fontSize: 14, fontWeight: '700', color: '#444', fontFamily: 'Inter' },
  btnPrimary: {
    backgroundColor: '#D95C27',
  },
  btnPrimaryText: { fontSize: 14, fontWeight: '800', color: '#fff', fontFamily: 'Inter' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#444',
    fontFamily: 'Inter',
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 220,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(226,59,46,0.92)',
    borderRadius: 14,
    padding: 14,
  },
  errorText: { color: '#fff', textAlign: 'center', fontFamily: 'Inter' },
});
