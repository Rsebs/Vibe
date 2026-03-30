import * as MediaLibrary from 'expo-media-library'
import ExpoFileReader from '../utils/ExpoFileReader'
import { MusicProvider, Track } from './MusicProvider'
const jsmediatags = require('jsmediatags/dist/jsmediatags.min.js')

jsmediatags.Config.addFileReader(ExpoFileReader as any)

export const LocalProvider: MusicProvider = {
  id: 'local',
  name: 'Música Local',
  iconName: 'folder',

  async search(query: string): Promise<Track[]> {
    const { status } = await MediaLibrary.requestPermissionsAsync()
    if (status !== 'granted') {
      alert('Se requieren permisos para escanear música local.')
      return []
    }

    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 3000,
      })

      const extractMetadata = (uri: string): Promise<any> => {
        return new Promise((resolve, reject) => {
          jsmediatags.read(uri, {
            onSuccess: (tag: any) => resolve(tag),
            onError: (error: any) => reject(error),
          })
        })
      }

      const tracks: Track[] = []
      const batchSize = 15

      for (let i = 0; i < media.assets.length; i += batchSize) {
        const batch = media.assets.slice(i, i + batchSize)

        const batchPromises = batch.map(async (asset): Promise<Track> => {
          let artist = 'Artista Desconocido'
          let title = asset.filename.replace(/\.[^/.]+$/, '')
          let albumArt = undefined

          try {
            const tagInfo = await extractMetadata(asset.uri)
            const tags = tagInfo.tags

            if (tags.title) title = tags.title
            if (tags.artist) artist = tags.artist
            if (tags.picture) {
              let base64String = ''
              for (let j = 0; j < tags.picture.data.length; j++) {
                base64String += String.fromCharCode(tags.picture.data[j])
              }
              const btoa = (input: string) => {
                const chars =
                  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
                let str = input
                let output = ''

                for (
                  let block = 0, charCode, k = 0, map = chars;
                  str.charAt(k | 0) || ((map = '='), k % 1);
                  output += map.charAt(63 & (block >> (8 - (k % 1) * 8)))
                ) {
                  charCode = str.charCodeAt((k += 3 / 4))
                  if (charCode > 0xff) {
                    throw new Error(
                      "'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.",
                    )
                  }
                  block = (block << 8) | charCode
                }
                return output
              }

              albumArt = `data:${tags.picture.format};base64,${btoa(base64String)}`
            }
          } catch (metaError) {
            console.debug(`Sin metadatos para ${asset.filename}`)
          }

          return {
            id: asset.id,
            title,
            artist,
            albumArt,
            streamUrl: asset.uri,
            duration: asset.duration * 1000,
          }
        })

        // Esperar a procesar este lote de metadatos antes de pedirle al FileSystem de memoria los siguientes 15 archivos
        const batchResults = await Promise.all(batchPromises)
        tracks.push(...batchResults)
      }

      if (!query) return tracks

      const lowerQuery = query.toLowerCase()
      return tracks.filter(
        (t) =>
          t.title.toLowerCase().includes(lowerQuery) ||
          t.artist.toLowerCase().includes(lowerQuery),
      )
    } catch (error) {
      console.error('Error fetching local media:', error)
      return []
    }
  },

  async getTopTracks(): Promise<Track[]> {
    return this.search('')
  },
}
