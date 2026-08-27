import { supabase } from '../supabase';
import {
  IncidentType,
  NearIncidentReport,
} from '../../types/incident-report';

export interface InsertIncidentReportArgs {
  long: number;
  lat: number;
  incident_type: IncidentType;
  description?: string | null;
  severity?: number | null;
}

export async function insertIncidentReport(
  input: InsertIncidentReportArgs
): Promise<boolean> {
  const { error } = await supabase.rpc('insert_incident_report', {
    long: input.long,
    lat: input.lat,
    incident_type: input.incident_type,
    description: input.description ?? null,
    severity: input.severity ?? null,
  });

  if (error) {
    console.error('Error inserting incident report:', error.message);
    return false;
  }
  return true;
}

export interface NearbyReportsParams {
  lat: number;
  long: number;
  radiusMeters?: number;
}

export async function fetchNearbyReports({
  lat,
  long,
  radiusMeters = 1000,
}: NearbyReportsParams): Promise<NearIncidentReport[]> {
  const { data, error } = await supabase.rpc('nearby_incident_reports', {
    lat,
    long,
    radius_m: radiusMeters,
  });

  if (error) {
    console.error('Error fetching nearby reports:', error.message);
    return [];
  }

  return (data ?? []) as NearIncidentReport[];
}

export function incidentTypeLabel(type: IncidentType): string {
  switch (type) {
    case 'iluminado':
      return 'Iluminado';
    case 'no_iluminado':
      return 'No iluminado';
    case 'tenso':
      return 'Tenso';
    case 'tranquilo':
      return 'Tranquilo';
  }
}
