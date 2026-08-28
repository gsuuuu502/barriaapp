import { useCallback, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { fetchNewsItems } from '../../lib/queries/news';
import { NewsItem } from '../../types/news-item';

type IconName = ComponentProps<typeof Ionicons>['name'];

function formatPublished(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  return isToday ? 'Hoy' : d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
}

export default function NoticiasScreen() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchNewsItems().then((data) => {
        if (!active) return;
        setItems(data);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const featured = items[0];
  const secondary = useMemo(() => items.slice(1), [items]);

  const renderItem = useMemo(
    () =>
      ({ item }: { item: NewsItem }) => (
        <View style={styles.rowCard}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.thumb} />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Ionicons name="newspaper-outline" size={28} color="#9CA3AF" />
            </View>
          )}
          <View style={styles.rowBody}>
            <Text style={styles.rowCategory}>MUNICIPAL</Text>
            <Text style={styles.rowTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.description ? (
              <Text style={styles.rowDescription} numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
          </View>
        </View>
      ),
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView>
          <Text style={styles.headerTitle}>Noticias y Novedades</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Avisos de tu barrio</Text>
          </View>
        </SafeAreaView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D95C27" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Aún no hay avisos publicados.</Text>
        </View>
      ) : (
        <FlatList
          data={secondary}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.featured}>
              {featured.image_url ? (
                <Image source={{ uri: featured.image_url }} style={styles.featuredImage} />
              ) : (
                <View style={styles.featuredImagePlaceholder}>
                  <Ionicons name="newspaper-outline" size={44} color="#9CA3AF" />
                </View>
              )}
              <View style={styles.featuredOverlay}>
                <View style={styles.featuredTag}>
                  <Text style={styles.featuredTagText}>MUNICIPAL</Text>
                </View>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {featured.title}
                </Text>
                <Text style={styles.featuredDate}>
                  Municipalidad · {formatPublished(featured.published_at)}
                </Text>
              </View>
            </View>
          }
        />
      )}
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 4,
  },
  badgeText: { fontSize: 12, color: '#D95C27', fontWeight: '600', fontFamily: 'Inter' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: { fontSize: 15, color: '#6B7280', fontFamily: 'Inter' },
  list: { padding: 16 },
  featured: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  featuredImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  featuredImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  featuredTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#D95C27',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  featuredTagText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, fontFamily: 'Inter' },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  featuredDate: {
    fontSize: 12,
    color: '#E5E7EB',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDEFF2',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  thumb: { width: 80, height: 80, borderRadius: 8, resizeMode: 'cover' },
  thumbPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowBody: { flex: 1, marginLeft: 14 },
  rowCategory: { fontSize: 11, fontWeight: '700', color: '#D95C27', fontFamily: 'Inter', letterSpacing: 0.5 },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
    marginTop: 3,
  },
  rowDescription: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginTop: 3,
  },
});
