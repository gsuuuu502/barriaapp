import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { INCIDENT_TYPES, IncidentType } from '../../types/incident-report';
import { insertIncidentReport, incidentTypeLabel } from '../../lib/queries/reports';

export default function ReporteScreen() {
  const router = useRouter();

  const [selectedType, setSelectedType] = useState<IncidentType | null>(null);
  const [description, setDescription] = useState('');
  const [locationStatus, setLocationStatus] = useState<
    'loading' | 'ready' | 'error' | 'denied'
  >('loading');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        return;
      }
      setLocationStatus('ready');
    })();
  }, []);

  const handleSubmit = async () => {
    if (!selectedType) {
      setError('Selecciona un estado para la zona.');
      return;
    }
    if (locationStatus !== 'ready') {
      setError('No hay acceso a la ubicación. Habilita los permisos.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const ok = await insertIncidentReport({
        long: loc.coords.longitude,
        lat: loc.coords.latitude,
        incident_type: selectedType,
        description: description.trim() || null,
      });

      if (ok) {
        setSuccess(true);
        setTimeout(() => router.back(), 1000);
      } else {
        setError('No se pudo enviar el reporte. Intenta de nuevo.');
      }
    } catch (e) {
      console.error('Location error:', e);
      setError('No se pudo obtener tu ubicación actual.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear Reporte de Incidente</Text>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mapPreview}>
          <View style={styles.mapInner}>
            <Text style={styles.mapPin}>📍</Text>
          </View>
        </View>
        <Text style={styles.mapCaption}>Punto fijado en tus coordenadas actuales</Text>

        <Text style={styles.sectionLabel}>¿Cómo está la zona?</Text>

        <View style={styles.tagsGrid}>
          {INCIDENT_TYPES.map((type) => {
            const active = selectedType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.tag, active && styles.tagActive]}
                onPress={() => {
                  setSelectedType(type);
                  setError(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.tagText, active && styles.tagTextActive]}>
                  {incidentTypeLabel(type)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Descripción corta del problema</Text>
        <TextInput
          style={styles.input}
          placeholder="Cuéntanos más sobre la zona..."
          placeholderTextColor="#666666"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          textAlignVertical="top"
        />

        <View style={styles.statusRow}>
          {locationStatus === 'loading' && (
            <View style={styles.statusItem}>
              <ActivityIndicator size="small" color="#D95C27" />
              <Text style={styles.statusText}>Obteniendo ubicación...</Text>
            </View>
          )}
          {locationStatus === 'ready' && (
            <Text style={[styles.statusText, styles.statusOk]}>
              ✓ Ubicación lista
            </Text>
          )}
          {locationStatus === 'denied' && (
            <Text style={[styles.statusText, styles.statusErr]}>
              Permiso de ubicación denegado
            </Text>
          )}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
        {success && <Text style={styles.successText}>¡Reporte enviado!</Text>}

        <Pressable
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitText}>Publicar Reporte Anónimo</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    backgroundColor: '#2A2A2A',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  backText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  mapPreview: {
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
  },
  mapInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#252525',
  },
  mapPin: { fontSize: 34 },
  mapCaption: {
    fontSize: 12,
    color: '#AAAAAA',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginTop: 20,
    marginBottom: 12,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    width: '47%',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagActive: {
    borderWidth: 2,
    borderColor: '#D95C27',
    backgroundColor: 'rgba(217,92,39,0.15)',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AAAAAA',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  tagTextActive: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 10,
    padding: 14,
    minHeight: 90,
    fontSize: 15,
    color: '#FFFFFF',
    backgroundColor: '#1A1A1A',
    fontFamily: 'Inter',
    textAlignVertical: 'top',
  },
  statusRow: {
    marginTop: 20,
    minHeight: 24,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#AAAAAA',
    fontFamily: 'Inter',
  },
  statusOk: {
    color: '#2E9A48',
  },
  statusErr: {
    color: '#E23B2E',
  },
  errorText: {
    color: '#E23B2E',
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Inter',
  },
  successText: {
    color: '#2E9A48',
    marginTop: 16,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  submitBtn: {
    backgroundColor: '#D95C27',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
  },
});
