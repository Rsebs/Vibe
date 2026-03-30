import axios from 'axios';
import { MusicProvider, Track } from './MusicProvider';

const DEEZER_API_URL = 'https://api.deezer.com';

export const DeezerProvider: MusicProvider = {
  id: 'deezer',
  name: 'Deezer (30s Previews)',
  iconName: 'music',

  async search(query: string): Promise<Track[]> {
    if (!query) return [];
    try {
      const response = await axios.get(`${DEEZER_API_URL}/search?q=${encodeURIComponent(query)}&limit=100`);
      return response.data.data.map((item: any) => ({
        id: item.id.toString(),
        title: item.title,
        artist: item.artist.name,
        albumArt: item.album.cover_xl || item.album.cover_big || item.album.cover_medium,
        streamUrl: item.preview, // This is the 30-second preview
        duration: 30000, // 30 seconds max for previews usually
      })).filter((track: Track) => !!track.streamUrl);
    } catch (error) {
      console.error('Deezer search error:', error);
      return [];
    }
  },

  async getTopTracks(): Promise<Track[]> {
    try {
      // Deezer '/chart/0/tracks' supports limit
      const response = await axios.get(`${DEEZER_API_URL}/chart/0/tracks?limit=100`);
      return response.data.data.map((item: any) => ({
        id: item.id.toString(),
        title: item.title,
        artist: item.artist.name,
        albumArt: item.album.cover_xl || item.album.cover_big || item.album.cover_medium,
        streamUrl: item.preview,
        duration: 30000,
      })).filter((track: Track) => !!track.streamUrl);
    } catch (error) {
      console.error('Deezer top tracks error:', error);
      return [];
    }
  }
};
