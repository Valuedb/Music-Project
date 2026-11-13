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
  | { mode: 'until'; endsAt: number; durationMinutes?: number }
  | { mode: 'songEnd' };

export type ReverbRoom = 'off' | 'studio' | 'hall' | 'cathedral';
export type AudioOutputProfile = 'default' | 'headphones' | 'speaker';
export type EqBandMode = '5band' | '10band';

export interface SoundProfileSnapshot {
  eq: EqualizerSettings;
  bands10: number[];
  eqMode: EqBandMode;
  preampDb: number;
  spatialSurround: number;
  reverbRoom: ReverbRoom;
  reverbMix: number;
}

export interface SoundSettings {
  crossfadeSeconds: number;
  fadeOnPlayPause: boolean;
  gaplessPlayback: boolean;
  playbackSpeed: number;
  preservePitch: boolean;
  reverbRoom: ReverbRoom;
  reverbMix: number;
  spatialSurround: number;
  volumeNormalization: boolean;
  stereoBalance: number;
  monoAudio: boolean;
  preampDb: number;
  maxVolumeLimit: number;
  eqMode: EqBandMode;
  bands10: number[];
  outputProfile: AudioOutputProfile;
  profilePresets: Partial<Record<AudioOutputProfile, SoundProfileSnapshot>>;
  liveVisualizer: boolean;
}

export type FontChoice = 'vazirmatn' | 'system' | 'editorial';
export type ListDensity = 'compact' | 'comfortable' | 'spacious';
export type CornerStyle = 'sharp' | 'balanced' | 'pill';
export type PlayerBarStyle = 'floating' | 'docked';
export type ArtworkStyle = 'classic' | 'vinyl';
export type VisualizerStyle = 'bars' | 'wave' | 'ring';

export interface DisplaySettings {
  adaptiveArtworkAccent: boolean;
  adaptiveArtworkWallpaper: boolean;
  fontFamily: FontChoice;
  fontScale: number;
  listDensity: ListDensity;
  cornerStyle: CornerStyle;
  glassOpacity: number;
  glassBlur: number;
  oledPureBlack: boolean;
  ambientGlow: boolean;
  playerBarStyle: PlayerBarStyle;
  artworkStyle: ArtworkStyle;
  visualizerStyle: VisualizerStyle;
  reduceMotion: boolean;
}
