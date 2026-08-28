import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ConfiguracionScreen() {
  const router = useRouter();
  const [notificaciones, setNotificaciones] = useState(true);
  const [recibosBDA, setRecibosBDA] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configuración</Text>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Nombre de la app</Text>
          <Text style={styles.value}>Barria</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Versión</Text>
          <Text style={styles.value}>1.0.0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Zona de cobertura</Text>
          <Text style={styles.value}>Barrios cercanos</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Notificaciones</Text>
          <Switch
            value={notificaciones}
            onValueChange={setNotificaciones}
            trackColor={{ false: '#E5E7EB', true: '#D95C27' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Recibos de seguridad (BDA)</Text>
          <Switch
            value={recibosBDA}
            onValueChange={setRecibosBDA}
            trackColor={{ false: '#E5E7EB', true: '#D95C27' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  content: { padding: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Inter',
    flexShrink: 1,
    marginRight: 12,
  },
  value: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
});
