import { useCallback, useEffect, useRef, useState } from 'react';
import { PLAY_COUNT_THRESHOLD_SECONDS } from '../player/constants';
import type { DisplaySettings, RepeatMode, SleepTimerState, Song, SoundSettings } from '../types';
import { FullScreenPlayer } from './FullScreenPlayer';
import { QueueDrawer } from './QueueDrawer';
import { CoverImage } from './CoverImage';
import { syncMediaSession, syncMediaSessionPosition } from '../utils/mediaSession';
import { DEFAULT_SOUND_SETTINGS, audioEffects } from '../player/audioEffects';
import { DEFAULT_DISPLAY_SETTINGS } from '../theme';
import { usePersistentState } from '../hooks/usePersistentState';
import { STORAGE_KEYS } from '../storage/keys';
import { readJSON, writeJSON } from '../storage/safeStorage';
import { getAudioBlob } from '../storage/mediaStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

/**
 * رنگ‌ها و متریال نوار پلیر به سبک Apple Music (رنگ‌های سیستمی Apple HIG):
 * - سطح شیشه‌ای نوار (پس‌زمینه، لبه و سایه) از theme.glass.bar می‌آید (src/theme.ts)
 * - آیکون‌ها تک‌رنگ‌اند؛ فقط حالت روشن شافل/تکرار رنگ اصلی تم را می‌گیرد
 */
const getBarPalette = (isDark: boolean) =>
  isDark
    ? {
        title: '#ffffff',
        secondary: 'rgba(235, 235, 245, 0.6)',
        icon: '#ffffff',
        iconDim: 'rgba(235, 235, 245, 0.6)',
        iconHover: '#ffffff',
      }
    : {
        title: '#1d1d1f',
        secondary: 'rgba(60, 60, 67, 0.6)',
        icon: '#1d1d1f',
        iconDim: 'rgba(60, 60, 67, 0.6)',
        iconHover: '#000000',
      };

/** افکت لمس/کلیک نرم و ساده دکمه‌های نوار پخش (بدون تارشدن در هاور) */
const BUTTON_CSS = `
.pb-btn { transition: color 0.18s ease, opacity 0.18s ease, scale 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
.pb-btn:hover:not(:disabled) { opacity: 0.82; }
.pb-btn:active:not(:disabled) { opacity: 0.62; scale: 0.95; transition-duration: 0.08s; }
`;

interface PlayerBarProps {
  currentSong: Song | null;
  queue: Song[];
  removeFromQueue: (index: number) => void;
  playNext: () => boolean;
  playPrev: () => boolean;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  repeatMode: RepeatMode;
  setRepeatMode: (mode: RepeatMode) => void;
  isShuffle: boolean;
  setIsShuffle: (val: boolean) => void;
  playToken: number;
  onSongPlayed: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  t: any;
  theme: any;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onPlayQueueSong?: (index: number) => void;
  onClearQueue?: () => void;
  onShuffleQueue?: () => void;
  onCreatePlaylist?: (name: string, songs: Song[]) => void;
  onSelectTabIndex?: (index: number) => void;
  onOpenSettings?: () => void;
  sleepTimer?: SleepTimerState;
  onClearSleepTimer?: () => void;
  peekNext?: () => Song | null;
  soundSettings?: SoundSettings;
  displaySettings?: DisplaySettings;
}

type AudioWithPitchFlags = HTMLAudioElement & {
  preservesPitch?: boolean;
  webkitPreservesPitch?: boolean;
  mozPreservesPitch?: boolean;
};

const applyDeckPlaybackParams = (
  audio: HTMLAudioElement | null,
  vol: number,
  speed: number,
  preservePitch: boolean
) => {
  if (!audio) return;
  audio.volume = vol;
  const clampedRate = Math.max(0.5, Math.min(2, speed || 1));
  if (audio.playbackRate !== clampedRate) {
    audio.playbackRate = clampedRate;
  }
  const flagged = audio as AudioWithPitchFlags;
  flagged.preservesPitch = preservePitch;
  flagged.webkitPreservesPitch = preservePitch;
  flagged.mozPreservesPitch = preservePitch;
};

