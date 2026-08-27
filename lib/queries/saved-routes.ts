import { supabase } from '../supabase';
import { ensureAnonSession } from '../auth';
import { SavedRoute } from '../../types/saved-route';

export async function ensureSavedRoutesSession(): Promise<boolean> {
  return ensureAnonSession();
}

export async function fetchSavedRoutes(): Promise<SavedRoute[]> {
  const ok = await ensureSavedRoutesSession();
  if (!ok) return [];

  const { data, error } = await supabase
    .from('saved_routes')
    .select('id, label, destination_lat, destination_lng, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching saved routes:', error.message);
    return [];
  }
  return (data ?? []) as SavedRoute[];
}

export interface SaveRouteInput {
  label: string;
  lat: number;
  long: number;
}

export async function saveRoute(
  input: SaveRouteInput
): Promise<SavedRoute | null> {
  const ok = await ensureSavedRoutesSession();
  if (!ok) return null;

  const { data, error } = await supabase
    .from('saved_routes')
    .insert({
      label: input.label,
      destination_lat: input.lat,
      destination_lng: input.long,
    })
    .select('id, label, destination_lat, destination_lng, created_at')
    .single();

  if (error) {
    console.error('Error saving route:', error.message);
    return null;
  }
  return data as SavedRoute;
}

export async function deleteSavedRoute(id: string): Promise<boolean> {
  const { error } = await supabase.from('saved_routes').delete().eq('id', id);
  if (error) {
    console.error('Error deleting saved route:', error.message);
    return false;
  }
  return true;
}
