import React from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import MapView, {
  UrlTile,
  Polyline,
  Marker,
  PROVIDER_DEFAULT,
} from 'react-native-maps';
import { WebView } from 'react-native-webview';
import { RouteMapProps } from '../types/route-map';
import { RoutePoint } from '../lib/services/osrm';
import { SafetyColor, ColoredSegment } from '../lib/queries/route-safety';

const COLOR_MAP: Record<SafetyColor, string> = {
  green: '#2E9A48',
  amber: '#FFB020',
  red: '#E23B2E',
};

// Coordenadas por defecto (centro de la zona de Barria).
const LIMA_NORTE = {
  latitude: -11.93,
  longitude: -77.05,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const DEFAULT_REGION = LIMA_NORTE;

// En Android la capa nativa de react-native-maps usa Google Maps y exige una
// API Key para renderizar; sin ella el lienzo queda en blanco. Como en este MVP
// no se integra Google API Key, en Android mostramos SIEMPRE un visor de
// OpenStreetMap (Leaflet) vía WebView, que carga tiles sin API Key. En iOS el
// mapa nativo (Apple Maps) funciona sin clave, por eso se conserva ahí.
const USE_OSM_FALLBACK = Platform.OS === 'android';

export default function RouteMap({
  origin,
  destination,
  route,
  segments,
  destinationLabel,
  mapRef,
}: RouteMapProps) {
  if (USE_OSM_FALLBACK) {
    return (
      <OsmFallback
        origin={origin}
        destination={destination}
        route={route}
        segments={segments}
        destinationLabel={destinationLabel}
      />
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef as any}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={
          origin
            ? {
                latitude: origin.latitude,
                longitude: origin.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
            : DEFAULT_REGION
        }
        showsUserLocation={true}
        showsMyLocationButton={true}
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
        {route.length === 0 && (
          <View pointerEvents="none" style={styles.emptyNotice}>
            <Text style={styles.emptyNoticeText}>Calculando ruta…</Text>
          </View>
        )}
      </MapView>
    </View>
  );
}

function OsmFallback({
  origin,
  destination,
  route,
  segments,
  destinationLabel,
}: {
  origin: RoutePoint | null;
  destination: RoutePoint | null;
  route: RoutePoint[];
  segments: ColoredSegment[];
  destinationLabel: string;
}) {
  const html = buildOsmHtml({ origin, destination, route, segments, destinationLabel });
  return (
    <WebView
      style={styles.container}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      source={{ html }}
    />
  );
}

// Genera el HTML con Leaflet + tiles de OpenStreetMap.
function buildOsmHtml({
  origin,
  destination,
  route,
  segments,
  destinationLabel,
}: {
  origin: RoutePoint | null;
  destination: RoutePoint | null;
  route: RoutePoint[];
  segments: ColoredSegment[];
  destinationLabel: string;
}): string {
  const points = route.length > 0 ? route : segments.flatMap((s) => s.coordinates);

  const defaultCenter = [LIMA_NORTE.latitude, LIMA_NORTE.longitude];
  const hasPath = points.length >= 2;
  const centerLat = points.length > 0 ? points[0].latitude : LIMA_NORTE.latitude;
  const centerLng = points.length > 0 ? points[0].longitude : LIMA_NORTE.longitude;
  const renderBounds: number[][] = hasPath
    ? points.map((p) => [p.latitude, p.longitude])
    : [defaultCenter];

  const markerScript = `
    ${origin ? `L.marker([${origin.latitude}, ${origin.longitude}], { icon: iconBlue }).addTo(map).bindPopup('Tú');` : ''}
    ${destination ? `L.marker([${destination.latitude}, ${destination.longitude}], { icon: iconOrange }).addTo(map).bindPopup(${JSON.stringify(destinationLabel)});` : ''}
  `;

  const orgSegments = segments.map((s) =>
    JSON.stringify(s.coordinates.map((p) => [p.latitude, p.longitude]))
  );
  const orgColors = segments.map((s) => COLOR_MAP[s.color]);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = ${hasPath
    ? `L.map('map', { zoomControl: false }).fitBounds([${renderBounds.map((b) => JSON.stringify(b)).join(',')}], { padding: [40, 40] });`
    : `L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], 13);`};
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  const iconBlue = L.icon({ iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41] });
  const iconOrange = L.divIcon({ className: '', html: '<div style="width:18px;height:18px;border-radius:50%;background:#D95C27;border:3px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.5);"></div>' });

  // Polylíneas por segmento de seguridad
  const segmentsCoords = ${JSON.stringify(orgSegments)};
  const segmentsColors = ${JSON.stringify(orgColors)};
  segmentsCoords.forEach((coords, i) => {
    if (coords.length >= 2) {
      L.polyline(coords, { color: segmentsColors[i], weight: 7, opacity: 0.95 }).addTo(map);
    }
  });

  // Ruta plana si no hay segmentos coloreados
  if (segmentsCoords.length === 0) {
    const path = ${JSON.stringify(route.length > 0 ? route.map((p) => [p.latitude, p.longitude]) : (origin && destination ? [[origin.latitude, origin.longitude], [destination.latitude, destination.longitude]] : []))};
    if (path.length >= 2) {
      L.polyline(path, { color: '#1f6feb', weight: 6, opacity: 0.9 }).addTo(map);
    }
  }

  ${markerScript}
</script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  emptyNotice: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyNoticeText: {
    color: '#555',
    fontSize: 14,
    fontFamily: 'Inter',
  },
});
