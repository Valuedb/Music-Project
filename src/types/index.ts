/** یک آهنگ در کتابخانه */
export interface Song {
  id: string;
  name: string;
  artist: string;
  cover: string;
  fileUrl: string;
  playCount: number;
  addedAt: number;
  album?: string;
  year?: string;
  duration?: number;
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
}

export type RepeatMode = 'off' | 'all' | 'one';
