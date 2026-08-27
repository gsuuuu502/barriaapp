import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ROUTE_MODES,
  RouteMode,
  ROUTE_MODE_OPTIONS,
} from '../../types/route';

export default function BuscarScreen() {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [selectedMode, setSelectedMode] = useState<RouteMode>('balance');

  const canSearch = destination.trim().length > 0;

  const handleSearch = () => {
    if (!canSearch) return;
    router.push({
      pathname: '/ruta/activa',
      params: {
        mode: selectedMode,
        destination: destination.trim(),
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buscar ruta</Text>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>¿A dónde vamos?</Text>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu destino..."
          placeholderTextColor="#999"
          value={destination}
          onChangeText={setDestination}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />

        <Text style={styles.sectionLabel}>Modo de ruta</Text>
        <View style={styles.modes}>
          {ROUTE_MODES.map((id) => {
            const opt = ROUTE_MODE_OPTIONS.find((m) => m.id === id)!;
            const active = selectedMode === id;
            return (
              <TouchableOpacity
                key={id}
                style={[styles.modeCard, active && styles.modeCardActive]}
                onPress={() => setSelectedMode(id)}
                activeOpacity={0.7}
              >
                <Text style={styles.modeIcon}>{opt.icon}</Text>
                <Text style={[styles.modeTitle, active && styles.modeTitleActive]}>
                  {opt.label}
                </Text>
                <Text style={styles.modeDesc}>{opt.description}</Text>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <SafeAreaView style={styles.footer}>
        <TouchableOpacity
          style={[styles.searchBtn, !canSearch && styles.searchBtnDisabled]}
          onPress={handleSearch}
          disabled={!canSearch}
          activeOpacity={0.7}
        >
          <Text style={styles.searchBtnText}>CALCULAR RUTA</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  backBtn: { padding: 8, marginRight: 8 },
  backText: { fontSize: 26, color: '#fff', fontFamily: 'Inter' },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  content: { padding: 20, paddingBottom: 20 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    fontFamily: 'Inter',
    marginTop: 20,
    marginBottom: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Inter',
  },
  modes: { gap: 12 },
  modeCard: {
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  modeCardActive: {
    borderColor: '#D95C27',
    backgroundColor: '#FFF6F2',
  },
  modeIcon: { fontSize: 28, marginRight: 14 },
  modeTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
    fontFamily: 'Inter',
  },
  modeTitleActive: { color: '#D95C27' },
  modeDesc: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Inter',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  radioActive: { borderColor: '#D95C27' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#D95C27' },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  searchBtn: {
    backgroundColor: '#D95C27',
    borderRadius: 22,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnDisabled: { opacity: 0.5 },
  searchBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
  },
});
