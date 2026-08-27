export type IncidentType =
  | 'iluminado'
  | 'no_iluminado'
  | 'tenso'
  | 'tranquilo';

export const INCIDENT_TYPES: IncidentType[] = [
  'iluminado',
  'no_iluminado',
  'tenso',
  'tranquilo',
];

export interface NearIncidentReport {
  id: string;
  incident_type: IncidentType;
  description: string | null;
  severity: number | null;
  reported_at: string;
  location: unknown;
}
