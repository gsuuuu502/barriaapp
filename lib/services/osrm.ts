export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface OSRMRoute {
  geometry: RoutePoint[];
  distanceMeters: number;
  durationSeconds: number;
}

export interface FetchRouteParams {
  origin: RoutePoint;
  destination: RoutePoint;
}

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/foot';

function toLonLat(p: RoutePoint): string {
  return `${p.longitude},${p.latitude}`;
}

export async function fetchRoute({
  origin,
  destination,
}: FetchRouteParams): Promise<OSRMRoute | null> {
  const coordinates =
    toLonLat(origin) + ';' + toLonLat(destination);

  const url = `${OSRM_BASE}/${coordinates}?overview=full&geometries=geojson&steps=false`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('OSRM error:', res.status);
      return null;
    }
    const json = await res.json();
    if (!json.routes || json.routes.length === 0) {
      console.error('OSRM: no routes found');
      return null;
    }

    const route = json.routes[0];
    const coords: number[][] = route.geometry.coordinates;

    return {
      geometry: coords.map(([lon, lat]) => ({ latitude: lat, longitude: lon })),
      distanceMeters: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
    };
  } catch (e) {
    console.error('OSRM fetch error:', e);
    return null;
  }
}
