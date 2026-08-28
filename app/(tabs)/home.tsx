import { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import SearchBarTrigger from '../../components/SearchBarTrigger';
import MapViewPlaceholder from '../../components/MapViewPlaceholder';
import AlertButton from '../../components/AlertButton';
import QuickAccessCard from '../../components/QuickAccessCard';
import OthersMenu from '../../components/OthersMenu';
import {
  fetchSavedRoutes,
  saveRoute,
  deleteSavedRoute,
} from '../../lib/queries/saved-routes';
import { SavedRoute } from '../../types/saved-route';

export default function HomeScreen() {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [locStatus, setLocStatus] = useState<'loading' | 'ready' | 'denied'>('loading');
  const [saving, setSaving] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: modalOpen ? 0.45 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [modalOpen, fadeAnim]);

  const reload = () => {
    fetchSavedRoutes().then((data) => {
      setRoutes(data);
      setLoading(false);
    });
  };

  useEffect(reload, []);

  const handleLocate = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setMapCenter({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (e) {
      console.error('Locate error:', e);
    } finally {
      setLocating(false);
    }
  };

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
      const saved = await saveRoute({
        label: labelTrim,
        lat: loc.coords.latitude,
        long: loc.coords.longitude,
      });
      if (saved) {
        setRoutes((prev) => [...prev, saved]);
      }
      setModalOpen(false);
      reload();
    } catch (e) {
      console.error('Home save route error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
    await deleteSavedRoute(id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView style={styles.headerRow}>
          <View style={styles.searchWrap}>
            <SearchBarTrigger />
          </View>
          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            style={styles.menuBtn}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <Ionicons name="menu-outline" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <View style={styles.body}>
        <MapViewPlaceholder center={mapCenter ?? undefined} />

        <View style={styles.floatingBottom}>
          <View style={styles.alertWrap}>
            <View style={styles.locateWrap}>
              <TouchableOpacity
                style={styles.locateBtn}
                onPress={handleLocate}
                disabled={locating}
                activeOpacity={0.8}
              >
                {locating ? (
                  <ActivityIndicator size="small" color="#D95C27" />
                ) : (
                  <>
                    <Ionicons name="locate" size={18} color="#D95C27" />
                    <Text style={styles.locateText}>Mi ubicación</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.alertInner}>
              <AlertButton />
            </View>
          </View>

          <View style={styles.routesRow}>
            {routes.slice(0, 2).map((route, index) => (
              <TouchableOpacity
                key={route.id}
                style={{ flex: 1 }}
                activeOpacity={0.9}
                onLongPress={() => handleDelete(route.id)}
              >
                <QuickAccessCard
                  label={route.label}
                  destinationLat={route.destination_lat}
                  destinationLng={route.destination_lng}
                  backgroundColor={index === 0 ? 'rgba(255,253,205,0.92)' : 'rgba(255,252,220,0.92)'}
                />
              </TouchableOpacity>
            ))}
            {Array.from({ length: Math.max(0, 2 - routes.slice(0, 2).length) }).map((_, i) => (
              <TouchableOpacity
                key={`add-${i}`}
                style={styles.emptyCard}
                onPress={openModal}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={26} color="#D95C27" />
                <Text style={styles.emptyText}>Agregar ruta</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <OthersMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalOpen(false)} />
          </Animated.View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.kav}
          >
          <SafeAreaView style={styles.modalSheet} edges={['bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar destino frecuente</Text>
              <TouchableOpacity
                onPress={() => setModalOpen(false)}
                style={styles.closeBtn}
                hitSlop={12}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
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
          </SafeAreaView>
          </KeyboardAvoidingView>
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
    backgroundColor: '#D95C27',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  searchWrap: {
    flex: 1,
  },
  menuBtn: {
    padding: 8,
    marginRight: 16,
    marginTop: 10,
  },
  mapContainer: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  floatingBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    alignItems: 'center',
  },
  alertWrap: {
    width: '100%',
    alignItems: 'stretch',
    gap: 10,
    marginBottom: 12,
  },
  locateWrap: {
    width: '100%',
    alignItems: 'flex-end',
    paddingRight: 24,
  },
  alertInner: {
    width: '100%',
    alignItems: 'stretch',
  },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.12)',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 38,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  locateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D95C27',
    fontFamily: 'Inter',
  },
  routesRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 20,
  },
  emptyCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.10)',
    borderRadius: 14,
    padding: 8,
    height: 56,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
    marginTop: 2,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  kav: { justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeBtn: { padding: 8 },
  modalBody: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    fontFamily: 'PlusJakartaSans-Bold',
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
  modalBtn: { flex: 1, height: 46, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { borderWidth: 2, borderColor: '#ddd' },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#555', fontFamily: 'Inter' },
  saveBtn: { backgroundColor: '#D95C27' },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: 'PlusJakartaSans-Bold' },
  hint: { fontSize: 12, color: '#aaa', fontFamily: 'Inter', textAlign: 'center', marginTop: 14 },
});
