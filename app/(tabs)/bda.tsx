import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
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

type IconName = ComponentProps<typeof Ionicons>['name'];

export default function BdaScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());
  const [myFlags, setMyFlags] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedCategory | 'todas'>('todas');

  const [composerOpen, setComposerOpen] = useState(false);
  const [category, setCategory] = useState<FeedCategory>('otro');
  const [content, setContent] = useState('');
  const [locationStatus, setLocationStatus] = useState<'loading' | 'ready' | 'denied'>('loading');
  const [posting, setPosting] = useState(false);

  const composerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(composerAnim, {
      toValue: composerOpen ? 1 : 0,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }, [composerOpen, composerAnim]);

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
                <Ionicons name={cat.icon as IconName} size={22} color="#D95C27" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.catLabel}>{cat.label.toUpperCase()}</Text>
              </View>
              <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
            </View>
            <Text style={styles.cardContent}>{item.content}</Text>
            {hasLocation ? (
              <View style={styles.cardFooter}>
                <Ionicons name="location-outline" size={14} color="#D95C27" />
                <Text style={styles.locationLink}>Ver ubicación en mapa</Text>
              </View>
            ) : null}
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionBtn, liked && styles.actionBtnActive]}
                onPress={() => handleReaction(item.id, 'like')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={liked ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={16}
                  color={liked ? '#D95C27' : '#6B7280'}
                />
                <Text style={[styles.actionText, liked && styles.actionTextActive]}>
                  {' '}{item.like_count}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, flagged && styles.actionBtnFlag]}
                onPress={() => handleReaction(item.id, 'flag')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={flagged ? 'flag' : 'flag-outline'}
                  size={16}
                  color={flagged ? '#D95C27' : '#6B7280'}
                />
                <Text style={[styles.actionText, flagged && styles.actionTextFlag]}>
                  {' '}{item.flag_count}
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
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Reportes</Text>
              <Text style={styles.headerSubtitle}>Reportes de seguridad del barrio</Text>
            </View>
            <TouchableOpacity
              onPress={() => (composerOpen ? setComposerOpen(false) : openComposer())}
              style={styles.headerAddBtn}
              hitSlop={12}
              activeOpacity={0.7}
            >
              <Ionicons name={composerOpen ? 'close' : 'add'} size={26} color="#D95C27" />
            </TouchableOpacity>
          </View>

          <Animated.View
            style={[
              styles.composerInline,
              {
                maxHeight: composerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 420],
                }),
                opacity: composerAnim,
                transform: [
                  {
                    translateY: composerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-16, 0],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents={composerOpen ? 'auto' : 'none'}
          >
            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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
                      <Ionicons name={opt.icon as IconName} size={16} color={active ? '#D95C27' : '#6B7280'} />
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
                numberOfLines={3}
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
              />

              <View style={styles.locationRow}>
                {locationStatus === 'loading' && <ActivityIndicator size="small" color="#D95C27" />}
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
            </ScrollView>
          </Animated.View>
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
        <TouchableOpacity
          style={styles.fab}
          onPress={() => (composerOpen ? setComposerOpen(false) : openComposer())}
          activeOpacity={0.85}
        >
          <Ionicons name={composerOpen ? 'close' : 'add'} size={30} color="#FFF" />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  composerInline: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEF0F2',
  },
  filtersRow: {
    backgroundColor: '#F8F9FA',
    paddingTop: 12,
  },
  filtersContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: { backgroundColor: '#D95C27', borderColor: '#D95C27' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280', fontFamily: 'Inter' },
  filterChipTextActive: { color: '#FFFFFF' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  list: { padding: 16, paddingBottom: 130 },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDEFF2',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF1E6',
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
  time: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter' },
  cardContent: {
    fontSize: 15,
    lineHeight: 20,
    color: '#111827',
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
    backgroundColor: '#F3F4F6',
  },
  actionBtnActive: { backgroundColor: '#FFF1E6' },
  actionBtnFlag: { backgroundColor: '#FFF1E6' },
  actionText: { fontSize: 14, fontWeight: '600', color: '#6B7280', fontFamily: 'Inter' },
  actionTextActive: { color: '#D95C27' },
  actionTextFlag: { color: '#D95C27' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827', fontFamily: 'Inter' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, fontFamily: 'Inter' },
  fabSafe: { position: 'absolute', right: 20, bottom: 100 },
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
    justifyContent: 'flex-end',
  },
  kav: { justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeBtn: { padding: 8 },
  modalContent: { paddingBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', fontFamily: 'PlusJakartaSans-Bold' },
  modalLabel: { fontSize: 15, fontWeight: '700', color: '#111827', fontFamily: 'Inter', marginTop: 16, marginBottom: 10 },
  catChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  chipActive: { borderColor: '#D95C27', backgroundColor: '#FFF1E6' },
  chipIcon: { fontSize: 16, marginRight: 6 },
  chipText: { fontSize: 14, fontWeight: '600', color: '#6B7280', fontFamily: 'Inter' },
  chipTextActive: { color: '#D95C27' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    minHeight: 100,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Inter',
    textAlignVertical: 'top',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 },
  locationText: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: { borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F3F4F6' },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#374151', fontFamily: 'Inter' },
  submitBtn: { backgroundColor: '#D95C27' },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', fontFamily: 'PlusJakartaSans-Bold' },
});
