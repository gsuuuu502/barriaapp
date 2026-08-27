import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { UrlTile, Polyline, Marker } from 'react-native-maps';
import { RouteMapProps } from '../types/route-map';
import { SafetyColor } from '../lib/queries/route-safety';

const COLOR_MAP: Record<SafetyColor, string> = {
  green: '#2E9A48',
  amber: '#FFB020',
  red: '#E23B2E',
};

const DEFAULT_DELTA = 0.01;

export default function RouteMap({
  origin,
  destination,
  route,
  segments,
  destinationLabel,
  mapRef,
}: RouteMapProps) {
  return (
    <MapView
      ref={mapRef as any}
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
      {route.length === 0 && (
        <View pointerEvents="none" style={styles.emptyNotice}>
          <Text style={styles.emptyNoticeText}>Calculando ruta…</Text>
        </View>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
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
