import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { UrlTile, Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { fetchRoute, RoutePoint } from '../../lib/services/osrm';
import {
  assessRouteSafety,
  ColoredSegment,
  SafetyColor,
} from '../../lib/queries/route-safety';
import { RouteMode, routeModeOption } from '../../types/route';

const COLOR_MAP: Record<SafetyColor, string> = {
  green: '#2E9A48',
  amber: '#FFB020',
  red: '#E23B2E',
};

type ActivaParamRecord = Record<string, string | string[] | undefined>;

const DEFAULT_DELTA = 0.01;

export default function ActivaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

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
  const handleCambiarRuta = () =>
    router.push({
      pathname: '/ruta/buscar',
      params: destination ? { dlat: destination.latitude, dlng: destination.longitude } : {},
    });
  const handleReportar = () => router.push('/ruta/reporte');

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: origin?.latitude ?? -12.0464,
          longitude: origin?.longitude ?? -77.0428,
          latitudeDelta: DEFAULT_DELTA,
          longitudeDelta: DEFAULT_DELTA,
        }}
        showsUserLocation
        showsCompass={false}
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
        />
        {segments.map((seg, i) => (
          <Polyline
            key={`seg-${i}`}
            coordinates={seg.coordinates}
            strokeColor={COLOR_MAP[seg.color]}
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        ))}
        {origin && (
          <Marker
            coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}
            pinColor="#1f6feb"
            title="Tú"
          />
        )}
        {destination && (
          <Marker
            coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
            pinColor="#D95C27"
            title={destinationLabel}
          />
        )}
      </MapView>

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

      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        <View style={styles.modePill}>
          <Text style={styles.modeIcon}>{modeOption.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.modeLabel}>{modeOption.label}</Text>
            {route.length > 0 ? (
              <Text style={styles.modeMeta}>Ruta cargada hacia {destinationLabel}</Text>
            ) : (
              <Text style={styles.modeMeta}>{modeOption.description}</Text>
            )}
          </View>
        </View>

        <View style={styles.bottomBar}>
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
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={handleCambiarRuta}>
              <Text style={styles.btnSecondaryText}>Cambiar Ruta</Text>
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
    paddingHorizontal: 16,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  modeIcon: { fontSize: 26, marginRight: 12 },
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 28,
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
    height: 52,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnGhost: {
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  btnGhostText: { fontSize: 15, fontWeight: '700', color: '#444', fontFamily: 'Inter' },
  btnSecondary: {
    backgroundColor: '#FFB020',
  },
  btnSecondaryText: { fontSize: 15, fontWeight: '800', color: '#fff', fontFamily: 'Inter' },
  btnPrimary: {
    backgroundColor: '#D95C27',
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '800', color: '#fff', fontFamily: 'Inter' },
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
