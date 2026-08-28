import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { WebView } from 'react-native-webview';

export interface OsmMarker {
  latitude: number;
  longitude: number;
  title?: string;
  color?: string;
}

interface OsmMapProps {
  center?: { latitude: number; longitude: number };
  zoom?: number;
  markers?: OsmMarker[];
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
  onCenterChange?: (center: { latitude: number; longitude: number }) => void;
}

const LIMA_NORTE = { latitude: -11.93, longitude: -77.05 };

// Mapa de OpenStreetMap vía Leaflet en un WebView. Carga tiles sin requerir
// Google Maps API Key, por lo que funciona en Android aunque react-native-maps
// no esté configurado con clave.
export default function OsmMap({
  center,
  zoom,
  markers = [],
  interactive = true,
  style,
  onCenterChange,
}: OsmMapProps) {
  const lat = center?.latitude ?? LIMA_NORTE.latitude;
  const lng = center?.longitude ?? LIMA_NORTE.longitude;
  const z = zoom ?? 14;

  const handleMessage = (event: unknown) => {
    if (!onCenterChange || !event) return;
    try {
      const raw = (event as { nativeEvent?: { data?: string } }).nativeEvent?.data;
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
        onCenterChange({ latitude: parsed.latitude, longitude: parsed.longitude });
      }
    } catch {
      // mensaje no JSON, se ignora
    }
  };

  const markerScript = markers
    .map((m) => {
      const color = m.color ?? '#D95C27';
      const title = m.title ? JSON.stringify(m.title) : null;
      const icon = `L.divIcon({ className: '', html: '<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.5);"></div>' })`;
      const popup = title ? `.bindPopup(${title})` : '';
      return `L.marker([${m.latitude}, ${m.longitude}], { icon: ${icon} }).addTo(map)${popup};`;
    })
    .join('\n');

  const centerScript = onCenterChange
    ? `
    map.on('moveend', function () {
      var c = map.getCenter();
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: c.lat, longitude: c.lng }));
      }
    });`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=${interactive ? 'yes' : 'no'}" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
  ${interactive ? '' : '.leaflet-control-container { display: none; }'}
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', {
    zoomControl: ${interactive},
    dragging: ${interactive},
    touchZoom: ${interactive},
    doubleClickZoom: ${interactive},
    scrollWheelZoom: ${interactive},
    tap: ${interactive}
  }).setView([${lat}, ${lng}], ${z});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
  ${markerScript}
  ${centerScript}
</script>
</body>
</html>`;

  return (
    <View style={[styles.container, style]}>
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scrollEnabled={false}
        nestedScrollEnabled={false}
        setSupportMultipleWindows={false}
        onMessage={handleMessage}
        source={{ html }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  webview: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
});
