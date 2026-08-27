export type FeedCategory =
  | 'restaurantes'
  | 'hospitales'
  | 'comisarias'
  | 'otro';

export const FEED_CATEGORIES: FeedCategory[] = [
  'restaurantes',
  'hospitales',
  'comisarias',
  'otro',
];

export interface FeedCategoryOption {
  id: FeedCategory;
  label: string;
  icon: string;
}

export const FEED_CATEGORY_OPTIONS: FeedCategoryOption[] = [
  { id: 'restaurantes', label: 'Restaurantes', icon: '🍽️' },
  { id: 'hospitales', label: 'Hospitales', icon: '🏥' },
  { id: 'comisarias', label: 'Comisarías', icon: '🚓' },
  { id: 'otro', label: 'Otro', icon: '📍' },
];

export function feedCategoryOption(c: FeedCategory): FeedCategoryOption {
  return FEED_CATEGORY_OPTIONS.find((o) => o.id === c) ?? FEED_CATEGORY_OPTIONS[3];
}

// Filas del feed tal como las expone location_feed_view (SIN user_id — anonimato)
export interface FeedPost {
  id: string;
  content: string;
  category: FeedCategory;
  created_at: string;
  like_count: number;
  flag_count: number;
  location: unknown;
}

export type ReactionType = 'like' | 'flag';
