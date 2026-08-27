export interface NewsItem {
  id: string;
  zone_id: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  published_at: string;
}
