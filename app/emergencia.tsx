import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  TextInput,
  ScrollView,
  Linking,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import {
  fetchEmergencyContacts,
  addEmergencyContact,
  deleteEmergencyContact,
  findNearestPlace,
} from '../lib/queries/emergency';
import { EmergencyContact, NearbyPlace } from '../types/emergency';

export default function EmergenciaScreen() {
  const router = useRouter();

  const [nearby, setNearby] = useState<NearbyPlace | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  const [contactsOpen, setContactsOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [alertSent, setAlertSent] = useState(false);

  const loadContacts = async () => {
    const list = await fetchEmergencyContacts();
    setContacts(list);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocError('Permiso de ubicación requerido para encontrar lo más cercano.');
      } else {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setNearby(findNearestPlace(loc.coords.latitude, loc.coords.longitude));
        } catch (e) {
          console.error('Location error:', e);
          setLocError('No se pudo obtener tu ubicación.');
        }
      }
      await loadContacts();
      setLoading(false);
    })();
  }, []);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`).catch((e) =>
      console.error('Call error:', e)
    );
  };

  const handleSendAlert = async () => {
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 4000);
  };

  const handleAddContact = async () => {
    const n = newName.trim();
    const p = newPhone.trim();
    if (!n || !p || contacts.length >= 5) return;
    await addEmergencyContact(n, p);
    setNewName('');
    setNewPhone('');
    setAdding(false);
    await loadContacts();
  };

  const handleRemoveContact = async (id: string) => {
    await deleteEmergencyContact(id);
    await loadContacts();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#D95C27" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergencia</Text>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Centro más cercano</Text>
        {nearby ? (
          <View style={styles.placeCard}>
            <Text style={styles.placeBadge}>
              {nearby.place.type === 'comisaria' ? '🚓 COMISARÍA' : '🏥 HOSPITAL'}
            </Text>
            <Text style={styles.placeName}>{nearby.place.name}</Text>
            <Text style={styles.placeDist}>
              ≈ {Math.round(nearby.distanceMeters / 10) / 100} km de ti
            </Text>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => handleCall(nearby.place.phone)}
              activeOpacity={0.7}
            >
              <Text style={styles.callBtnText}>📞 Llamar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeCard}>
            <Text style={styles.placeName}>
              {locError ?? 'No hay datos disponibles.'}
            </Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Tus contactos de emergencia</Text>
        <Text style={styles.note}>
          Se les enviará una alerta con tu ubicación (hasta 5).
        </Text>

        <View style={styles.contactRow}>
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => {
              setAdding(false);
              setNewName('');
              setNewPhone('');
              setContactsOpen(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.manageBtnText}>
              Configurar contactos ({contacts.length}/5)
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleSendAlert}
          activeOpacity={0.8}
        >
          <Text style={styles.sendBtnText}>
            {alertSent ? '✓ Alerta enviada (simulada)' : '🚨 ENVIAR ALERTA'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={contactsOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setContactsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Contactos de emergencia</Text>

            <ScrollView style={styles.contactList}>
              {contacts.map((c) => (
                <View key={c.id} style={styles.contactItem}>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{c.name}</Text>
                    <Text style={styles.contactPhone}>{c.phone}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveContact(c.id)}
                  >
                    <Text style={styles.removeBtnText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {contacts.length === 0 && (
                <Text style={styles.noContacts}>Aún no tienes contactos.</Text>
              )}
              {contacts.length >= 5 && (
                <Text style={styles.limitText}>Llegaste al máximo de 5 contactos.</Text>
              )}
            </ScrollView>

            {adding ? (
              <View style={styles.addForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre"
                  placeholderTextColor="#999"
                  value={newName}
                  onChangeText={setNewName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Teléfono"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={newPhone}
                  onChangeText={setNewPhone}
                />
                <View style={styles.addFormActions}>
                  <Pressable
                    style={[styles.modalBtn, styles.cancelBtn]}
                    onPress={() => setAdding(false)}
                  >
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalBtn, styles.submitBtn]}
                    onPress={handleAddContact}
                  >
                    <Text style={styles.submitText}>Guardar</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                style={[styles.addBtn, contacts.length >= 5 && styles.addBtnDisabled]}
                onPress={() => setAdding(true)}
                disabled={contacts.length >= 5}
              >
                <Text style={styles.addBtnText}>+ Agregar contacto</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.modalBtn, styles.closeBtn]}
              onPress={() => setContactsOpen(false)}
            >
              <Text style={styles.closeText}>Listo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  content: { padding: 20, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    fontFamily: 'Inter',
    marginTop: 20,
    marginBottom: 12,
  },
  note: { fontSize: 13, color: '#888', fontFamily: 'Inter', marginTop: -6, marginBottom: 12 },
  placeCard: {
    backgroundColor: '#FFF1E8',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3C9B3',
  },
  placeBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D95C27',
    fontFamily: 'Inter',
    marginBottom: 6,
  },
  placeName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    fontFamily: 'Inter',
  },
  placeDist: { fontSize: 14, color: '#777', fontFamily: 'Inter', marginTop: 4, marginBottom: 14 },
  callBtn: {
    backgroundColor: '#D95C27',
    borderRadius: 20,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: 'Inter' },
  contactRow: { marginBottom: 4 },
  manageBtn: {
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 18,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageBtnText: { fontSize: 15, fontWeight: '700', color: '#444', fontFamily: 'Inter' },
  sendBtn: {
    backgroundColor: '#E23B2E',
    borderRadius: 22,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '800', fontFamily: 'PlusJakartaSans-Bold' },
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
    marginBottom: 8,
  },
  contactList: { maxHeight: 260, marginTop: 8 },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF6F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  contactInfo: { flex: 1 },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'Inter',
  },
  contactPhone: { fontSize: 13, color: '#777', fontFamily: 'Inter', marginTop: 2 },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFE3D5',
  },
  removeBtnText: { color: '#C0392B', fontSize: 13, fontWeight: '700', fontFamily: 'Inter' },
  noContacts: { fontSize: 14, color: '#999', textAlign: 'center', padding: 16, fontFamily: 'Inter' },
  limitText: { fontSize: 13, color: '#B4551F', textAlign: 'center', marginTop: 4, fontFamily: 'Inter' },
  addForm: { marginTop: 12 },
  input: {
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    fontFamily: 'Inter',
    marginBottom: 10,
  },
  addFormActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, height: 48, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { borderWidth: 2, borderColor: '#ddd' },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#555', fontFamily: 'Inter' },
  submitBtn: { backgroundColor: '#D95C27' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800', fontFamily: 'Inter' },
  addBtn: {
    borderWidth: 2,
    borderColor: '#D95C27',
    borderRadius: 18,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  addBtnDisabled: { borderColor: '#ddd', opacity: 0.5 },
  addBtnText: { color: '#D95C27', fontSize: 15, fontWeight: '800', fontFamily: 'Inter' },
  closeBtn: { backgroundColor: '#E44F19', marginTop: 14 },
  closeText: { color: '#fff', fontSize: 15, fontWeight: '800', fontFamily: 'Inter' },
});
