import { EmergencyPlace } from '../../types/emergency';

// Comisarías y hospitales de referencia en Lima Norte (datos estáticos locales).
// Fueron elegidos como puntos de referencia para el MVP (Feature #10); el listado
// real puede refinarse cuando exista la tabla de lugares en Supabase.
export const EMERGENCY_PLACES: EmergencyPlace[] = [
  {
    id: 'comisaria-comas',
    name: 'Comisaría PNP Comas',
    type: 'comisaria',
    latitude: -11.9437,
    longitude: -77.0638,
    phone: '105',
  },
  {
    id: 'comisaria-colonial',
    name: 'Comisaría PNP La Colonial',
    type: 'comisaria',
    latitude: -11.9395,
    longitude: -77.0677,
    phone: '105',
  },
  {
    id: 'comisaria-los-olivos',
    name: 'Comisaría PNP Los Olivos',
    type: 'comisaria',
    latitude: -11.9674,
    longitude: -77.0721,
    phone: '105',
  },
  {
    id: 'hospital-honorio',
    name: 'Hospital Nacional Hermilio Valdizán',
    type: 'hospital',
    latitude: -11.982,
    longitude: -77.0525,
    phone: '(01) 336-7424',
  },
  {
    id: 'hospital-collique',
    name: 'Hospital Sergio E. Bernales (Collique)',
    type: 'hospital',
    latitude: -11.9169,
    longitude: -77.0701,
    phone: '(01) 532-3200',
  },
  {
    id: 'hospital-solidaridad',
    name: 'Hospital de la Solidaridad - Comas',
    type: 'hospital',
    latitude: -11.9288,
    longitude: -77.0513,
    phone: '(01) 611-7777',
  },
];
