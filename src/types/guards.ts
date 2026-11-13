import type { Playlist, Song } from './index';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * بررسی سبک داده‌ی خوانده‌شده از localStorage.
 * عمداً فقط فیلدهای ضروری چک می‌شن تا داده‌ی قدیمی کاربر به‌خاطر
 * نبودن یک فیلد اختیاری دور ریخته نشه.
 */
export const isSong = (value: unknown): value is Song =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.fileUrl === 'string';

export const isSongList = (value: unknown): value is Song[] =>
  Array.isArray(value) && value.every(isSong);

export const isPlaylist = (value: unknown): value is Playlist =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  isSongList(value.songs);

export const isPlaylistList = (value: unknown): value is Playlist[] =>
  Array.isArray(value) && value.every(isPlaylist);

export const isEqualizerSettings = (value: unknown): value is import('./index').EqualizerSettings =>
  isRecord(value) &&
  typeof value.enabled === 'boolean' &&
  typeof value.preset === 'string' &&
  Array.isArray(value.bands) &&
  value.bands.length === 5 &&
  value.bands.every((b) => typeof b === 'number') &&
  typeof value.bassBoost === 'number';

export const isSoundSettings = (value: unknown): value is import('./index').SoundSettings =>
  isRecord(value) &&
  typeof value.crossfadeSeconds === 'number' &&
  typeof value.fadeOnPlayPause === 'boolean' &&
  typeof value.gaplessPlayback === 'boolean' &&
  typeof value.playbackSpeed === 'number' &&
  typeof value.preservePitch === 'boolean' &&
  (value.reverbRoom === 'off' ||
    value.reverbRoom === 'studio' ||
    value.reverbRoom === 'hall' ||
    value.reverbRoom === 'cathedral') &&
  typeof value.reverbMix === 'number' &&
  typeof value.spatialSurround === 'number' &&
  typeof value.volumeNormalization === 'boolean' &&
  typeof value.stereoBalance === 'number' &&
  typeof value.monoAudio === 'boolean' &&
  typeof value.preampDb === 'number' &&
  typeof value.maxVolumeLimit === 'number' &&
  (value.eqMode === '5band' || value.eqMode === '10band') &&
  Array.isArray(value.bands10) &&
  value.bands10.length === 10 &&
  value.bands10.every((b) => typeof b === 'number') &&
  (value.outputProfile === 'default' ||
    value.outputProfile === 'headphones' ||
    value.outputProfile === 'speaker') &&
  typeof value.liveVisualizer === 'boolean';

export const isDisplaySettings = (value: unknown): value is import('./index').DisplaySettings =>
  isRecord(value) &&
  typeof value.adaptiveArtworkAccent === 'boolean' &&
  typeof value.adaptiveArtworkWallpaper === 'boolean' &&
  (value.fontFamily === 'vazirmatn' ||
    value.fontFamily === 'system' ||
    value.fontFamily === 'editorial') &&
  typeof value.fontScale === 'number' &&
  (value.listDensity === 'compact' ||
    value.listDensity === 'comfortable' ||
    value.listDensity === 'spacious') &&
  (value.cornerStyle === 'sharp' ||
    value.cornerStyle === 'balanced' ||
    value.cornerStyle === 'pill') &&
  typeof value.glassOpacity === 'number' &&
  typeof value.glassBlur === 'number' &&
  typeof value.oledPureBlack === 'boolean' &&
  typeof value.ambientGlow === 'boolean' &&
  (value.playerBarStyle === 'floating' || value.playerBarStyle === 'docked') &&
  (value.artworkStyle === 'classic' || value.artworkStyle === 'vinyl') &&
  (value.visualizerStyle === 'bars' ||
    value.visualizerStyle === 'wave' ||
    value.visualizerStyle === 'ring') &&
  typeof value.reduceMotion === 'boolean';

