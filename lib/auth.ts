import { supabase } from './supabase';

// Asegura una sesión anónima activa (ADR-005). Todas las operaciones que
// necesiten auth.uid() deben pasar por aquí primero.
export async function ensureAnonSession(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return true;

  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error('Error en sesión anónima:', error.message);
    return false;
  }
  return true;
}
