import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { fetchNewsItems } from '../../lib/queries/news';
import { NewsItem } from '../../types/news-item';

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
              <Text style={styles.thumbGlyph}>📰</Text>
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
            <Text style={styles.badgeText}>Distrito: Comas / Carabayllo</Text>
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
                  <Text style={styles.featuredGlyph}>📰</Text>
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
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  header: {
    backgroundColor: '#2A2A2A',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#252525',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  badgeText: { fontSize: 12, color: '#D95C27', fontWeight: '600', fontFamily: 'Inter' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: { fontSize: 15, color: '#999999', fontFamily: 'Inter' },
  list: { padding: 16 },
  featured: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#2A2A2A',
  },
  featuredImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  featuredImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredGlyph: { fontSize: 44 },
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
    color: '#CCCCCC',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  thumb: { width: 80, height: 80, borderRadius: 8, resizeMode: 'cover' },
  thumbPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbGlyph: { fontSize: 28 },
  rowBody: { flex: 1, marginLeft: 14 },
  rowCategory: { fontSize: 11, fontWeight: '700', color: '#D95C27', fontFamily: 'Inter', letterSpacing: 0.5 },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginTop: 3,
  },
  rowDescription: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'Inter',
    marginTop: 3,
  },
});
