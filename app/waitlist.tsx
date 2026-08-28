import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { joinWaitlist, claimWaitlistBenefit } from '../lib/queries/waitlist';

export default function WaitlistScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ granted: boolean; position: number } | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = email.trim().length > 3 && email.includes('@');

  const handleJoin = async () => {
    const e = email.trim();
    if (!valid) {
      setError('Ingresa un email válido.');
      return;
    }
    setError(null);
    setBusy(true);
    const res = await joinWaitlist(e);
    setBusy(false);
    if (!res) {
      setError('No se pudo unir a la lista. Intenta de nuevo.');
      return;
    }
    setResult({ granted: res.granted, position: res.position });
  };

  const handleClaim = async () => {
    const e = email.trim();
    setBusy(true);
    const ok = await claimWaitlistBenefit(e);
    setBusy(false);
    if (ok) {
      setClaimed(true);
    } else {
      setError('No se pudo reclamar el beneficio todavía.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <SafeAreaView style={styles.headerInner}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Beneficio Waitlist</Text>
          </SafeAreaView>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.heroCard}>
            <Ionicons name="gift-outline" size={40} color="#D95C27" />
            <Text style={styles.heroTitle}>Sé de los primeros 500</Text>
            <Text style={styles.heroText}>
              Regístrate con tu email para obtener acceso temprano al beneficio de Barria.
            </Text>
          </View>

          {claimed ? (
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>Beneficio reclamado</Text>
              <Text style={styles.successText}>
                Tu beneficio quedó vinculado a tu cuenta. ¡Gracias por confiar en Barria!
              </Text>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Tu email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />

              {!result ? (
                <TouchableOpacity
                  style={[styles.joinBtn, (!valid || busy) && styles.btnDisabled]}
                  onPress={handleJoin}
                  disabled={!valid || busy}
                  activeOpacity={0.7}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>UNIRME A LA LISTA</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.statusCard}>
                  <Text style={styles.statusText}>
                    {result.granted
                      ? `Estás en la posición #${result.position} de los primeros 500.`
                      : `Llegaste a la posición #${result.position}.`}
                  </Text>
                  {result.granted && !claimed && (
                    <TouchableOpacity
                      style={[styles.claimBtn, busy && styles.btnDisabled]}
                      onPress={handleClaim}
                      disabled={busy}
                      activeOpacity={0.7}
                    >
                      {busy ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.btnText}>RECLAMAR BENEFICIO</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {error && <Text style={styles.errorText}>{error}</Text>}
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#fff' },
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
  heroCard: {
    backgroundColor: '#FFFDCD',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
  },
  heroText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
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
    marginBottom: 16,
  },
  joinBtn: {
    backgroundColor: '#D95C27',
    borderRadius: 22,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  statusCard: {
    backgroundColor: '#FFF1E8',
    borderRadius: 18,
    padding: 20,
    marginTop: 4,
  },
  statusText: {
    fontSize: 15,
    color: '#333',
    fontFamily: 'Inter',
    lineHeight: 21,
    textAlign: 'center',
  },
  claimBtn: {
    backgroundColor: '#E23B2E',
    borderRadius: 22,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  successCard: {
    backgroundColor: '#E8F7EE',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E7D32',
    fontFamily: 'Inter',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: '#444',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: { color: '#C62828', marginTop: 12, fontSize: 14, fontFamily: 'Inter', textAlign: 'center' },
});
