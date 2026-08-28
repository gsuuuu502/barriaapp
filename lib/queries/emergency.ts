import { supabase } from '../supabase';
import { ensureAnonSession } from '../auth';
import {
  EmergencyContact,
  EmergencyPlace,
  NearbyPlace,
} from '../../types/emergency';
import { EMERGENCY_PLACES } from '../data/emergency-places';

export async function fetchEmergencyContacts(): Promise<EmergencyContact[]> {
  const ok = await ensureAnonSession();
  if (!ok) return [];

  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('id, name, phone, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching contacts:', error.message);
    return [];
  }
  return (data ?? []) as EmergencyContact[];
}

export async function addEmergencyContact(
  name: string,
  phone: string
): Promise<EmergencyContact | null> {
  const ok = await ensureAnonSession();
  if (!ok) return null;

  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert({ name: name.trim(), phone: phone.trim() })
    .select('id, name, phone, sort_order')
    .single();
  if (error) {
    console.error('Error adding contact:', error.message);
    return null;
  }
  return data as EmergencyContact;
}

export async function deleteEmergencyContact(
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from('emergency_contacts')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting contact:', error.message);
    return false;
  }
  return true;
}

export async function sendAlert(): Promise<number> {
  const ok = await ensureAnonSession();
  if (!ok) return 0;
  const contacts = await fetchEmergencyContacts();
  for (const c of contacts) {
    try {
      await supabase
        .from('alert_notifications')
        .insert({
          contact_id: c.id,
          contact_name: c.name,
          contact_phone: c.phone,
          message:
            '🚨 Alerta de emergencia: ¡Necesito ayuda! Estoy compartiendo mi ubicación contigo ahora mismo.',
          status: 'sent',
        })
        .select();
    } catch (e) {
      console.error('Error notifying contact:', e);
    }
  }
  return contacts.length;
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

export function findNearestPlace(
  lat: number,
  long: number
): NearbyPlace | null {
  let best: NearbyPlace | null = null;
  for (const place of EMERGENCY_PLACES) {
    const d = haversineMeters(lat, long, place.latitude, place.longitude);
    if (!best || d < best.distanceMeters) {
      best = { place, distanceMeters: d };
    }
  }
  return best;
}

export { EMERGENCY_PLACES };
export type { EmergencyPlace };
