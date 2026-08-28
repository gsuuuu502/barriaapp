import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import OsmMap from '../../components/OsmMap';
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
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        return;
      }
      setLocationStatus('ready');
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCoords({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (e) {
        console.error('Reporte location error:', e);
      }
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
      let reportCoords = coords;
      if (!reportCoords) {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        reportCoords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      }
      const ok = await insertIncidentReport({
        long: reportCoords.longitude,
        lat: reportCoords.latitude,
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
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear Reporte de Incidente</Text>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.mapPreview}>
          <OsmMap
            center={coords ?? { latitude: -11.93, longitude: -77.05 }}
            zoom={15}
            markers={coords ? [{ latitude: coords.latitude, longitude: coords.longitude, color: '#D95C27' }] : []}
            interactive
            onCenterChange={(c) => setCoords(c)}
          />
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
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  flex: { flex: 1 },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    zIndex: 5,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mapInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  mapCaption: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
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
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagActive: {
    borderWidth: 2,
    borderColor: '#D95C27',
    backgroundColor: '#FFF1E6',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  tagTextActive: {
    color: '#D95C27',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    minHeight: 90,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
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
    color: '#6B7280',
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
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#D95C27',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
  },
});
