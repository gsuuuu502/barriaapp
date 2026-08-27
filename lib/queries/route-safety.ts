import { fetchNearbyReports } from './reports';
import { IncidentType } from '../../types/incident-report';
import { RoutePoint } from '../services/osrm';

export type SafetyColor = 'green' | 'amber' | 'red';

export interface ColoredSegment {
  coordinates: RoutePoint[];
  color: SafetyColor;
}

const MAX_SAMPLES = 8;
const SAMPLE_RADIUS_M = 600;

function distanceMeters(a: RoutePoint, b: RoutePoint): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function typeWeight(type: IncidentType): number {
  switch (type) {
    case 'tenso':
      return 3;
    case 'no_iluminado':
      return 2;
    case 'iluminado':
      return 1;
    case 'tranquilo':
      return 0.5;
  }
}

function samplePoints(geometry: RoutePoint[]): RoutePoint[] {
  if (geometry.length <= MAX_SAMPLES) {
    return geometry.length === 0 ? [geometry[0]] : geometry;
  }
  const samples: RoutePoint[] = [];
  for (let i = 0; i < MAX_SAMPLES; i++) {
    const idx = Math.round((i * (geometry.length - 1)) / (MAX_SAMPLES - 1));
    samples.push(geometry[idx]);
  }
  return samples;
}

function scoreToColor(score: number): SafetyColor {
  if (score >= 5) return 'red';
  if (score > 0) return 'amber';
  return 'green';
}

export function resolveSegmentColors(
  route: RoutePoint[],
  perPointScore: number[]
): ColoredSegment[] {
  if (route.length < 2) return [{ coordinates: route, color: 'green' }];

  const colors: SafetyColor[] = route.map((_, i) => {
    const score = perPointScore[Math.min(i, perPointScore.length - 1)] ?? 0;
    return scoreToColor(score);
  });

  const segments: ColoredSegment[] = [];
  for (let i = 0; i < route.length - 1; i++) {
    segments.push({
      coordinates: [route[i], route[i + 1]],
      color: colors[i],
    });
  }
  return segments;
}

export interface SafetyAssessment {
  segments: ColoredSegment[];
  totalScore: number;
  peakScore: number;
}

export async function assessRouteSafety(
  geometry: RoutePoint[]
): Promise<SafetyAssessment> {
  const samples = samplePoints(geometry);

  const scores = await Promise.all(
    samples.map(async (pt) => {
      const reports = await fetchNearbyReports({
        lat: pt.latitude,
        long: pt.longitude,
        radiusMeters: SAMPLE_RADIUS_M,
      });
      let score = 0;
      for (const r of reports) {
        const w = typeWeight(r.incident_type);
        const sev = typeof r.severity === 'number' ? r.severity : 1;
        score += w * sev;
      }
      return score;
    })
  );

  // Mapear el score de cada muestra al vértice del route más cercano.
  const perPointScore: number[] = geometry.map((g, idx) => {
    let best = 0;
    let bestDist = Infinity;
    samples.forEach((s, si) => {
      const d = distanceMeters(g, s);
      if (d < bestDist) {
        bestDist = d;
        best = scores[si];
      }
    });
    return best;
  });

  const segments = resolveSegmentColors(geometry, perPointScore);

  return {
    segments,
    totalScore: scores.reduce((a, b) => a + b, 0),
    peakScore: scores.length ? Math.max(...scores) : 0,
  };
}
