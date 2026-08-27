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

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'ahora';
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d}d`;
  return new Date(iso).toLocaleDateString('es-PE');
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

  const renderItem = useMemo(
    () =>
      ({ item }: { item: NewsItem }) => (
        <View style={styles.card}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.cardImage} />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Text style={styles.placeholderGlyph}>📰</Text>
            </View>
          )}
          <View style={styles.cardBody}>
            <Text style={styles.time}>{timeAgo(item.published_at)}</Text>
            <Text style={styles.title}>{item.title}</Text>
            {item.description ? (
              <Text style={styles.description} numberOfLines={4}>
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
          <Text style={styles.headerTitle}>Noticias</Text>
          <Text style={styles.headerSubtitle}>Avisos de tu zona</Text>
        </SafeAreaView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D95C27" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>Aún no hay avisos publicados.</Text>
            </View>
          }
        />
      )}
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
  emptyText: { fontSize: 15, color: '#999', fontFamily: 'Inter' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0EAE0',
  },
  cardImage: { width: '100%', height: 150, resizeMode: 'cover' },
  cardImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#FFE3D5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderGlyph: { fontSize: 40 },
  cardBody: { padding: 16 },
  time: { fontSize: 12, color: '#B4551F', fontFamily: 'Inter', marginBottom: 6 },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a1a',
    fontFamily: 'Inter',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
    fontFamily: 'Inter',
  },
});
