import { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import SearchBarTrigger from '../../components/SearchBarTrigger';
import MapViewPlaceholder from '../../components/MapViewPlaceholder';
import AlertButton from '../../components/AlertButton';
import QuickAccessCard from '../../components/QuickAccessCard';
import {
  fetchSavedRoutes,
  saveRoute,
  deleteSavedRoute,
} from '../../lib/queries/saved-routes';
import { SavedRoute } from '../../types/saved-route';

export default function HomeScreen() {
  const router = useRouter();
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [locStatus, setLocStatus] = useState<'loading' | 'ready' | 'denied'>('loading');
  const [saving, setSaving] = useState(false);

  const reload = () => {
    fetchSavedRoutes().then((data) => {
      setRoutes(data);
      setLoading(false);
    });
  };

  useEffect(reload, []);

  const openModal = () => {
    setLabel('');
    setLocStatus('loading');
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      setLocStatus(status === 'granted' ? 'ready' : 'denied');
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const labelTrim = label.trim();
    if (!labelTrim || locStatus !== 'ready' || saving) return;
    setSaving(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await saveRoute({
        label: labelTrim,
        lat: loc.coords.latitude,
        long: loc.coords.longitude,
      });
      setModalOpen(false);
      setLoading(true);
      reload();
    } catch (e) {
      console.error('Home save route error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteSavedRoute(id);
    reload();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView>
          <SearchBarTrigger />
        </SafeAreaView>
      </View>

      <ScrollView style={styles.mapContainer} contentContainerStyle={styles.mapContent}>
        <MapViewPlaceholder />

        <View style={styles.alertContainer}>
          <AlertButton />
        </View>

        <View style={styles.quickAccessContainer}>
          {loading ? (
            <ActivityIndicator color="#D95C27" style={styles.loader} />
          ) : routes.length > 0 ? (
            routes.map((route, index) => (
              <TouchableOpacity
                key={route.id}
                style={{ flex: 1, marginHorizontal: 4 }}
                activeOpacity={0.9}
                onLongPress={() => handleDelete(route.id)}
              >
                <QuickAccessCard
                  label={route.label}
                  destinationLat={route.destination_lat}
                  destinationLng={route.destination_lng}
                  backgroundColor={index === 0 ? '#FFFDCD' : '#FFFCDC'}
                />
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity
              style={styles.emptyCard}
              onPress={openModal}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyText}>+ Agregar destino frecuente</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.waitlistCard}
          onPress={() => router.push('/waitlist')}
          activeOpacity={0.8}
        >
          <Text style={styles.waitlistIcon}>🎁</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.waitlistTitle}>Reclama tu beneficio</Text>
            <Text style={styles.waitlistSub}>Sé de los primeros 500 en la waitlist</Text>
          </View>
          <Text style={styles.waitlistArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Agregar destino frecuente</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre (ej. Casa, Universidad)"
              placeholderTextColor="#999"
              value={label}
              onChangeText={setLabel}
            />
            <View style={styles.locRow}>
              {locStatus === 'loading' && <ActivityIndicator size="small" color="#D95C27" />}
              <Text style={styles.locText}>
                {locStatus === 'ready'
                  ? '✓ Se usará tu ubicación actual'
                  : locStatus === 'denied'
                  ? 'Permiso de ubicación denegado'
                  : 'Obteniendo ubicación...'}
              </Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalOpen(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.saveBtn, (saving || locStatus !== 'ready') && styles.saveDisabled]}
                onPress={handleSave}
                disabled={saving || locStatus !== 'ready'}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveText}>GUARDAR</Text>
                )}
              </Pressable>
            </View>
            <Text style={styles.hint}>Mantén presionada una tarjeta para eliminarla.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#ED6838',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    height: 114,
    overflow: 'hidden',
  },
  mapContainer: {
    flex: 1,
  },
  mapContent: {
    flexGrow: 1,
  },
  alertContainer: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  quickAccessContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
  },
  emptyCard: {
    flex: 1,
    backgroundColor: '#FFFDCD',
    borderRadius: 16,
    padding: 16,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    fontFamily: 'Inter',
  },
  waitlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: '#FFF1E8',
    borderWidth: 1,
    borderColor: '#F3C9B3',
    borderRadius: 18,
    padding: 16,
  },
  waitlistIcon: { fontSize: 28, marginRight: 12 },
  waitlistTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a1a1a',
    fontFamily: 'Inter',
  },
  waitlistSub: { fontSize: 13, color: '#888', fontFamily: 'Inter', marginTop: 2 },
  waitlistArrow: { fontSize: 26, color: '#D95C27', fontFamily: 'Inter' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locText: { fontSize: 13, color: '#777', fontFamily: 'Inter' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalBtn: { flex: 1, height: 50, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { borderWidth: 2, borderColor: '#ddd' },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#555', fontFamily: 'Inter' },
  saveBtn: { backgroundColor: '#D95C27' },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: 'PlusJakartaSans-Bold' },
  hint: { fontSize: 12, color: '#aaa', fontFamily: 'Inter', textAlign: 'center', marginTop: 14 },
});
