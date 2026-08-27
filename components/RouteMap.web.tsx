import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { RouteMapProps } from '../types/route-map';

export default function RouteMap({
  origin,
  destination,
  route,
  destinationLabel,
}: RouteMapProps) {
  const hasRoute = route.length > 0;
  return (
    <View style={styles.container}>
      <View style={styles.grid} pointerEvents="none">
        {Array.from({ length: 3 }).map((_, r) => (
          <View style={styles.gridRow} key={r}>
            {Array.from({ length: 3 }).map((_, c) => (
              <View style={styles.gridCell} key={`${r}-${c}`} />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.centerCard}>
        <Text style={styles.icon}>🗺️</Text>
        <Text style={styles.title}>Mapa no disponible en web</Text>
        <Text style={styles.subtitle}>
          {!origin && !destination
            ? 'Esperando ubicación…'
            : hasRoute
            ? `Ruta a ${destinationLabel} calculada (${route.length} puntos).`
            : 'Calculando ruta…'}
        </Text>
        <Text style={styles.hint}>
          Abre en tu dispositivo con Expo Go para ver el mapa interactivo.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#EDE8E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  gridRow: { flex: 1, flexDirection: 'row' },
  gridCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  centerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 28,
    alignItems: 'center',
    maxWidth: 340,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  icon: { fontSize: 42, marginBottom: 10 },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 10,
  },
});
