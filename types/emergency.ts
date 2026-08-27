export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  sort_order: number;
}

export const MAX_EMERGENCY_CONTACTS = 5;

export interface EmergencyPlace {
  id: string;
  name: string;
  type: 'comisaria' | 'hospital';
  latitude: number;
  longitude: number;
  phone: string;
}

export type NearbyPlace = {
  place: EmergencyPlace;
  distanceMeters: number;
};
