import { supabase } from '../supabase';
import { ensureAnonSession } from '../auth';
import {
  FeedCategory,
  FeedPost,
  ReactionType,
} from '../../types/location-feed';

export async function fetchFeedPosts(): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from('location_feed_view')
    .select('id, content, category, created_at, like_count, flag_count, location')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching feed:', error.message);
    return [];
  }
  return (data ?? []) as FeedPost[];
}

export interface MyReaction {
  post_id: string;
  reaction_type: ReactionType;
}

// Reacciones del usuario anónimo actual (solo suyas; nunca se exponen a otros).
export async function fetchMyReactions(): Promise<MyReaction[]> {
  const ok = await ensureAnonSession();
  if (!ok) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('location_feed_reactions')
    .select('post_id, reaction_type')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching my reactions:', error.message);
    return [];
  }
  return (data ?? []) as MyReaction[];
}

export interface CreatePostInput {
  long: number;
  lat: number;
  content: string;
  category: FeedCategory;
}

export async function createPost(
  input: CreatePostInput
): Promise<string | null> {
  const ok = await ensureAnonSession();
  if (!ok) return null;

  const { data, error } = await supabase.rpc('create_location_feed_post', {
    long: input.long,
    lat: input.lat,
    content: input.content,
    category: input.category,
  });

  if (error) {
    console.error('Error creating post:', error.message);
    return null;
  }
  return (data as string) ?? null;
}

// Devuelve true si la reacción quedó ACTIVA tras el toggle, false si se quitó.
export async function toggleReaction(
  postId: string,
  type: ReactionType
): Promise<boolean | null> {
  const ok = await ensureAnonSession();
  if (!ok) return null;

  const { data, error } = await supabase.rpc('toggle_location_feed_reaction', {
    target_post_id: postId,
    target_type: type,
  });

  if (error) {
    console.error('Error toggling reaction:', error.message);
    return null;
  }
  return data as boolean;
}
