import { usePlayerStore } from '@/store/usePlayerStore'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import {
  ChevronDown,
  Disc3,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from 'lucide-react-native'
import React, { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

export default function ModalScreen() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    togglePlayPause,
    playNext,
    playPrevious,
    position,
    duration,
    seek,
  } = usePlayerStore()
  const insets = useSafeAreaInsets()

  // UI states inmediatos para el Slider
  const [isDragging, setIsDragging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0) // Porcentaje de 0 a 100
  const barWidthRef = useRef(0)
  const startDragProgressRef = useRef(0)

  // Determinar qué progreso mostrar (el real o el del dedo del usuario si está arrastrando)
  const realProgressPercent = duration > 0 ? (position / duration) * 100 : 0
  const currentShowPercent = isDragging ? dragProgress : realProgressPercent
  const currentShowMillis = isDragging
    ? (dragProgress / 100) * duration
    : position

  const formatTime = (millis: number) => {
    const totalSeconds = millis / 1000
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true)
        if (barWidthRef.current > 0) {
          const x = evt.nativeEvent.locationX
          const percentage = Math.max(
            0,
            Math.min(100, (x / barWidthRef.current) * 100),
          )
          startDragProgressRef.current = percentage
          setDragProgress(percentage)
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (barWidthRef.current > 0) {
          // Calculamos cuánto se movió el dedo respecto al punto inicial y el ancho de la barra
          const deltaPercentage = (gestureState.dx / barWidthRef.current) * 100
          const newPercentage = Math.max(
            0,
            Math.min(100, startDragProgressRef.current + deltaPercentage),
          )
          setDragProgress(newPercentage)
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false)
        if (duration > 0 && barWidthRef.current > 0) {
          const deltaPercentage = (gestureState.dx / barWidthRef.current) * 100
          const finalPercentage = Math.max(
            0,
            Math.min(100, startDragProgressRef.current + deltaPercentage),
          )
          seek((finalPercentage / 100) * duration)
        }
      },
      onPanResponderTerminate: () => {
        setIsDragging(false)
      },
    }),
  ).current

  if (!currentTrack) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff' }}>No hay pista seleccionada</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#1DB954' }}>Volver</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { marginTop: insets.top || 20 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <ChevronDown color="#fff" size={32} />
        </Pressable>
        <Text style={styles.headerTitle}>Actualmente reproduciendo</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Album Art */}
      <View style={styles.albumContainer}>
        {currentTrack.albumArt ? (
          <Image
            source={{ uri: currentTrack.albumArt }}
            style={styles.albumArt}
          />
        ) : (
          <View style={[styles.albumArt, styles.albumPlaceholder]}>
            <Disc3 color="#404040" size={120} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {currentTrack.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {currentTrack.artist}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View
          {...panResponder.panHandlers}
          style={styles.progressHitbox}
          onLayout={(e) => {
            barWidthRef.current = e.nativeEvent.layout.width
          }}
        >
          <View
            style={[
              styles.progressBarBackground,
              isDragging && { height: 6 },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                { width: `${currentShowPercent}%` },
              ]}
            />
            <View
              style={[
                styles.progressThumb,
                {
                  left: `${currentShowPercent}%`,
                  transform: [
                    { translateY: -6 },
                    { scale: isDragging ? 1.5 : 1 }
                  ],
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, isDragging && { color: '#1DB954' }]}>
            {formatTime(currentShowMillis)}
          </Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <Pressable onPress={playPrevious} style={styles.controlButton}>
          <SkipBack color="#fff" size={40} />
        </Pressable>
        {isLoading ? (
          <View style={styles.playButton}>
            <ActivityIndicator color="#000" size="large" />
          </View>
        ) : (
          <Pressable onPress={togglePlayPause} style={styles.playButton}>
            {isPlaying ? (
              <Pause color="#000" size={36} fill="#000" />
            ) : (
              <Play color="#000" size={36} fill="#000" />
            )}
          </Pressable>
        )}
        <Pressable onPress={playNext} style={styles.controlButton}>
          <SkipForward color="#fff" size={40} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  albumContainer: {
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  albumArt: {
    width: width - 48,
    height: width - 48,
    borderRadius: 8,
  },
  albumPlaceholder: {
    backgroundColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    marginBottom: 30,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  artist: {
    color: '#b3b3b3',
    fontSize: 18,
  },
  progressContainer: {
    marginBottom: 40,
  },
  progressHitbox: {
    paddingVertical: 10,
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#4d4d4d',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressThumb: {
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    position: 'absolute',
    top: '50%',
    marginLeft: -6, // Centrar el thumb respecto al porcentaje
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    padding: 10,
  },
  playButton: {
    width: 64,
    height: 64,
    backgroundColor: '#1DB954',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
