import type { Song } from '../types';

interface MediaSessionCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek?: (time: number) => void;
}

/**
 * مدیریت هماهنگی اطلاعات و رویدادهای پخش با Media Session API بومی سیستم‌عامل
 * (Windows Media Controls, Android Lockscreen Widget, iOS Control Center)
 */
export const syncMediaSession = (
  song: Song | null,
  isPlaying: boolean,
  callbacks: MediaSessionCallbacks
) => {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }

  if (!song) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
    return;
  }

  // تنظیم متادیتا برای نمایش کاور و متن روی لاک‌اسکرین و کنترل‌های سیستم
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.name,
      artist: song.artist,
      album: song.album || 'Library',
      artwork: [
        { src: song.cover, sizes: '96x96', type: 'image/jpeg' },
        { src: song.cover, sizes: '128x128', type: 'image/jpeg' },
        { src: song.cover, sizes: '192x192', type: 'image/jpeg' },
        { src: song.cover, sizes: '256x256', type: 'image/jpeg' },
        { src: song.cover, sizes: '512x512', type: 'image/jpeg' },
      ],
    });

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // اتصال اکشن‌های دکمه‌های سخت‌افزاری و نرم‌افزاری سیستم‌عامل
    navigator.mediaSession.setActionHandler('play', () => callbacks.onPlay());
    navigator.mediaSession.setActionHandler('pause', () => callbacks.onPause());
    navigator.mediaSession.setActionHandler('previoustrack', () => callbacks.onPrev());
    navigator.mediaSession.setActionHandler('nexttrack', () => callbacks.onNext());

    if (callbacks.onSeek) {
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && callbacks.onSeek) {
          callbacks.onSeek(details.seekTime);
        }
      });
    }
  } catch {
    // MediaSession ممکن است در برخی محیط‌های خاص یا وب‌ویوهای محدود دسترسی ندهد
  }
};
