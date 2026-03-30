export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  streamUrl: string; // Remote URL or local file URI
  duration?: number; // In milliseconds
}

export interface MusicProvider {
  id: string;
  name: string;
  iconName: string; // for UI representing the provider
  search(query: string): Promise<Track[]>;
  getTopTracks?(): Promise<Track[]>;
}
