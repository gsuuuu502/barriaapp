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
  FEED_CATEGORIES,
  feedCategoryOption,
  ReactionType,
} from '../../types/location-feed';

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Hace un momento';
  const m = Math.floor(s / 60);
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  return `Hace ${d} d`;
}

const FILTERS: { id: FeedCategory | 'todas'; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'restaurantes', label: 'Restaurantes' },
  { id: 'hospitales', label: 'Hospitales' },
  { id: 'comisarias', label: 'Comisarias' },
  { id: 'otro', label: 'Otro' },
];

export default function BdaScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());
  const [myFlags, setMyFlags] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedCategory | 'todas'>('todas');

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

  const visiblePosts = useMemo(
    () => (filter === 'todas' ? posts : posts.filter((p) => p.category === filter)),
    [posts, filter]
  );

  const renderItem = useMemo(
    () =>
      ({ item }: { item: FeedPost }) => {
        const cat = feedCategoryOption(item.category);
        const liked = myLikes.has(item.id);
        const flagged = myFlags.has(item.id);
        const hasLocation = !!item.location;
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.catIcon}>
                <Text style={styles.catIconText}>{cat.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.catLabel}>{cat.label.toUpperCase()}</Text>
              </View>
              <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
            </View>
            <Text style={styles.cardContent}>{item.content}</Text>
            {hasLocation ? (
              <View style={styles.cardFooter}>
                <Text style={styles.pinIcon}>📍</Text>
                <Text style={styles.locationLink}>Ver ubicación en mapa</Text>
              </View>
            ) : null}
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
          <Text style={styles.headerTitle}>Publicaciones Comunitarias</Text>
          <Text style={styles.headerSubtitle}>Espacio de interacción vecinal en Lima Norte</Text>
        </SafeAreaView>
      </View>

      <View style={styles.filtersRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(f) => f.id}
          contentContainerStyle={styles.filtersContent}
          renderItem={({ item }) => {
            const active = filter === item.id;
            return (
              <TouchableOpacity
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(item.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D95C27" />
        </View>
      ) : (
        <FlatList
          data={visiblePosts}
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
          <Text style={styles.fabPlus}>+</Text>
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
              placeholderTextColor="#666"
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
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  header: {
    backgroundColor: '#2A2A2A',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#AAAAAA',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  filtersRow: {
    backgroundColor: '#1E1E1E',
    paddingTop: 12,
  },
  filtersContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: { backgroundColor: '#D95C27', borderColor: '#D95C27' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#AAAAAA', fontFamily: 'Inter' },
  filterChipTextActive: { color: '#FFFFFF' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  list: { padding: 16, paddingBottom: 110 },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  catIconText: { fontSize: 22 },
  catLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D95C27',
    fontFamily: 'Inter',
    letterSpacing: 0.5,
  },
  time: { fontSize: 12, color: '#777777', fontFamily: 'Inter' },
  cardContent: {
    fontSize: 15,
    lineHeight: 20,
    color: '#EEEEEE',
    fontFamily: 'Inter',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  pinIcon: { fontSize: 14 },
  locationLink: { fontSize: 13, fontWeight: '600', color: '#D95C27', fontFamily: 'Inter' },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
  },
  actionBtnActive: { backgroundColor: 'rgba(217,92,39,0.2)' },
  actionBtnFlag: { backgroundColor: 'rgba(217,92,39,0.2)' },
  actionText: { fontSize: 14, fontWeight: '600', color: '#AAAAAA', fontFamily: 'Inter' },
  actionTextActive: { color: '#D95C27' },
  actionTextFlag: { color: '#D95C27' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#EEEEEE', fontFamily: 'Inter' },
  emptyText: { fontSize: 14, color: '#999999', textAlign: 'center', marginTop: 8, fontFamily: 'Inter' },
  fabSafe: { position: 'absolute', right: 20, bottom: 24 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D95C27',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabPlus: { color: '#FFFFFF', fontSize: 28, fontWeight: '600', lineHeight: 32 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', fontFamily: 'PlusJakartaSans-Bold' },
  modalLabel: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter', marginTop: 16, marginBottom: 10 },
  catChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    backgroundColor: '#2A2A2A',
  },
  chipActive: { borderColor: '#D95C27', backgroundColor: 'rgba(217,92,39,0.15)' },
  chipIcon: { fontSize: 16, marginRight: 6 },
  chipText: { fontSize: 14, fontWeight: '600', color: '#AAAAAA', fontFamily: 'Inter' },
  chipTextActive: { color: '#FFFFFF' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 14,
    padding: 12,
    minHeight: 100,
    fontSize: 15,
    color: '#FFFFFF',
    backgroundColor: '#1A1A1A',
    fontFamily: 'Inter',
    textAlignVertical: 'top',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 },
  locationText: { fontSize: 13, color: '#AAAAAA', fontFamily: 'Inter' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: { borderWidth: 1, borderColor: '#3A3A3A', backgroundColor: '#2A2A2A' },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#AAAAAA', fontFamily: 'Inter' },
  submitBtn: { backgroundColor: '#D95C27' },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', fontFamily: 'PlusJakartaSans-Bold' },
});
