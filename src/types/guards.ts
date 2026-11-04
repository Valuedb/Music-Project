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