export const PlayerBar = ({
  currentSong,
  queue,
  removeFromQueue,
  playNext,
  playPrev,
  reorderQueue,
  repeatMode,
  setRepeatMode,
  isShuffle,
  setIsShuffle,
  playToken,
  onSongPlayed,
  onToggleFavorite,
  t,
  theme,
  onPlayStateChange,
  onPlayQueueSong,
  onClearQueue,
  onShuffleQueue,
  onCreatePlaylist,
  onSelectTabIndex,
  onOpenSettings,
  sleepTimer,
  onClearSleepTimer,
  peekNext,
  soundSettings = DEFAULT_SOUND_SETTINGS,
  displaySettings = DEFAULT_DISPLAY_SETTINGS,
}: PlayerBarProps) => {
  const audioRefA = useRef<HTMLAudioElement>(null);
  const audioRefB = useRef<HTMLAudioElement>(null);
  const activeDeckRef = useRef<'A' | 'B'>('A');
  const getActiveAudio = useCallback(
    () => (activeDeckRef.current === 'A' ? audioRefA.current : audioRefB.current),
    []
  );
  const getStandbyAudio = useCallback(
    () => (activeDeckRef.current === 'A' ? audioRefB.current : audioRefA.current),
    []
  );

  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayState = useCallback(
    (playing: boolean) => {
      setIsPlaying(playing);
      onPlayStateChange?.(playing);
    },
    [onPlayStateChange]
  );

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  const [volume, setVolume] = usePersistentState<number>(
    STORAGE_KEYS.volume,
    1,
    (v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1
  );
  const lastNonZeroVolumeRef = useRef<number>(volume > 0 ? volume : 1);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [isHoveringVolume, setIsHoveringVolume] = useState(false);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);

  const maxVolFactor = Math.max(0.2, Math.min(1, (soundSettings.maxVolumeLimit ?? 100) / 100));
  const effectiveVolume = Math.min(volume, maxVolFactor);

  /** برای هر پخش فقط یک بار playCount زیاد بشه */
  const countedRef = useRef(false);
  const retriedRecoveryRef = useRef<string | null>(null);
  const lastPosSyncRef = useRef(0);
  const lastPlaybackSaveRef = useRef(0);
  const pendingResumeTimeRef = useRef<number | null>(null);
  const pauseFadeTimerRef = useRef<number | null>(null);
  const crossfadingToIdRef = useRef<string | null>(null);
  const crossfadeCleanupTimerRef = useRef<number | null>(null);
  const preloadedRef = useRef<{ songId: string; url: string } | null>(null);
  const skipNextLoadRef = useRef<string | null>(null);
  const songUrl = currentSong?.fileUrl ?? null;

  // رفرنس‌های پایدار برای جلوگیری از closure کهنه در MediaSession و کلیدهای میانبر
  const playNextRef = useRef(playNext);
  const playPrevRef = useRef(playPrev);
  const peekNextRef = useRef(peekNext);
  const onToggleFavoriteRef = useRef(onToggleFavorite);
  const songDurationRef = useRef<number>(currentSong?.duration || 0);

  useEffect(() => {
    playNextRef.current = playNext;
    playPrevRef.current = playPrev;
    peekNextRef.current = peekNext;
    onToggleFavoriteRef.current = onToggleFavorite;
    songDurationRef.current = currentSong?.duration || 0;
  });

  // همگام‌سازی ولوم ایمن، سرعت پخش و حفظ زیر و بمی روی هر دو دک صوتی
  useEffect(() => {
    applyDeckPlaybackParams(
      audioRefA.current,
      effectiveVolume,
      soundSettings.playbackSpeed,
      soundSettings.preservePitch
    );
    applyDeckPlaybackParams(
      audioRefB.current,
      effectiveVolume,
      soundSettings.playbackSpeed,
      soundSettings.preservePitch
    );
    if (volume > 0) {
      lastNonZeroVolumeRef.current = volume;
    }
  }, [volume, effectiveVolume, soundSettings.playbackSpeed, soundSettings.preservePitch]);

  // اتصال هر دو دک صوتی به موتور اکولایزر و افکت‌ها
  useEffect(() => {
    if (audioRefA.current) audioEffects.attach(audioRefA.current);
    if (audioRefB.current) audioEffects.attach(audioRefB.current);
    return () => {
      if (pauseFadeTimerRef.current) window.clearTimeout(pauseFadeTimerRef.current);
      if (crossfadeCleanupTimerRef.current) window.clearTimeout(crossfadeCleanupTimerRef.current);
    };
  }, []);

  // نمایش نام آهنگ در نوار عنوان پنجره و تسک‌بار ویندوز هنگام پخش
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (currentSong && isPlaying) {
      document.title = `▶ ${currentSong.name} - ${currentSong.artist} | Apple Music`;
    } else if (currentSong) {
      document.title = `${currentSong.name} - ${currentSong.artist} | Apple Music`;
    } else {
      document.title = 'Music Player';
    }
  }, [currentSong, isPlaying]);

  // بازیابی زمان آخرین پخش (فقط اگر playToken == 0 باشد یعنی از نشست قبلی بازیابی شده)
  useEffect(() => {
    if (playToken !== 0 || !currentSong) return;
    const saved = readJSON<{ songId?: string; currentTime?: number } | null>(
      STORAGE_KEYS.lastPlayback,
      null
    );
    if (saved && saved.songId === currentSong.id && typeof saved.currentTime === 'number' && saved.currentTime > 0) {
      pendingResumeTimeRef.current = saved.currentTime;
    }
  }, [currentSong, playToken]);

  // بارگذاری و پخش آهنگ با پشتیبانی از Crossfade و Gapless و Fade
  useEffect(() => {
    if (currentSong && skipNextLoadRef.current === currentSong.id) {
      skipNextLoadRef.current = null;
      preloadedRef.current = null;
      countedRef.current = false;
      retriedRecoveryRef.current = null;
      const active = getActiveAudio();
      if (active) {
        setDuration(active.duration || songDurationRef.current || 0);
        setCurrentTime(active.currentTime || 0);
      }
      return;
    }

    if (crossfadeCleanupTimerRef.current) {
      window.clearTimeout(crossfadeCleanupTimerRef.current);
      crossfadeCleanupTimerRef.current = null;
    }
    if (pauseFadeTimerRef.current) {
      window.clearTimeout(pauseFadeTimerRef.current);
      pauseFadeTimerRef.current = null;
    }
    crossfadingToIdRef.current = null;
    preloadedRef.current = null;

    const standby = getStandbyAudio();
    if (standby) {
      audioEffects.cancelDeckFade(standby);
      standby.pause();
      standby.removeAttribute('src');
      standby.load();
      audioEffects.setDeckGain(standby, 1, 0);
    }

    const audio = getActiveAudio();
    if (!audio) return;
    countedRef.current = false;
    retriedRecoveryRef.current = null;
    audioEffects.attach(audio);
    audioEffects.cancelDeckFade(audio);
    audioEffects.setDeckGain(audio, 1, 0);
    applyDeckPlaybackParams(
      audio,
      effectiveVolume,
      soundSettings.playbackSpeed,
      soundSettings.preservePitch
    );

    if (!songUrl) {
      setCurrentTime(0);
      setDuration(0);
      audio.pause();
      handlePlayState(false);
      audio.removeAttribute('src');
      audio.load();
      return;
    }

    setDuration(songDurationRef.current || 0);
    audio.src = songUrl;

    if (playToken === 0) {
      const resumeAt = pendingResumeTimeRef.current ?? 0;
      setCurrentTime(resumeAt);
      const applyResumeTime = () => {
        if (pendingResumeTimeRef.current !== null && Number.isFinite(audio.duration)) {
          const clamped = Math.min(pendingResumeTimeRef.current, audio.duration || pendingResumeTimeRef.current);
          audio.currentTime = clamped;
          setCurrentTime(clamped);
          pendingResumeTimeRef.current = null;
        }
      };
      audio.addEventListener('loadedmetadata', applyResumeTime, { once: true });
      return () => audio.removeEventListener('loadedmetadata', applyResumeTime);
    }

    setCurrentTime(0);
    pendingResumeTimeRef.current = null;
    if (soundSettings.fadeOnPlayPause) {
      audioEffects.setDeckGain(audio, 0.02, 0);
    }
    audio
      .play()
      .then(() => {
        if (soundSettings.fadeOnPlayPause) {
          audioEffects.setDeckGain(audio, 1, 0.22);
        }
        handlePlayState(true);
      })
      .catch((err: unknown) => {
        audioEffects.setDeckGain(audio, 1, 0);
        if (err instanceof DOMException && err.name === 'AbortError') return;
        handlePlayState(false);
        console.error(err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songUrl, playToken, handlePlayState]);

  // ذخیره زمان فعلی پخش هنگام بستن پنجره ویندوز
  useEffect(() => {
    const savePlaybackPosition = () => {
      if (!currentSong) return;
      const tPos = getActiveAudio()?.currentTime ?? currentTime;
      writeJSON(STORAGE_KEYS.lastPlayback, { songId: currentSong.id, currentTime: tPos });
    };
    window.addEventListener('beforeunload', savePlaybackPosition);
    window.addEventListener('pagehide', savePlaybackPosition);
    return () => {
      window.removeEventListener('beforeunload', savePlaybackPosition);
      window.removeEventListener('pagehide', savePlaybackPosition);
    };
  }, [currentSong, currentTime, getActiveAudio]);

  const handleTimeUpdate = (deck: 'A' | 'B') => {
    if (deck !== activeDeckRef.current) return;
    const audio = getActiveAudio();
    if (!audio) return;
    if (!isPlaying && !audio.paused && !pauseFadeTimerRef.current) {
      handlePlayState(true);
    }
    const nowTime = audio.currentTime;
    const totalDur = audio.duration || 0;
    setCurrentTime(nowTime);
    setDuration(totalDur);

    const nowMs = Date.now();
    if (nowMs - lastPosSyncRef.current > 950) {
      lastPosSyncRef.current = nowMs;
      syncMediaSessionPosition(totalDur, nowTime, audio.playbackRate || 1);
    }
    if (currentSong && nowMs - lastPlaybackSaveRef.current > 4000) {
      lastPlaybackSaveRef.current = nowMs;
      writeJSON(STORAGE_KEYS.lastPlayback, { songId: currentSong.id, currentTime: nowTime });
    }

    if (currentSong && !countedRef.current) {
      const threshold = Math.min(PLAY_COUNT_THRESHOLD_SECONDS, (audio.duration || Infinity) / 2);
      if (nowTime >= threshold) {
        countedRef.current = true;
        onSongPlayed(currentSong.id);
      }
    }

    // مدیریت Crossfade و پیش‌بارگذاری Gapless
    if (
      totalDur > 0 &&
      Number.isFinite(totalDur) &&
      repeatMode !== 'one' &&
      sleepTimer?.mode !== 'songEnd'
    ) {
      const remaining = totalDur - nowTime;
      const crossfadeSec = soundSettings.crossfadeSeconds || 0;

      if (
        crossfadeSec > 0 &&
        totalDur > crossfadeSec * 2 + 2 &&
        remaining <= crossfadeSec &&
        remaining > 0.25 &&
        !crossfadingToIdRef.current
      ) {
        const nextSong = peekNextRef.current?.() ?? null;
        const standby = getStandbyAudio();
        if (nextSong && standby) {
          crossfadingToIdRef.current = nextSong.id;
          const outgoing = audio;
          const nextDeck: 'A' | 'B' = activeDeckRef.current === 'A' ? 'B' : 'A';
          audioEffects.attach(standby);
          applyDeckPlaybackParams(
            standby,
            effectiveVolume,
            soundSettings.playbackSpeed,
            soundSettings.preservePitch
          );
          if (preloadedRef.current?.songId !== nextSong.id) {
            standby.src = nextSong.fileUrl;
            standby.currentTime = 0;
          }
          audioEffects.setDeckGain(standby, 0.001, 0);
          activeDeckRef.current = nextDeck;
          skipNextLoadRef.current = nextSong.id;

          const fadeDur = Math.max(0.4, Math.min(crossfadeSec, remaining));
          standby
            .play()
            .then(() => {
              audioEffects.setDeckGain(standby, 1, fadeDur);
              audioEffects.setDeckGain(outgoing, 0, fadeDur);
              crossfadeCleanupTimerRef.current = window.setTimeout(() => {
                outgoing.pause();
                outgoing.removeAttribute('src');
                outgoing.load();
                audioEffects.setDeckGain(outgoing, 1, 0);
                crossfadingToIdRef.current = null;
              }, fadeDur * 1000 + 80);
              playNextRef.current();
            })
            .catch(() => {
              activeDeckRef.current = nextDeck === 'A' ? 'B' : 'A';
              skipNextLoadRef.current = null;
              crossfadingToIdRef.current = null;
              audioEffects.setDeckGain(standby, 1, 0);
            });
        }
      } else if (
        crossfadeSec === 0 &&
        soundSettings.gaplessPlayback &&
        totalDur > 5 &&
        remaining <= 3.5 &&
        remaining > 0.2
      ) {
        const nextSong = peekNextRef.current?.() ?? null;
        const standby = getStandbyAudio();
        if (nextSong && standby && preloadedRef.current?.songId !== nextSong.id) {
          preloadedRef.current = { songId: nextSong.id, url: nextSong.fileUrl };
          standby.src = nextSong.fileUrl;
          standby.preload = 'auto';
          standby.load();
        }
      }
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlay = useCallback(() => {
    const audio = getActiveAudio();
    if (!audio || !currentSong) return;
    audioEffects.resumeContext();
    if (pauseFadeTimerRef.current) {
      window.clearTimeout(pauseFadeTimerRef.current);
      pauseFadeTimerRef.current = null;
    }

    if (audio.paused) {
      if (soundSettings.fadeOnPlayPause) {
        audioEffects.setDeckGain(audio, 0.02, 0);
      } else {
        audioEffects.setDeckGain(audio, 1, 0);
      }
      audio
        .play()
        .then(() => {
          if (soundSettings.fadeOnPlayPause) {
            audioEffects.setDeckGain(audio, 1, 0.2);
          }
          handlePlayState(true);
        })
        .catch(console.error);
    } else if (soundSettings.fadeOnPlayPause) {
      audioEffects.setDeckGain(audio, 0, 0.17);
      handlePlayState(false);
      pauseFadeTimerRef.current = window.setTimeout(() => {
        audio.pause();
        audioEffects.setDeckGain(audio, 1, 0);
        pauseFadeTimerRef.current = null;
      }, 175);
    } else {
      audio.pause();
      audioEffects.setDeckGain(audio, 1, 0);
      handlePlayState(false);
    }
  }, [currentSong, getActiveAudio, handlePlayState, soundSettings.fadeOnPlayPause]);

  useEffect(() => {
    const handleExternalToggle = () => {
      togglePlay();
    };
    window.addEventListener('app:toggle-play', handleExternalToggle);
    return () => window.removeEventListener('app:toggle-play', handleExternalToggle);
  }, [togglePlay]);

  useEffect(() => {
    const handleExternalOpenFullScreen = () => {
      if (currentSong) setIsNowPlayingOpen(true);
    };
    window.addEventListener('app:open-fullscreen', handleExternalOpenFullScreen);
    return () =>
      window.removeEventListener('app:open-fullscreen', handleExternalOpenFullScreen);
  }, [currentSong]);

  useEffect(() => {
    if (!sleepTimer || sleepTimer.mode !== 'until') return;
    const remainingMs = Math.max(0, sleepTimer.endsAt - Date.now());
    const timer = window.setTimeout(() => {
      getActiveAudio()?.pause();
      getStandbyAudio()?.pause();
      handlePlayState(false);
      onClearSleepTimer?.();
    }, remainingMs);
    return () => window.clearTimeout(timer);
  }, [sleepTimer, getActiveAudio, getStandbyAudio, handlePlayState, onClearSleepTimer]);

  const toggleRepeat = useCallback(() => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  }, [repeatMode, setRepeatMode]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Math.min(maxVolFactor, Number(e.target.value));
    setVolume(vol);
    applyDeckPlaybackParams(audioRefA.current, vol, soundSettings.playbackSpeed, soundSettings.preservePitch);
    applyDeckPlaybackParams(audioRefB.current, vol, soundSettings.playbackSpeed, soundSettings.preservePitch);
  };

  const handleSeek = useCallback(
    (newTime: number) => {
      const audio = getActiveAudio();
      if (!audio || !Number.isFinite(newTime)) return;
      const maxDur = audio.duration || duration || 0;
      const clamped = Math.max(0, maxDur ? Math.min(maxDur, newTime) : newTime);
      audio.currentTime = clamped;
      setCurrentTime(clamped);
      syncMediaSessionPosition(maxDur, clamped, audio.playbackRate || 1);
    },
    [duration, getActiveAudio]
  );

  const handleSeekRef = useRef(handleSeek);
  useEffect(() => {
    handleSeekRef.current = handleSeek;
  }, [handleSeek]);

  const handleDirectVolumeChange = useCallback(
    (newVol: number) => {
      const clamped = Math.max(0, Math.min(maxVolFactor, Math.round(newVol * 100) / 100));
      setVolume(clamped);
      applyDeckPlaybackParams(
        audioRefA.current,
        clamped,
        soundSettings.playbackSpeed,
        soundSettings.preservePitch
      );
      applyDeckPlaybackParams(
        audioRefB.current,
        clamped,
        soundSettings.playbackSpeed,
        soundSettings.preservePitch
      );
    },
    [maxVolFactor, setVolume, soundSettings.playbackSpeed, soundSettings.preservePitch]
  );

  const handleToggleMute = useCallback(() => {
    if (volume > 0) {
      lastNonZeroVolumeRef.current = volume;
      handleDirectVolumeChange(0);
    } else {
      handleDirectVolumeChange(lastNonZeroVolumeRef.current > 0 ? lastNonZeroVolumeRef.current : 1);
    }
  }, [volume, handleDirectVolumeChange]);

  // کلیدهای میانبر دسکتاپ ویندوز
  useKeyboardShortcuts({
    onTogglePlay: togglePlay,
    onNext: () => playNextRef.current(),
    onPrev: () => playPrevRef.current(),
    onSeekBy: (delta) => {
      const audio = getActiveAudio();
      if (!audio || !currentSong) return;
      handleSeekRef.current(audio.currentTime + delta);
    },
    onVolumeBy: (delta) => handleDirectVolumeChange(volume + delta),
    onToggleMute: handleToggleMute,
    onToggleShuffle: () => setIsShuffle(!isShuffle),
    onCycleRepeat: toggleRepeat,
    onToggleFavoriteCurrent: () => {
      if (currentSong) onToggleFavoriteRef.current?.(currentSong.id);
    },
    onToggleQueue: () => setShowQueue((prev) => !prev),
    onToggleFullScreen: () => {
      if (currentSong) setIsNowPlayingOpen((prev) => !prev);
    },
    onOpenSearch: () => window.dispatchEvent(new CustomEvent('app:open-search')),
    onOpenSettings: () => onOpenSettings?.(),
    onSelectTabIndex: (idx) => onSelectTabIndex?.(idx),
  });

  useEffect(() => {
    syncMediaSession(currentSong, isPlaying, {
      onPlay: () => {
        getActiveAudio()?.play().catch(console.error);
      },
      onPause: () => {
        getActiveAudio()?.pause();
      },
      onNext: () => {
        playNextRef.current();
      },
      onPrev: () => {
        playPrevRef.current();
      },
      onSeek: (time) => {
        handleSeekRef.current(time);
      },
    });
  }, [currentSong, isPlaying, getActiveAudio]);

  const handleSongEnd = (deck: 'A' | 'B') => {
    if (deck !== activeDeckRef.current) return;
    if (sleepTimer?.mode === 'songEnd') {
      handlePlayState(false);
      onClearSleepTimer?.();
      return;
    }
    if (repeatMode === 'one') {
      const audio = getActiveAudio();
      if (audio) {
        countedRef.current = false;
        audio.currentTime = 0;
        audio.play().catch(console.error);
      }
      return;
    }

    // پخش بدون وقفه (Gapless) در صورت آماده بودن دک دوم
    if (
      soundSettings.gaplessPlayback &&
      soundSettings.crossfadeSeconds === 0
    ) {
      const nextSong = peekNextRef.current?.() ?? null;
      const standby = getStandbyAudio();
      const outgoing = getActiveAudio();
      if (
        nextSong &&
        standby &&
        preloadedRef.current?.songId === nextSong.id &&
        standby.readyState >= 2
      ) {
        const nextDeck: 'A' | 'B' = activeDeckRef.current === 'A' ? 'B' : 'A';
        audioEffects.attach(standby);
        applyDeckPlaybackParams(
          standby,
          effectiveVolume,
          soundSettings.playbackSpeed,
          soundSettings.preservePitch
        );
        audioEffects.setDeckGain(standby, 1, 0);
        activeDeckRef.current = nextDeck;
        skipNextLoadRef.current = nextSong.id;
        standby
          .play()
          .then(() => {
            if (outgoing) {
              outgoing.pause();
              outgoing.removeAttribute('src');
              outgoing.load();
            }
            playNextRef.current();
          })
          .catch(() => {
            activeDeckRef.current = nextDeck === 'A' ? 'B' : 'A';
            skipNextLoadRef.current = null;
            if (!playNextRef.current()) handlePlayState(false);
          });
        return;
      }
    }

    if (!playNext()) handlePlayState(false);
  };

  // بازیابی خودکار از IndexedDB در صورت منقضی‌شدن Blob URL
  const handleAudioError = async (deck: 'A' | 'B') => {
    if (deck !== activeDeckRef.current) return;
    const audio = getActiveAudio();
    if (currentSong && audio && retriedRecoveryRef.current !== currentSong.id) {
      retriedRecoveryRef.current = currentSong.id;
      const blob = await getAudioBlob(currentSong.id);
      if (blob) {
        const freshUrl = URL.createObjectURL(blob);
        audio.src = freshUrl;
        audio.play().then(() => handlePlayState(true)).catch(() => handlePlayState(false));
        return;
      }
    }
    handlePlayState(false);
  };

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const volumePercent = effectiveVolume * 100;

  // # درخشش نوار پیشرفت (بر اساس پالت)
  const glowColor = `0 0 14px ${theme.colors.glow || theme.colors.primary}`;

  // # رنگ‌ها و متریال به سبک Apple Music (تم روشن/تاریک)
  const palette = getBarPalette(theme.isDark);
  const songTitleColor = palette.title;
  const artistColor = palette.secondary;
  const iconColor = palette.icon;
  const iconActiveColor = theme.colors.primary;
  const iconInactiveColor = palette.iconDim;

  const btnStyle = {
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  };

  const isDocked = displaySettings.playerBarStyle === 'docked';

  return (
    <div
      style={{
        boxSizing: 'border-box',
        height: isMobile ? '66px' : '90px',
        width: isDocked ? '100%' : isMobile ? '320px' : '90%',
        maxWidth: isDocked ? '100%' : isMobile ? 'calc(100% - 24px)' : '1000px',
        // # سطح شیشه‌ای نوار (پس‌زمینه، لبه، سایه) از تم می‌آید
        background: theme.glass.bar.background,
        backdropFilter: `blur(${theme.display?.glassBlur ?? 26}px) saturate(180%)`,
        WebkitBackdropFilter: `blur(${theme.display?.glassBlur ?? 26}px) saturate(180%)`,
        borderRadius: isDocked ? '0px' : isMobile ? theme.radius.lg || '18px' : theme.radius.xl || '24px',
        margin: isDocked ? '0' : isMobile ? '0 auto 12px auto' : '0 auto 16px auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '10px 24px 8px 24px',
        position: 'relative',
        color: songTitleColor,
        zIndex: 20,
        boxShadow: isDocked ? '0 -8px 28px rgba(0,0,0,0.22)' : theme.glass.bar.boxShadow,
        border: isDocked ? 'none' : theme.glass.bar.border,
        borderTop: isDocked ? theme.glass.bar.border : theme.glass.bar.border,
        gap: isMobile ? '10px' : '0',
      }}
    >
      <style>{BUTTON_CSS}</style>

      {/* # کامپوننت حرفه‌ای صف پخش (دسکتاپ و موبایل) */}
      <QueueDrawer
        isOpen={showQueue}
        onClose={() => setShowQueue(false)}
        queue={queue}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlaySong={(idx: number) => onPlayQueueSong?.(idx)}
        onRemoveFromQueue={removeFromQueue}
        onReorderQueue={reorderQueue}
        onClearQueue={() => onClearQueue?.()}
        onShuffleQueue={() => onShuffleQueue?.()}
        onCreatePlaylist={onCreatePlaylist}
        theme={theme}
        t={t}
        isMobile={isMobile}
      />

      {/* # اطلاعات آهنگ (کلیک برای باز کردن تمام صفحه) */}
      <div
        onClick={() => currentSong && setIsNowPlayingOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '10px' : '12px',
          width: isMobile ? 'auto' : '220px',
          flex: isMobile ? 1 : 'none',
          minWidth: 0,
          cursor: currentSong ? 'pointer' : 'default',
        }}
      >
        {currentSong ? (
          <>
            <CoverImage
              src={currentSong.cover}
              alt=""
              iconSize={isMobile ? 18 : 20}
              iconColor={palette.iconDim}
              fallbackBg={theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
              style={{
                width: isMobile ? '42px' : '48px',
                height: isMobile ? '42px' : '48px',
                minWidth: isMobile ? '42px' : '48px',
                borderRadius: theme.radius.sm,
                objectFit: 'cover',
                border: theme.isDark
                  ? '1px solid rgba(255, 255, 255, 0.16)'
                  : '1px solid rgba(0, 0, 0, 0.12)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}
            />
            <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: '600',
                  fontSize: isMobile ? '13px' : '14px',
                  color: songTitleColor,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentSong.name}
              </div>
              <div
                style={{
                  color: artistColor,
                  fontSize: isMobile ? '11px' : '12px',
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentSong.artist}
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              color: artistColor,
              fontSize: isMobile ? '13px' : '14px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {t.noSongSelected || '---'}
          </div>
        )}
      </div>

      {/* # کنترل‌ها و نوار پیشرفت */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: isMobile ? 'none' : 1,
          maxWidth: isMobile ? 'none' : '600px',
          paddingTop: isMobile ? '0' : '4px',
        }}
      >
        {/* نوار پیشرفت فقط در دسکتاپ نمایش داده می‌شود */}
        {!isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              marginTop: '4px',
              marginBottom: '10px',
            }}
            onMouseEnter={() => setIsHoveringProgress(true)}
            onMouseLeave={() => setIsHoveringProgress(false)}
          >
            <span
              style={{
                fontSize: '10px',
                color: artistColor,
                width: '30px',
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatTime(currentTime)}
            </span>
            <div style={{ flex: 1, position: 'relative', height: '16px', display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: isHoveringProgress ? '6px' : '3px',
                  backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '3px',
                  transition: 'height 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    backgroundColor: theme.colors.primary,
                    borderRadius: '3px',
                    boxShadow: glowColor,
                  }}
                ></div>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  zIndex: 2,
                }}
              />
            </div>
            <span style={{ fontSize: '10px', color: artistColor, width: '30px', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(duration)}
            </span>
          </div>
        )}

        {/* دکمه‌های کنترل */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '16px' : '26px' }}>
          {!isMobile && (
            <button
              className="pb-btn"
              onClick={() => setIsShuffle(!isShuffle)}
              title={isShuffle ? 'Shuffle On (S)' : 'Shuffle Off (S)'}
              style={{
                ...btnStyle,
                width: '34px',
                height: '34px',
                position: 'relative',
                color: isShuffle ? iconActiveColor : iconInactiveColor,
              }}
              onMouseEnter={(e) => {
                if (!isShuffle) e.currentTarget.style.color = palette.iconHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isShuffle ? iconActiveColor : iconInactiveColor;
              }}
            >
              <svg width="19" height="19" viewBox="0 0 16 16" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.6 9.6 0 0 0 7.556 8a9.6 9.6 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.6 10.6 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.6 9.6 0 0 0 6.444 8a9.6 9.6 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5"
                />
                <path d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192" />
              </svg>
              {isShuffle && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '1px',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: iconActiveColor,
                    boxShadow: glowColor,
                  }}
                />
              )}
            </button>
          )}

          <button
            className="pb-btn"
            onClick={(e) => {
              e.stopPropagation();
              playPrev();
            }}
            title={t.previous || 'Previous'}
            style={{
              ...btnStyle,
              width: isMobile ? '32px' : '38px',
              height: isMobile ? '32px' : '38px',
              color: iconColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = palette.iconHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = iconColor;
            }}
          >
            <svg width={isMobile ? '20' : '24'} height={isMobile ? '20' : '24'} viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.404 7.304a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696z" />
              <path d="M.404 7.304a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696z" />
            </svg>
          </button>

          <button
            className="pb-btn"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            title={isPlaying ? t.pause || 'Pause' : t.play || 'Play'}
            style={{
              ...btnStyle,
              width: isMobile ? '34px' : '44px',
              height: isMobile ? '34px' : '44px',
              color: iconColor,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = palette.iconHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = iconColor;
            }}
          >
            {isPlaying ? (
              <svg width={isMobile ? '26' : '34'} height={isMobile ? '26' : '34'} viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5" />
              </svg>
            ) : (
              <svg
                width={isMobile ? '26' : '34'}
                height={isMobile ? '26' : '34'}
                viewBox="0 0 16 16"
                fill="currentColor"
                style={{ transform: 'translateX(1.5px)' }}
              >
                <path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z" />
              </svg>
            )}
          </button>

          <button
            className="pb-btn"
            onClick={(e) => {
              e.stopPropagation();
              playNext();
            }}
            title={t.next || 'Next'}
            style={{
              ...btnStyle,
              width: isMobile ? '32px' : '38px',
              height: isMobile ? '32px' : '38px',
              color: iconColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = palette.iconHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = iconColor;
            }}
          >
            <svg width={isMobile ? '20' : '24'} height={isMobile ? '20' : '24'} viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696z" />
              <path d="M15.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C8.713 12.69 8 12.345 8 11.692V4.308c0-.653.713-.998 1.233-.696z" />
            </svg>
          </button>

          {!isMobile && (
            <button
              className="pb-btn"
              onClick={() => toggleRepeat()}
              title={repeatMode === 'one' ? 'Repeat One (R)' : repeatMode === 'all' ? 'Repeat All (R)' : 'Repeat Off (R)'}
              style={{
                ...btnStyle,
                width: '34px',
                height: '34px',
                position: 'relative',
                color: repeatMode !== 'off' ? iconActiveColor : iconInactiveColor,
              }}
              onMouseEnter={(e) => {
                if (repeatMode === 'off') e.currentTarget.style.color = palette.iconHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = repeatMode !== 'off' ? iconActiveColor : iconInactiveColor;
              }}
            >
              {repeatMode === 'one' ? (
                <svg width="19" height="19" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11 4v1.466a.25.25 0 0 0 .41.192l2.36-1.966a.25.25 0 0 0 0-.384l-2.36-1.966a.25.25 0 0 0-.41.192V3H5a5 5 0 0 0-4.48 7.223.5.5 0 0 0 .896-.446A4 4 0 0 1 5 4zm4.48 1.777a.5.5 0 0 0-.896.446A4 4 0 0 1 11 12H5.001v-1.466a.25.25 0 0 0-.41-.192l-2.36 1.966a.25.25 0 0 0 0 .384l2.36 1.966a.25.25 0 0 0 .41-.192V13h6a5 5 0 0 0 4.48-7.223Z" />
                  <path d="M9 5.5a.5.5 0 0 0-.854-.354l-1.75 1.75a.5.5 0 1 0 .708.708L8 6.707V10.5a.5.5 0 0 0 1 0z" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m3.81.086a.5.5 0 0 1 .67.225A5 5 0 0 1 11 13H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.966a.25.25 0 0 1 .41.192V12h6a4 4 0 0 0 3.585-5.777.5.5 0 0 1 .225-.67Z" />
                </svg>
              )}
              {repeatMode !== 'off' && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '1px',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: iconActiveColor,
                    boxShadow: glowColor,
                  }}
                />
              )}
            </button>
          )}

          {isMobile && (
            <button
              className="pb-btn"
              data-queue-toggle="true"
              onClick={(e) => {
                e.stopPropagation();
                setShowQueue(!showQueue);
              }}
              title={t.queue}
              style={{
                ...btnStyle,
                width: '32px',
                height: '32px',
                color: showQueue ? iconActiveColor : iconColor,
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* # کنترل صدا و صف فقط در دسکتاپ (با پشتیبانی از اسکرول ماوس و کلیک بی‌صدا) */}
      {!isMobile && (
        <div style={{ minWidth: '220px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '22px' }}>
          <div
            style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '36px' }}
            onMouseEnter={() => setIsHoveringVolume(true)}
            onMouseLeave={() => setIsHoveringVolume(false)}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY < 0 ? 0.05 : -0.05;
              handleDirectVolumeChange(volume + delta);
            }}
          >
            <button
              className="pb-btn"
              onClick={handleToggleMute}
              title={volume === 0 ? 'Unmute (M)' : 'Mute (M)'}
              style={{
                ...btnStyle,
                width: '36px',
                height: '36px',
                color: isHoveringVolume ? palette.iconHover : iconInactiveColor,
              }}
            >
              {volume === 0 ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                height: isHoveringVolume ? '128px' : '0px',
                width: '40px',
                opacity: isHoveringVolume ? 1 : 0,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                backgroundColor: theme.isDark ? 'rgba(30, 24, 48, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(16px)',
                borderRadius: theme.radius.lg,
                border: `1px solid ${theme.colors.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: isHoveringVolume ? '10px 0' : '0',
                marginBottom: '10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              }}
            >
              {/* # درصد صدا */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: theme.colors.textPrimary,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {Math.round(volumePercent)}
              </span>
              <div style={{ position: 'relative', width: '20px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)',
                    borderRadius: '2px',
                    left: '8px',
                  }}
                ></div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    height: `${volumePercent}%`,
                    width: '4px',
                    backgroundColor: theme.colors.primary,
                    borderRadius: '2px',
                    left: '8px',
                  }}
                ></div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={effectiveVolume}
                  onChange={handleVolumeChange}
                  style={{
                    position: 'absolute',
                    width: '80px',
                    height: '20px',
                    transform: 'rotate(-90deg)',
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 2,
                    left: '-30px',
                    top: '30px',
                  }}
                />
              </div>
            </div>
          </div>
          <button
            className="pb-btn"
            data-queue-toggle="true"
            onClick={() => setShowQueue(!showQueue)}
            style={{
              ...btnStyle,
              padding: '6px 12px',
              borderRadius: '12px',
              color: showQueue ? iconActiveColor : iconInactiveColor,
              backgroundColor: showQueue
                ? theme.isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(0,0,0,0.07)'
                : 'transparent',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              if (!showQueue) e.currentTarget.style.color = palette.iconHover;
            }}
            onMouseLeave={(e) => {
              if (!showQueue) e.currentTarget.style.color = iconInactiveColor;
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
            </svg>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>{t.queue}</span>
          </button>
        </div>
      )}
      <audio
        ref={audioRefA}
        onTimeUpdate={() => handleTimeUpdate('A')}
        onEnded={() => handleSongEnd('A')}
        onPlay={() => {
          if (activeDeckRef.current !== 'A') return;
          audioEffects.resumeContext();
          handlePlayState(true);
        }}
        onPlaying={() => {
          if (activeDeckRef.current === 'A') handlePlayState(true);
        }}
        onPause={() => {
          if (activeDeckRef.current === 'A' && !pauseFadeTimerRef.current) {
            handlePlayState(false);
          }
        }}
        onError={() => handleAudioError('A')}
      />
      <audio
        ref={audioRefB}
        onTimeUpdate={() => handleTimeUpdate('B')}
        onEnded={() => handleSongEnd('B')}
        onPlay={() => {
          if (activeDeckRef.current !== 'B') return;
          audioEffects.resumeContext();
          handlePlayState(true);
        }}
        onPlaying={() => {
          if (activeDeckRef.current === 'B') handlePlayState(true);
        }}
        onPause={() => {
          if (activeDeckRef.current === 'B' && !pauseFadeTimerRef.current) {
            handlePlayState(false);
          }
        }}
        onError={() => handleAudioError('B')}
      />

      <FullScreenPlayer
        isOpen={isNowPlayingOpen}
        onClose={() => setIsNowPlayingOpen(false)}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        playNext={playNext}
        playPrev={playPrev}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        volume={effectiveVolume}
        onVolumeChange={handleDirectVolumeChange}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        repeatMode={repeatMode}
        onToggleRepeat={toggleRepeat}
        queue={queue}
        removeFromQueue={removeFromQueue}
        reorderQueue={reorderQueue}
        onPlayQueueSong={onPlayQueueSong}
        onClearQueue={onClearQueue}
        onShuffleQueue={onShuffleQueue}
        onToggleFavorite={onToggleFavorite}
        liveVisualizer={soundSettings.liveVisualizer}
        artworkStyle={displaySettings.artworkStyle}
        visualizerStyle={displaySettings.visualizerStyle}
        t={t}
        theme={theme}
      />
    </div>
  );
};