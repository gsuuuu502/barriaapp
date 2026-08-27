import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export default function RootLayout() {
  const { setUser, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setUser(session.user);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        setUser(data.user);
      } catch (err) {
        console.error('Error en sesión anónima:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#D95C27" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="ruta/buscar" />
        <Stack.Screen name="ruta/activa" />
        <Stack.Screen name="ruta/reporte" />
        <Stack.Screen name="emergencia" />
        <Stack.Screen name="waitlist" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
