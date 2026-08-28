import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import type { ComponentProps } from 'react';
import { fetchSavedRoutes, saveRoute, deleteSavedRoute } from '../lib/queries/saved-routes';
import { SavedRoute } from '../types/saved-route';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
  label: string;
  icon: IconName;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function OthersMenu({ visible, onClose }: Props) {
  const router = useRouter();

  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addLabel, setAddLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const slideAnim = useRef(new Animated.Value(360)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const reloadRoutes = () => {
    fetchSavedRoutes().then(setRoutes);
  };

  useEffect(() => {
    if (visible) {
      setShowAdd(false);
      setAddLabel('');
      reloadRoutes();
      slideAnim.setValue(360);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.45, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const go = (path: string) => {
    onClose();
    router.push(path as never);
  };

  const handleAdd = async () => {
    const labelT = addLabel.trim();
    if (!labelT || saving) return;
    setSaving(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const saved = await saveRoute({
        label: labelT,
        lat: loc.coords.latitude,
        long: loc.coords.longitude,
      });
      if (saved) setRoutes((prev) => [...prev, saved]);
      setShowAdd(false);
      setAddLabel('');
    } catch (e) {
      console.error('OthersMenu add route error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
    await deleteSavedRoute(id);
  };

  const items: MenuItem[] = [
    { label: 'Inicio', icon: 'map-outline', onPress: () => { onClose(); router.replace('/(tabs)/home' as never); } },
    { label: 'BDA · Comunidad', icon: 'chatbubbles-outline', onPress: () => { onClose(); router.replace('/(tabs)/bda' as never); } },
    { label: 'Noticias', icon: 'newspaper-outline', onPress: () => { onClose(); router.replace('/(tabs)/noticias' as never); } },
    { label: 'Reclama tu beneficio', icon: 'gift-outline', onPress: () => go('/waitlist') },
    { label: 'Emergencia / SOS', icon: 'alert-circle-outline', onPress: () => go('/emergencia') },
    { label: 'Configuración', icon: 'settings-outline', onPress: () => go('/configuracion') },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim, flex: 1 }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            styles.panel,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <SafeAreaView style={styles.panelSafe}>
            <View style={styles.header}>
              <Text style={styles.title}>Menú</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              <View style={styles.list}>
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.item}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={item.icon} size={22} color="#D95C27" />
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#6B7280" />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mis rutas</Text>

                {routes.map((route) => (
                  <View key={route.id} style={styles.routeRow}>
                    <Ionicons name="location-outline" size={18} color="#D95C27" />
                    <Text style={styles.routeLabel} numberOfLines={1}>
                      {route.label}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDelete(route.id)}
                      hitSlop={12}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={20} color="#E23B2E" />
                    </TouchableOpacity>
                  </View>
                ))}

                {routes.length === 0 && (
                  <Text style={styles.noRoutes}>Aún no tienes rutas guardadas.</Text>
                )}

                {showAdd ? (
                  <View style={styles.addBox}>
                    <TextInput
                      style={styles.input}
                      placeholder="Nombre (ej. Casa, Universidad)"
                      placeholderTextColor="#999"
                      value={addLabel}
                      onChangeText={setAddLabel}
                      autoFocus
                    />
                    <Pressable
                      style={[styles.saveBtn, (saving || !addLabel.trim()) && styles.saveDisabled]}
                      onPress={handleAdd}
                      disabled={saving || !addLabel.trim()}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.saveBtnText}>GUARDAR</Text>
                      )}
                    </Pressable>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addRouteBtn}
                    onPress={() => setShowAdd(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#D95C27" />
                    <Text style={styles.addRouteText}>Agregar ruta</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            <Text style={styles.footer}>Barria</Text>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  panel: {
    width: '82%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  panelSafe: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  closeBtn: {
    padding: 8,
  },
  scroll: {
    paddingBottom: 12,
  },
  list: {
    marginTop: 12,
    gap: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 14,
  },
  itemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
  },
  section: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 14,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  routeLabel: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Inter',
  },
  noRoutes: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Inter',
  },
  addRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D95C27',
    borderRadius: 12,
    paddingVertical: 12,
  },
  addRouteText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D95C27',
    fontFamily: 'Inter',
  },
  addBox: {
    gap: 10,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: '#333',
    fontFamily: 'Inter',
  },
  saveBtn: {
    backgroundColor: '#D95C27',
    borderRadius: 18,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 12,
    paddingBottom: 24,
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});
