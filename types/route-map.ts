import { RoutePoint } from '../lib/services/osrm';
import { ColoredSegment } from '../lib/queries/route-safety';

export interface RouteMapProps {
  origin: RoutePoint | null;
  destination: RoutePoint | null;
  route: RoutePoint[];
  segments: ColoredSegment[];
  destinationLabel: string;
  mapRef?: React.RefObject<unknown> | null;
}
