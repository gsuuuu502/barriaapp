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
import { insertIncidentReport } from '../../lib/queries/reports';

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
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reportar en ruta</Text>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>¿Cómo está la zona?</Text>

        <View style={styles.tagsRow}>
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
                  {type === 'iluminado'
                    ? 'Iluminado'
                    : type === 'no_iluminado'
                    ? 'No iluminado'
                    : type === 'tenso'
                    ? 'Tenso'
                    : 'Tranquilo'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Descripción (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Cuéntanos más sobre la zona..."
          placeholderTextColor="#999"
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
            <Text style={styles.submitText}>ENVIAR REPORTE</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#D95C27',
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
    fontSize: 26,
    color: '#fff',
    fontFamily: 'Inter',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    fontFamily: 'Inter',
    marginTop: 20,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  tagActive: {
    borderColor: '#D95C27',
    backgroundColor: '#D95C27',
  },
  tagText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    fontFamily: 'Inter',
  },
  tagTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 16,
    padding: 14,
    minHeight: 110,
    fontSize: 15,
    color: '#333',
    fontFamily: 'Inter',
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
    color: '#777',
    fontFamily: 'Inter',
  },
  statusOk: {
    color: '#2E7D32',
  },
  statusErr: {
    color: '#C62828',
  },
  errorText: {
    color: '#C62828',
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Inter',
  },
  successText: {
    color: '#2E7D32',
    marginTop: 16,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  submitBtn: {
    backgroundColor: '#D95C27',
    borderRadius: 22,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
  },
});
