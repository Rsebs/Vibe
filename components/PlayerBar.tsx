import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { usePlayerStore } from '../store/usePlayerStore';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PlayerBar() {
  const { currentTrack, isPlaying, isLoading, togglePlayPause, playNext } = usePlayerStore();
  const insets = useSafeAreaInsets();

  if (!currentTrack) return null;

  return (
    <Link href="/modal" asChild>
      <Pressable style={StyleSheet.flatten([styles.container, { bottom: 50 + insets.bottom }])}>
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            {currentTrack.albumArt ? (
              <Image source={{ uri: currentTrack.albumArt }} style={styles.albumArt} />
            ) : (
              <View style={[styles.albumArt, styles.placeholder]} />
            )}
          </View>

          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>

          <View style={styles.controls}>
            {isLoading ? (
              <View style={styles.button}>
                 <ActivityIndicator color="#1DB954" />
              </View>
            ) : (
              <Pressable onPress={togglePlayPause} style={styles.button}>
                {isPlaying ? <Pause color="#FFF" size={24} /> : <Play color="#FFF" size={24} />}
              </Pressable>
            )}
            <Pressable onPress={playNext} style={styles.button}>
              <SkipForward color="#FFF" size={24} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 8,
    right: 8,
    backgroundColor: '#282828',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  imageContainer: {
    marginRight: 12,
  },
  albumArt: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  placeholder: {
    backgroundColor: '#404040',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  artist: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    padding: 12,
  },
});
