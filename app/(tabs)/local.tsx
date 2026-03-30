import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TextInput, View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import { LocalProvider } from '@/services/LocalProvider';
import { Track } from '@/services/MusicProvider';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Search, Music } from 'lucide-react-native';

export default function LocalSearchScreen() {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const { playTrack, currentTrack } = usePlayerStore();

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      try {
        if (query.trim() === '') {
          const results = LocalProvider.getTopTracks ? await LocalProvider.getTopTracks() : [];
          setTracks(results);
        } else {
          const results = await LocalProvider.search(query);
          setTracks(results);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      fetchTracks();
    }, 300); // Faster debounce for local files

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const renderItem = ({ item }: { item: Track }) => {
    const isPlaying = currentTrack?.id === item.id;
    return (
      <Pressable 
        style={[styles.trackItem, isPlaying && styles.trackItemActive]}
        onPress={() => playTrack(item, tracks)}
      >
        <View style={styles.albumArtPlaceholder}>
          <Music color="#b3b3b3" size={24} />
        </View>
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, isPlaying && { color: '#1DB954' }]} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color="#b3b3b3" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar música local..."
            placeholderTextColor="#b3b3b3"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color="#1DB954" size="large" />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id.toString() + item.streamUrl}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 50 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay música local encontrada</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
  trackItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  trackItemActive: {
    backgroundColor: '#1a1a1a',
  },
  albumArtPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  trackTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  trackArtist: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  emptyText: {
    color: '#b3b3b3',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  }
});
