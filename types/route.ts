export type RouteMode = 'buena_iluminacion' | 'comisarias_cerca' | 'balance';

export const ROUTE_MODES: RouteMode[] = [
  'buena_iluminacion',
  'comisarias_cerca',
  'balance',
];

export interface RouteModeOption {
  id: RouteMode;
  label: string;
  description: string;
  icon: string;
}

export const ROUTE_MODE_OPTIONS: RouteModeOption[] = [
  {
    id: 'buena_iluminacion',
    label: 'Buena iluminación',
    description: 'Prioriza zonas iluminadas',
    icon: '💡',
  },
  {
    id: 'comisarias_cerca',
    label: 'Comisarías Cerca',
    description: 'Cercanía a comisarías',
    icon: '🚓',
  },
  {
    id: 'balance',
    label: 'Balance Rápido y Seguro',
    description: 'Equilibrio tiempo y seguridad',
    icon: '⚖️',
  },
];

export function routeModeOption(id: RouteMode): RouteModeOption {
  return (
    ROUTE_MODE_OPTIONS.find((m) => m.id === id) ?? ROUTE_MODE_OPTIONS[2]
  );
}
