import { create } from 'zustand';
import { Audio } from 'expo-av';
import { Track } from '../services/MusicProvider';

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;
  soundObject: Audio.Sound | null;

  playTrack: (track: Track, queue?: Track[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  updatePlaybackStatus: (status: any) => void;
}

let currentLoadId = 0;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  isLoading: false,
  position: 0,
  duration: 0,
  soundObject: null,

  playTrack: async (track: Track, queue?: Track[]) => {
    const loadId = ++currentLoadId;
    const oldSound = get().soundObject;

    // Inmediatamente quitamos el viejo para prevenir race conditions si se hacen multiples clicks rápidos
    if (oldSound) {
       set({ soundObject: null, isPlaying: false });
       try { await oldSound.unloadAsync(); } catch (e) {}
    }

    set({ currentTrack: track, isLoading: true, queue: queue || get().queue });

    // Preparamos el modo de audio
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.streamUrl },
        { shouldPlay: true },
        // Envolvemos el status update para asegurarnos de que solo el último sonido actualice el status
        (status) => {
           if (loadId === currentLoadId) {
              get().updatePlaybackStatus(status);
           }
        }
      );

      // Si el usuario clickeó OTRA canción mientras esta se estaba cargando, la descargamos de inmediato
      if (loadId !== currentLoadId) {
        await sound.unloadAsync();
        return;
      }

      set({
        soundObject: sound,
        isPlaying: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load track:', error);
      alert('No se pudo reproducir la canción');
      set({ isLoading: false });
    }
  },

  togglePlayPause: async () => {
    const { soundObject, isPlaying } = get();
    if (!soundObject) return;

    if (isPlaying) {
      await soundObject.pauseAsync();
      set({ isPlaying: false });
    } else {
      await soundObject.playAsync();
      set({ isPlaying: true });
    }
  },

  playNext: async () => {
    const { currentTrack, queue, playTrack } = get();
    if (!currentTrack || queue.length === 0) return;

    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % queue.length;
    await playTrack(queue[nextIndex]);
  },

  playPrevious: async () => {
    const { currentTrack, queue, playTrack } = get();
    if (!currentTrack || queue.length === 0) return;

    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    await playTrack(queue[prevIndex]);
  },

  seek: async (positionMillis: number) => {
    const { soundObject } = get();
    if (soundObject) {
      await soundObject.setPositionAsync(positionMillis);
    }
  },

  updatePlaybackStatus: (status) => {
    if (status.isLoaded) {
      set({
        position: status.positionMillis,
        duration: status.durationMillis || 0,
        isPlaying: status.isPlaying,
      });

      if (status.didJustFinish) {
        // Auto-play next when track finishes
        get().playNext();
      }
    } else if (status.error) {
      console.error('Playback Error:', status.error);
    }
  }
}));
