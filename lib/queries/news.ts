import { supabase } from '../supabase';
import { NewsItem } from '../../types/news-item';

export async function fetchNewsItems(): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from('news_items')
    .select('id, zone_id, title, description, image_url, published_at')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching news:', error.message);
    return [];
  }
  return (data ?? []) as NewsItem[];
}
