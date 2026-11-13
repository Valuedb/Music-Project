export type AppTab =
  | 'home'
  | 'allSongs'
  | 'playlists'
  | 'artists'
  | 'albums'
  | 'folders'
  | 'settings';

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
  folder?: string;
  year?: string;
  duration?: number;
  isFavorite?: boolean;
  lastPlayedAt?: number;
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
}

export type RepeatMode = 'off' | 'all' | 'one';

/** حالت‌های پیش‌فرض اکولایزر */
export type EqualizerPreset =
  | 'flat'
  | 'bassBoost'
  | 'pop'
  | 'rock'
  | 'jazz'
  | 'vocal'
  | 'electronic'
  | 'custom';

/** تنظیمات اکولایزر و افکت‌های صوتی */
export interface EqualizerSettings {
  enabled: boolean;
  preset: EqualizerPreset;
  bands: number[]; // ۵ باند فرکانسی برحسب دسی‌بل (-12 تا +12)
  bassBoost: number; // تقویت بیس برحسب دسی‌بل (0 تا +12)
}

export type SleepTimerState =
  | { mode: 'off' }
  | { mode: 'until'; endsAt: number }
  | { mode: 'songEnd' };

