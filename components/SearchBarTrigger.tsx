import { useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Text,
  Pressable,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ROUTE_MODES, RouteMode, ROUTE_MODE_OPTIONS } from '../types/route';

type IconName = ComponentProps<typeof Ionicons>['name'];

export default function SearchBarTrigger() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [selectedMode, setSelectedMode] = useState<RouteMode>('balance');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-30)).current;

  const canSearch = destination.trim().length > 0;

  useEffect(() => {
    if (open) {
      fadeAnim.setValue(0);
      slideAnim.setValue(-30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.45,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open, fadeAnim, slideAnim]);

  const close = () => setOpen(false);

  const toggle = () => {
    if (open) {
      close();
    } else {
      setOpen(true);
      setDestination('');
      setSelectedMode('balance');
    }
  };

  const handleSearch = () => {
    if (!canSearch) return;
    close();
    router.push({
      pathname: '/ruta/activa',
      params: { mode: selectedMode, destination: destination.trim() },
    });
  };

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.container} onPress={toggle} activeOpacity={0.85}>
        <Ionicons name="search" size={20} color="#6B7280" />
        <TextInput
          style={styles.input}
          placeholder="¿A dónde vamos?"
          placeholderTextColor="rgba(0,0,0,0.4)"
          editable={false}
          pointerEvents="none"
          value={destination}
        />
        {open && <Ionicons name="close" size={20} color="#6B7280" onPress={toggle} />}
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={close}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          </Animated.View>

          <Animated.View
            style={[
              styles.panelWrap,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <StatusBar style="light" />
            <View style={styles.panel}>
              <Text style={styles.label}>¿A dónde vamos?</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Escribe tu destino..."
                placeholderTextColor="#999"
                value={destination}
                onChangeText={setDestination}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />

              <Text style={styles.label}>Modo de ruta</Text>
              <View style={styles.modes}>
                {ROUTE_MODES.map((id) => {
                  const opt = ROUTE_MODE_OPTIONS.find((m) => m.id === id)!;
                  const active = selectedMode === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[styles.modeRow, active && styles.modeRowActive]}
                      onPress={() => setSelectedMode(id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={opt.icon as IconName}
                        size={22}
                        color={active ? '#D95C27' : '#D95C27'}
                        style={styles.modeIcon}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modeTitle, active && styles.modeTitleActive]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.modeDesc}>{opt.description}</Text>
                      </View>
                      <View style={[styles.radio, active && styles.radioActive]}>
                        {active && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Pressable
                style={[styles.searchBtn, !canSearch && styles.searchBtnDisabled]}
                onPress={handleSearch}
                disabled={!canSearch}
              >
                <Text style={styles.searchBtnText}>CALCULAR RUTA</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginTop: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontFamily: 'Inter',
  },
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  panelWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  panel: {
    marginHorizontal: 20,
    marginTop: 74,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
    marginBottom: 8,
    marginTop: 4,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F8F9FA',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  modes: { gap: 8, marginBottom: 4 },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  modeRowActive: {
    borderColor: '#D95C27',
    backgroundColor: '#FFF6F2',
  },
  modeIcon: { marginRight: 12 },
  modeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'Inter',
  },
  modeTitleActive: { color: '#D95C27' },
  modeDesc: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  radioActive: { borderColor: '#D95C27' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#D95C27' },
  searchBtn: {
    backgroundColor: '#D95C27',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#D95C27',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  searchBtnDisabled: { opacity: 0.5 },
  searchBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
  },
});
