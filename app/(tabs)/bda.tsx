import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import {
  fetchFeedPosts,
  fetchMyReactions,
  createPost,
  toggleReaction,
} from '../../lib/queries/bda';
import {
  FeedPost,
  FeedCategory,
  FEED_CATEGORY_OPTIONS,
  FEED_CATEGORIES,
  feedCategoryOption,
  ReactionType,
} from '../../types/location-feed';

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'ahora';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default function BdaScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());
  const [myFlags, setMyFlags] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [composerOpen, setComposerOpen] = useState(false);
  const [category, setCategory] = useState<FeedCategory>('otro');
  const [content, setContent] = useState('');
  const [locationStatus, setLocationStatus] = useState<'loading' | 'ready' | 'denied'>('loading');
  const [posting, setPosting] = useState(false);

  const reload = useCallback(async () => {
    const [feed, reactions] = await Promise.all([
      fetchFeedPosts(),
      fetchMyReactions(),
    ]);
    setPosts(feed);
    setMyLikes(new Set(reactions.filter((r) => r.reaction_type === 'like').map((r) => r.post_id)));
    setMyFlags(new Set(reactions.filter((r) => r.reaction_type === 'flag').map((r) => r.post_id)));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      reload();
    }, [reload])
  );

  const openComposer = async () => {
    setContent('');
    setCategory('otro');
    setLocationStatus('loading');
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationStatus(status === 'granted' ? 'ready' : 'denied');
    setComposerOpen(true);
  };

  const handlePost = async () => {
    const text = content.trim();
    if (!text || locationStatus !== 'ready' || posting) return;

    setPosting(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const id = await createPost({
        long: loc.coords.longitude,
        lat: loc.coords.latitude,
        content: text,
        category,
      });
      if (id) {
        setComposerOpen(false);
        setLoading(true);
        await reload();
      }
    } catch (e) {
      console.error('BDA post error:', e);
    } finally {
      setPosting(false);
    }
  };

  const handleReaction = async (postId: string, type: ReactionType) => {
    const nowActive = await toggleReaction(postId, type);
    if (nowActive === null) return;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const delta = nowActive ? 1 : -1;
        return type === 'like'
          ? { ...p, like_count: Math.max(0, p.like_count + delta) }
          : { ...p, flag_count: Math.max(0, p.flag_count + delta) };
      })
    );
    if (type === 'like') {
      setMyLikes((prev) => {
        const next = new Set(prev);
        nowActive ? next.add(postId) : next.delete(postId);
        return next;
      });
    } else {
      setMyFlags((prev) => {
        const next = new Set(prev);
        nowActive ? next.add(postId) : next.delete(postId);
        return next;
      });
    }
  };

  const renderItem = useMemo(
    () =>
      ({ item }: { item: FeedPost }) => {
        const cat = feedCategoryOption(item.category);
        const liked = myLikes.has(item.id);
        const flagged = myFlags.has(item.id);
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.catIcon}>
                <Text style={styles.catIconText}>{cat.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.catLabel}>{cat.label}</Text>
                <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
              </View>
            </View>
            <Text style={styles.cardContent}>{item.content}</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionBtn, liked && styles.actionBtnActive]}
                onPress={() => handleReaction(item.id, 'like')}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionText, liked && styles.actionTextActive]}>
                  👍 {item.like_count}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, flagged && styles.actionBtnFlag]}
                onPress={() => handleReaction(item.id, 'flag')}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionText, flagged && styles.actionTextFlag]}>
                  🚩 {item.flag_count}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      },
    [myLikes, myFlags]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView>
          <Text style={styles.headerTitle}>Bóveda de Denuncias</Text>
          <Text style={styles.headerSubtitle}>Reportes de tu comunidad</Text>
        </SafeAreaView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D95C27" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>Aún no hay reportes</Text>
              <Text style={styles.emptyText}>
                Sé el primero en compartir algo con tu comunidad.
              </Text>
            </View>
          }
        />
      )}

      <SafeAreaView style={styles.fabSafe}>
        <TouchableOpacity style={styles.fab} onPress={openComposer} activeOpacity={0.85}>
          <Text style={styles.fabText}>+ Nuevo</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <Modal
        visible={composerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setComposerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Nuevo reporte</Text>

            <Text style={styles.modalLabel}>Categoría</Text>
            <View style={styles.catChips}>
              {FEED_CATEGORIES.map((c) => {
                const active = category === c;
                const opt = feedCategoryOption(c);
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setCategory(c)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipIcon}>{opt.icon}</Text>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalLabel}>Contenido</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Describe el reporte..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
            />

            <View style={styles.locationRow}>
              {locationStatus === 'loading' && (
                <ActivityIndicator size="small" color="#D95C27" />
              )}
              <Text style={styles.locationText}>
                {locationStatus === 'ready'
                  ? '✓ Ubicación lista'
                  : locationStatus === 'denied'
                  ? 'Permiso de ubicación denegado'
                  : 'Obteniendo ubicación...'}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setComposerOpen(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.submitBtn, (posting || locationStatus !== 'ready') && styles.submitDisabled]}
                onPress={handlePost}
                disabled={posting || locationStatus !== 'ready'}
              >
                {posting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitText}>PUBLICAR</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#D95C27',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#FFFDCD',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  catIconText: { fontSize: 22 },
  catLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'Inter',
  },
  time: { fontSize: 12, color: '#999', fontFamily: 'Inter', marginTop: 2 },
  cardContent: {
    fontSize: 15,
    lineHeight: 21,
    color: '#333',
    fontFamily: 'Inter',
  },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  actionBtnActive: { backgroundColor: '#FFE3D5' },
  actionBtnFlag: { backgroundColor: '#FFE3D5' },
  actionText: { fontSize: 14, fontWeight: '600', color: '#666', fontFamily: 'Inter' },
  actionTextActive: { color: '#D95C27' },
  actionTextFlag: { color: '#E23B2E' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#444', fontFamily: 'Inter' },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8, fontFamily: 'Inter' },
  fabSafe: { position: 'absolute', right: 20, bottom: 100 },
  fab: {
    backgroundColor: '#D95C27',
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: 'Inter' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', fontFamily: 'PlusJakartaSans-Bold' },
  modalLabel: { fontSize: 15, fontWeight: '700', color: '#333', fontFamily: 'Inter', marginTop: 16, marginBottom: 10 },
  catChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  chipActive: { borderColor: '#D95C27', backgroundColor: '#FFF6F2' },
  chipIcon: { fontSize: 16, marginRight: 6 },
  chipText: { fontSize: 14, fontWeight: '600', color: '#555', fontFamily: 'Inter' },
  chipTextActive: { color: '#D95C27' },
  modalInput: {
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    padding: 12,
    minHeight: 100,
    fontSize: 15,
    color: '#333',
    fontFamily: 'Inter',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 },
  locationText: { fontSize: 13, color: '#777', fontFamily: 'Inter' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: { borderWidth: 2, borderColor: '#ddd' },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#555', fontFamily: 'Inter' },
  submitBtn: { backgroundColor: '#D95C27' },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: 'PlusJakartaSans-Bold' },
});
