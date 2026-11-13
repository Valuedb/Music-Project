import { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { Upload } from 'lucide-react';
import { DEMO_SONGS } from './player/demoSongs';
import { PlayerBar } from './components/PlayerBar';
import { TopBar } from './components/TopBar';
import type { SearchNavigateTarget } from './components/SearchBar';
import { Home } from './features/Home';
import { usePersistentState } from './hooks/usePersistentState';
import { usePlayer } from './hooks/usePlayer';
import { STORAGE_KEYS } from './storage/keys';
import { readJSON } from './storage/safeStorage';
import { isDisplaySettings, isEqualizerSettings, isPlaylistList, isSongList, isSoundSettings } from './types/guards';
import type { DisplaySettings, EqualizerSettings, Playlist, SleepTimerState, Song, SoundSettings } from './types';
import { DEFAULT_EQ_SETTINGS, DEFAULT_SOUND_SETTINGS, audioEffects } from './player/audioEffects';
import { translations, type Language } from './locales';
import { DEFAULT_DISPLAY_SETTINGS, getTheme, type PaletteType, type ThemeMode } from './theme';
import { getAudioBlobsBatch, deleteAudioBlob } from './storage/mediaStore';
import { extractDroppedAudioFiles, extractSongsBatched } from './utils/audioMetadata';
import { extractDominantHex } from './utils/artworkColor';

// بارگذاری تنبل صفحات غیر اول برای سرعت بالای راه‌اندازی روی ویندوز
const AllSongs = lazy(() => import('./features/AllSongs').then((m) => ({ default: m.AllSongs })));
const Playlists = lazy(() => import('./features/Playlists').then((m) => ({ default: m.Playlists })));
const Artists = lazy(() => import('./features/Artists').then((m) => ({ default: m.Artists })));
const Albums = lazy(() => import('./features/Albums').then((m) => ({ default: m.Albums })));
const Folders = lazy(() => import('./features/Folders').then((m) => ({ default: m.Folders })));
const Settings = lazy(() => import('./features/Settings').then((m) => ({ default: m.Settings })));

const tabs = ['home', 'allSongs', 'playlists', 'artists', 'albums', 'folders'] as const;

interface LaunchParamsLike {
  files?: { getFile: () => Promise<File> }[];
}

interface LaunchQueueLike {
  setConsumer: (consumer: (launchParams: LaunchParamsLike) => void) => void;
}

function App() {
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const currentTab = tabs[currentTabIndex];
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [direction, setDirection] = useState(0);

  const [language, setLanguage] = usePersistentState<Language>(
    'appLanguage',
    'fa',
    (v): v is Language => v === 'fa' || v === 'en'
  );
  const [navTarget, setNavTarget] = useState<(SearchNavigateTarget & { token: number }) | null>(
    null
  );
  const [themeMode, setThemeMode] = usePersistentState<ThemeMode>(
    'appThemeMode',
    'system',
    (v): v is ThemeMode => v === 'system' || v === 'light' || v === 'dark'
  );
  const [colorPalette, setColorPalette] = usePersistentState<PaletteType>(
    STORAGE_KEYS.palette,
    'classic-blue',
    (v): v is PaletteType => typeof v === 'string'
  );
  const [customBackground, setCustomBackground] = usePersistentState<string | null>(
    STORAGE_KEYS.customBg,
    null,
    (v): v is string | null => v === null || typeof v === 'string'
  );
  const [customBgBlur, setCustomBgBlur] = usePersistentState<number>(
    STORAGE_KEYS.customBgBlur,
    10,
    (v): v is number => typeof v === 'number'
  );
  const [customBgDim, setCustomBgDim] = usePersistentState<number>(
    STORAGE_KEYS.customBgDim,
    45,
    (v): v is number => typeof v === 'number'
  );
  const [glassCardCovers, setGlassCardCovers] = usePersistentState<boolean>(
    STORAGE_KEYS.glassCardCovers,
    true,
    (v): v is boolean => typeof v === 'boolean'
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<SleepTimerState>({ mode: 'off' });
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const dragCounterRef = useRef(0);

  // تشخیص حالت تیره/روشن سیستم یا ویندوز
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // فعال‌سازی واکنش لمسی فوری (Active state) در مرورگرهای لمسی
  useEffect(() => {
    const handleTouchStart = () => {};
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    return () => window.removeEventListener('touchstart', handleTouchStart);
  }, []);

  const [songs, setSongs] = usePersistentState<Song[]>(STORAGE_KEYS.library, DEMO_SONGS, isSongList);
  const [playlists, setPlaylists] = usePersistentState<Playlist[]>(STORAGE_KEYS.playlists, [], isPlaylistList);
  const [customFolders, setCustomFolders] = usePersistentState<string[]>(
    STORAGE_KEYS.folders,
    [],
    (v): v is string[] => Array.isArray(v) && v.every((item) => typeof item === 'string')
  );
  const [equalizerSettings, setEqualizerSettings] = usePersistentState<EqualizerSettings>(
    STORAGE_KEYS.equalizer,
    DEFAULT_EQ_SETTINGS,
    isEqualizerSettings
  );
  const [soundSettings, setSoundSettings] = usePersistentState<SoundSettings>(
    STORAGE_KEYS.soundSettings,
    DEFAULT_SOUND_SETTINGS,
    isSoundSettings
  );
  const [displaySettings, setDisplaySettings] = usePersistentState<DisplaySettings>(
    STORAGE_KEYS.displaySettings,
    DEFAULT_DISPLAY_SETTINGS,
    isDisplaySettings
  );
  const [adaptivePrimaryHex, setAdaptivePrimaryHex] = useState<string | null>(null);
  const player = usePlayer(songs);

  // اعمال یکپارچه‌ی تمام تنظیمات صدا و موتور DSP بر روی خروجی صوتی
  useEffect(() => {
    audioEffects.applySoundSettings(soundSettings);
  }, [soundSettings]);

  // در صورت خالی بودن دیتابیس لوکال، ۳ آهنگ دمو به صورت خودکار بارگذاری شوند
  useEffect(() => {
    if (songs.length === 0) {
      setSongs(DEMO_SONGS);
    }
  }, [songs.length, setSongs]);

  // بازیابی یکپارچه و سریع لینک‌های فایل‌های صوتی ذخیره‌شده در IndexedDB + بازیابی آخرین آهنگ پخش‌شده
  useEffect(() => {
    let cancelled = false;
    const rehydrateAudioUrls = async () => {
      const localSongIds = songs
        .filter((s) => s.fileUrl.startsWith('blob:'))
        .map((s) => s.id);

      const blobUrlMap = new Map<string, string>();
      if (localSongIds.length > 0) {
        const blobs = await getAudioBlobsBatch(localSongIds);
        if (cancelled) return;
        blobs.forEach((blob, id) => {
          blobUrlMap.set(id, URL.createObjectURL(blob));
        });
      }

      if (cancelled) return;

      let restoredList = songs;
      if (blobUrlMap.size > 0) {
        restoredList = songs.map((s) => {
          const freshUrl = blobUrlMap.get(s.id);
          return freshUrl ? { ...s, fileUrl: freshUrl } : s;
        });

        setSongs((prev) =>
          prev.map((s) => {
            const freshUrl = blobUrlMap.get(s.id);
            return freshUrl ? { ...s, fileUrl: freshUrl } : s;
          })
        );

        setPlaylists((prev) =>
          prev.map((p) => ({
            ...p,
            songs: p.songs.map((s) => {
              const freshUrl = blobUrlMap.get(s.id);
              return freshUrl ? { ...s, fileUrl: freshUrl } : s;
            }),
          }))
        );
      }

      // بازیابی آخرین آهنگ در حال پخش نشست قبلی
      const savedPlayback = readJSON<{ songId?: string; currentTime?: number } | null>(
        STORAGE_KEYS.lastPlayback,
        null
      );
      if (savedPlayback?.songId) {
        const lastSong = restoredList.find((s) => s.id === savedPlayback.songId);
        if (lastSong) {
          player.restoreSong(lastSong);
        }
      }
    };

    rehydrateAudioUrls();
    return () => {
      cancelled = true;
    };
    // فقط یک‌بار هنگام شروع برنامه اجرا شود
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // پشتیبانی بومی ویندوز از باز کردن فایل صوتی با برنامه (Open With / LaunchQueue API)
  useEffect(() => {
    const win = window as unknown as { launchQueue?: LaunchQueueLike };
    if (!win.launchQueue?.setConsumer) return;

    win.launchQueue.setConsumer(async (launchParams) => {
      if (!launchParams?.files || launchParams.files.length === 0) return;
      const files = await Promise.all(launchParams.files.map((handle) => handle.getFile()));
      const imported = await extractSongsBatched(files);
      if (imported.length === 0) return;
      setSongs((prev) => {
        const updated = [...prev, ...imported];
        player.playSongFromList(imported[0], updated);
        return updated;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = translations[language];
  const resolvedMode: 'light' | 'dark' =
    themeMode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : themeMode;

  useEffect(() => {
    let cancelled = false;
    const coverUrl = player.currentSong?.cover;
    if (!displaySettings.adaptiveArtworkAccent || !coverUrl) {
      setAdaptivePrimaryHex(null);
      return;
    }
    extractDominantHex(coverUrl, resolvedMode === 'light').then((hex) => {
      if (!cancelled) setAdaptivePrimaryHex(hex);
    });
    return () => {
      cancelled = true;
    };
  }, [displaySettings.adaptiveArtworkAccent, player.currentSong?.cover, resolvedMode]);

  const theme = getTheme(resolvedMode, colorPalette, {
    display: displaySettings,
    overridePrimaryHex: adaptivePrimaryHex,
  });

  // همگام‌سازی کلاس dark، فونت، مقیاس و کاهش انیمیشن
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.setProperty('--app-font', theme.fonts.main);
    root.style.fontSize = `${Math.round(16 * (displaySettings.fontScale || 1) * 10) / 10}px`;
    root.setAttribute('data-density', displaySettings.listDensity);
    root.setAttribute('data-reduce-motion', displaySettings.reduceMotion ? 'true' : 'false');
  }, [
    resolvedMode,
    theme.fonts.main,
    displaySettings.fontScale,
    displaySettings.listDensity,
    displaySettings.reduceMotion,
  ]);

  /** وقتی یک پخش «واقعی» حساب شد، شمارنده‌ی پخش زیاد می‌شه و تاریخ پخش ثبت می‌شه */
  const handleSongPlayed = useCallback(
    (id: string) => {
      setSongs((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, playCount: s.playCount + 1, lastPlayedAt: Date.now() } : s
        )
      );
    },
    [setSongs]
  );

  /** تغییر وضعیت آهنگ محبوب (Favorite) */
  const toggleFavoriteSong = useCallback(
    (id: string) => {
      if (player.currentSong && player.currentSong.id === id) {
        player.syncSong({
          ...player.currentSong,
          isFavorite: !player.currentSong.isFavorite,
        });
      } else {
        const active = songs.find((s) => s.id === id);
        if (active) {
          player.syncSong({
            ...active,
            isFavorite: !active.isFavorite,
          });
        }
      }

      setSongs((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s))
      );

      setPlaylists((prev) =>
        prev.map((p) => ({
          ...p,
          songs: p.songs.map((s) => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)),
        }))
      );
    },
    [player, setPlaylists, setSongs, songs]
  );

  /** پخش یک آهنگ از لیست و به‌روزرسانی تاریخچه پخش */
  const handlePlaySongFromList = useCallback(
    (song: Song, list: Song[]) => {
      setSongs((prev) =>
        prev.map((s) => (s.id === song.id ? { ...s, lastPlayedAt: Date.now() } : s))
      );
      player.playSongFromList(song, list);
    },
    [player, setSongs]
  );

  const handleShuffleAll = useCallback(() => {
    if (songs.length === 0) return;
    player.setShuffle(true);
    const randomSong = songs[Math.floor(Math.random() * songs.length)];
    handlePlaySongFromList(randomSong, songs);
  }, [songs, player, handlePlaySongFromList]);

  const handleClearSleepTimer = useCallback(() => {
    setSleepTimer({ mode: 'off' });
  }, []);

  const handleCreatePlaylist = useCallback(
    (name: string, selectedSongs: Song[]) => {
      const newPlaylist: Playlist = {
        id: crypto.randomUUID(),
        name: name,
        songs: selectedSongs,
      };
      setPlaylists((prev) => [...prev, newPlaylist]);
    },
    [setPlaylists]
  );

  const deletePlaylist = useCallback(
    (id: string) => {
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
    },
    [setPlaylists]
  );

  const renamePlaylist = useCallback(
    (id: string, newName: string) => {
      setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, name: newName } : p)));
    },
    [setPlaylists]
  );

  const updatePlaylistSongs = useCallback(
    (id: string, newSongs: Song[]) => {
      setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, songs: newSongs } : p)));
    },
    [setPlaylists]
  );

  const updateSong = useCallback(
    (updatedSong: Song) => {
      setSongs((prev) => prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)));
      setPlaylists((prev) =>
        prev.map((p) => ({
          ...p,
          songs: p.songs.map((s) => (s.id === updatedSong.id ? updatedSong : s)),
        }))
      );
      player.syncSong(updatedSong);
    },
    [player, setPlaylists, setSongs]
  );

  const addSongToPlaylist = useCallback(
    (playlistId: string, song: Song) => {
      setPlaylists((prev) =>
        prev.map((p) => {
          if (p.id === playlistId && !p.songs.some((s) => s.id === song.id)) {
            return { ...p, songs: [...p.songs, song] };
          }
          return p;
        })
      );
    },
    [setPlaylists]
  );

  const deleteSong = useCallback(
    (id: string) => {
      setSongs((prev) => {
        const target = prev.find((s) => s.id === id);
        if (target?.fileUrl.startsWith('blob:')) {
          URL.revokeObjectURL(target.fileUrl);
        }
        return prev.filter((s) => s.id !== id);
      });
      setPlaylists((prev) =>
        prev.map((p) => ({ ...p, songs: p.songs.filter((s) => s.id !== id) }))
      );
      player.removeSong(id);
      deleteAudioBlob(id);
    },
    [player, setPlaylists, setSongs]
  );

  const handleCreateFolder = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setCustomFolders((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    },
    [setCustomFolders]
  );

  const handleRenameFolder = useCallback(
    (oldName: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return;
      setCustomFolders((prev) => {
        const filtered = prev.filter((f) => f !== oldName && f !== trimmed);
        return [...filtered, trimmed];
      });
      setSongs((prev) =>
        prev.map((s) => (s.folder?.trim() === oldName ? { ...s, folder: trimmed } : s))
      );
      setPlaylists((prev) =>
        prev.map((p) => ({
          ...p,
          songs: p.songs.map((s) => (s.folder?.trim() === oldName ? { ...s, folder: trimmed } : s)),
        }))
      );
      if (player.currentSong?.folder?.trim() === oldName) {
        player.syncSong({ ...player.currentSong, folder: trimmed });
      }
    },
    [player, setCustomFolders, setPlaylists, setSongs]
  );

  const handleDeleteFolder = useCallback(
    (name: string) => {
      setCustomFolders((prev) => prev.filter((f) => f !== name));
      setSongs((prev) =>
        prev.map((s) => (s.folder?.trim() === name ? { ...s, folder: undefined } : s))
      );
      setPlaylists((prev) =>
        prev.map((p) => ({
          ...p,
          songs: p.songs.map((s) => (s.folder?.trim() === name ? { ...s, folder: undefined } : s)),
        }))
      );
      if (player.currentSong?.folder?.trim() === name) {
        player.syncSong({ ...player.currentSong, folder: undefined });
      }
    },
    [player, setCustomFolders, setPlaylists, setSongs]
  );

  const handleAssignSongsToFolder = useCallback(
    (songIds: string[], folderName: string) => {
      const trimmed = folderName.trim();
      if (!trimmed) return;
      setCustomFolders((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      const idSet = new Set(songIds);
      setSongs((prev) => prev.map((s) => (idSet.has(s.id) ? { ...s, folder: trimmed } : s)));
      if (player.currentSong && idSet.has(player.currentSong.id)) {
        player.syncSong({ ...player.currentSong, folder: trimmed });
      }
    },
    [player, setCustomFolders, setSongs]
  );

  const setTab = useCallback(
    (tab: string) => {
      if (tab === 'settings') {
        setIsSettingsOpen(true);
        return;
      }
      const index = tabs.findIndex((name) => name === tab);
      if (index === -1) return;
      setNavTarget(null);
      if (index !== currentTabIndex) {
        setDirection(index > currentTabIndex ? 1 : -1);
        setCurrentTabIndex(index);
      }
      setIsSettingsOpen(false);
    },
    [currentTabIndex]
  );

  const handleNavigateFromSearch = useCallback(
    (target: SearchNavigateTarget) => {
      const index = tabs.findIndex((name) => name === target.tab);
      if (index === -1) return;
      setNavTarget({ ...target, token: Date.now() });
      if (index !== currentTabIndex) {
        setDirection(index > currentTabIndex ? 1 : -1);
        setCurrentTabIndex(index);
      }
      setIsSettingsOpen(false);
    },
    [currentTabIndex]
  );

  // رها کردن فایل‌ها یا پوشه‌های صوتی از Windows Explorer در هر نقطه از پنجره برنامه
  const hasDraggedFiles = (dt: DataTransfer | null): boolean =>
    Boolean(dt && Array.from(dt.types || []).includes('Files'));

  const handleWindowDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (!hasDraggedFiles(e.dataTransfer)) return;
    e.preventDefault();
    dragCounterRef.current += 1;
    setIsDraggingFiles(true);
  };

  const handleWindowDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!hasDraggedFiles(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleWindowDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!hasDraggedFiles(e.dataTransfer)) return;
    e.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDraggingFiles(false);
    }
  };

  const handleWindowDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (!hasDraggedFiles(e.dataTransfer)) return;
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingFiles(false);

    const extractedItems = await extractDroppedAudioFiles(e.dataTransfer);
    if (extractedItems.length === 0) return;

    const newSongs = await extractSongsBatched(extractedItems);
    if (newSongs.length === 0) return;

    setSongs((prev) => {
      const updated = [...prev, ...newSongs];
      if (!player.currentSong) {
        player.playSongFromList(newSongs[0], updated);
      }
      return updated;
    });
  };

  // انیمیشن جابه‌جایی صفحات به سبک One UI / Samsung Music بدون جمع شدن صفحه
  const variants = {
    enter: (dir: number) => {
      if (dir === 0) return { x: 0 };
      const isRtl = language === 'fa';
      const offset = dir > 0 ? (isRtl ? -100 : 100) : isRtl ? 100 : -100;
      return {
        x: `${offset}%`,
      };
    },
    center: { zIndex: 1, x: 0 },
    exit: (dir: number) => {
      if (dir === 0) return { x: 0 };
      const isRtl = language === 'fa';
      const offset = dir > 0 ? (isRtl ? 100 : -100) : isRtl ? -100 : 100;
      return {
        zIndex: 0,
        x: `${offset}%`,
      };
    },
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentTabIndex((prev) => {
      const next = prev + newDirection;
      if (next < 0 || next >= tabs.length) return prev;
      return next;
    });
  };

  const renderContent = () => {
    if (isSettingsOpen) {
      return (
        <Settings
          songs={songs}
          setSongs={setSongs}
          t={t}
          language={language}
          setLanguage={setLanguage}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          colorPalette={colorPalette}
          setColorPalette={setColorPalette}
          equalizerSettings={equalizerSettings}
          setEqualizerSettings={setEqualizerSettings}
          soundSettings={soundSettings}
          setSoundSettings={setSoundSettings}
          displaySettings={displaySettings}
          setDisplaySettings={setDisplaySettings}
          theme={theme}
          customBackground={customBackground}
          setCustomBackground={setCustomBackground}
          customBgBlur={customBgBlur}
          setCustomBgBlur={setCustomBgBlur}
          customBgDim={customBgDim}
          setCustomBgDim={setCustomBgDim}
          glassCardCovers={glassCardCovers}
          setGlassCardCovers={setGlassCardCovers}
          sleepTimer={sleepTimer}
          onSetSleepTimer={setSleepTimer}
        />
      );
    }

    switch (currentTab) {
      case 'home':
        return (
          <Home
            songs={songs}
            playlists={playlists}
            customFolders={customFolders}
            currentSong={player.currentSong}
            onPlaySongFromList={handlePlaySongFromList}
            onShuffleAll={handleShuffleAll}
            onNavigateToItem={handleNavigateFromSearch}
            onSelectTab={setTab}
            sleepTimer={sleepTimer}
            onSetSleepTimer={setSleepTimer}
            t={t}
            theme={theme}
            language={language}
            isPlaying={isPlaying}
            glassCardCovers={glassCardCovers}
          />
        );
      case 'allSongs':
        return (
          <AllSongs
            songs={songs}
            playlists={playlists}
            currentSong={player.currentSong}
            isPlaying={isPlaying}
            onPlaySongFromList={handlePlaySongFromList}
            onCreatePlaylist={handleCreatePlaylist}
            addToQueue={player.addToQueue}
            onDeleteSong={deleteSong}
            onUpdateSong={updateSong}
            onAddSongToPlaylist={addSongToPlaylist}
            onToggleFavorite={toggleFavoriteSong}
            t={t}
            theme={theme}
            glassCardCovers={glassCardCovers}
          />
        );
      case 'playlists':
        return (
          <Playlists
            playlists={playlists}
            allSongs={songs}
            currentSong={player.currentSong}
            isPlaying={isPlaying}
            onPlaySongFromList={handlePlaySongFromList}
            addToQueue={player.addToQueue}
            onDeleteSong={deleteSong}
            onUpdateSong={updateSong}
            onAddSongToPlaylist={addSongToPlaylist}
            onToggleFavorite={toggleFavoriteSong}
            t={t}
            onCreatePlaylist={handleCreatePlaylist}
            onDeletePlaylist={deletePlaylist}
            onRenamePlaylist={renamePlaylist}
            onUpdatePlaylistSongs={updatePlaylistSongs}
            theme={theme}
            language={language}
            glassCardCovers={glassCardCovers}
            initialPlaylist={
              navTarget?.tab === 'playlists' ? { id: navTarget.key, token: navTarget.token } : null
            }
          />
        );
      case 'artists':
        return (
          <Artists
            songs={songs}
            playlists={playlists}
            currentSong={player.currentSong}
            isPlaying={isPlaying}
            onPlaySongFromList={handlePlaySongFromList}
            onCreatePlaylist={handleCreatePlaylist}
            addToQueue={player.addToQueue}
            onDeleteSong={deleteSong}
            onUpdateSong={updateSong}
            onAddSongToPlaylist={addSongToPlaylist}
            onToggleFavorite={toggleFavoriteSong}
            t={t}
            theme={theme}
            language={language}
            glassCardCovers={glassCardCovers}
            initialArtist={
              navTarget?.tab === 'artists' ? { name: navTarget.key, token: navTarget.token } : null
            }
          />
        );
      case 'albums':
        return (
          <Albums
            songs={songs}
            playlists={playlists}
            currentSong={player.currentSong}
            isPlaying={isPlaying}
            onPlaySongFromList={handlePlaySongFromList}
            onCreatePlaylist={handleCreatePlaylist}
            addToQueue={player.addToQueue}
            onDeleteSong={deleteSong}
            onUpdateSong={updateSong}
            onAddSongToPlaylist={addSongToPlaylist}
            onToggleFavorite={toggleFavoriteSong}
            t={t}
            theme={theme}
            language={language}
            glassCardCovers={glassCardCovers}
            initialAlbum={
              navTarget?.tab === 'albums' ? { key: navTarget.key, token: navTarget.token } : null
            }
          />
        );
      case 'folders':
        return (
          <Folders
            songs={songs}
            setSongs={setSongs}
            playlists={playlists}
            customFolders={customFolders}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onAssignSongsToFolder={handleAssignSongsToFolder}
            currentSong={player.currentSong}
            isPlaying={isPlaying}
            onPlaySongFromList={handlePlaySongFromList}
            onCreatePlaylist={handleCreatePlaylist}
            addToQueue={player.addToQueue}
            onDeleteSong={deleteSong}
            onUpdateSong={updateSong}
            onAddSongToPlaylist={addSongToPlaylist}
            onToggleFavorite={toggleFavoriteSong}
            t={t}
            theme={theme}
            language={language}
            glassCardCovers={glassCardCovers}
            initialFolder={
              navTarget?.tab === 'folders' ? { id: navTarget.key, token: navTarget.token } : null
            }
          />
        );
      default:
        return null;
    }
  };

  const activeBackdrop =
    displaySettings.adaptiveArtworkWallpaper && player.currentSong?.cover
      ? player.currentSong.cover
      : customBackground;

  return (
    <MotionConfig reducedMotion={displaySettings.reduceMotion ? 'always' : 'user'}>
    <div
      onDragEnter={handleWindowDragEnter}
      onDragOver={handleWindowDragOver}
      onDragLeave={handleWindowDragLeave}
      onDrop={handleWindowDrop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: theme.colors.background,
        color: theme.colors.textPrimary,
        fontFamily: theme.fonts.main,
        overflow: 'hidden',
        direction: language === 'fa' ? 'rtl' : 'ltr',
        position: 'relative',
      }}
    >
      {/* پس‌زمینه انتخابی کاربر یا کاور پویا (Custom / Adaptive Wallpaper) */}
      {activeBackdrop && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '-24px',
              backgroundImage: `url(${activeBackdrop})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: `blur(${
                displaySettings.adaptiveArtworkWallpaper && player.currentSong?.cover
                  ? Math.max(24, customBgBlur)
                  : customBgBlur
              }px)`,
              transform: 'scale(1.06)',
              transition: displaySettings.reduceMotion ? 'none' : 'filter 0.3s ease, background-image 0.45s ease',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: theme.isDark
                ? `rgba(0, 0, 0, ${customBgDim / 100})`
                : `rgba(255, 255, 255, ${customBgDim / 100})`,
              backdropFilter: 'saturate(130%)',
              transition: displaySettings.reduceMotion ? 'none' : 'background-color 0.3s ease',
            }}
          />
        </div>
      )}

      {/* هاله نور پس‌زمینه زنده و سیال به سبک اپل موزیک */}
      {displaySettings.ambientGlow && (
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
          opacity: activeBackdrop ? 0.45 : 1,
          transition: 'opacity 0.4s ease',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '12%',
            width: '45vw',
            height: '45vw',
            minWidth: '320px',
            minHeight: '320px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.colors.primary}38 0%, ${theme.colors.glow || theme.colors.primary}18 50%, transparent 70%)`,
            filter: 'blur(75px)',
            opacity: theme.isDark ? 0.75 : 0.45,
            transform: 'translate3d(0,0,0)',
            transition: 'background 0.4s ease',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '12%',
            right: '-8%',
            width: '50vw',
            height: '50vw',
            minWidth: '360px',
            minHeight: '360px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.colors.accent || theme.colors.primary}30 0%, ${theme.colors.secondary || theme.colors.primary}16 50%, transparent 70%)`,
            filter: 'blur(90px)',
            opacity: theme.isDark ? 0.65 : 0.38,
            transform: 'translate3d(0,0,0)',
            transition: 'background 0.4s ease',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '45%',
            left: '30%',
            width: '38vw',
            height: '38vw',
            minWidth: '260px',
            minHeight: '260px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.colors.secondary || theme.colors.primary}24 0%, transparent 70%)`,
            filter: 'blur(80px)',
            opacity: theme.isDark ? 0.55 : 0.32,
            transform: 'translate3d(0,0,0)',
            transition: 'background 0.4s ease',
          }}
        />
      </div>
      )}

      <TopBar
        currentTab={isSettingsOpen ? 'settings' : currentTab}
        setCurrentTab={setTab}
        t={t}
        theme={theme}
        songs={songs}
        playlists={playlists}
        customFolders={customFolders}
        onPlaySong={handlePlaySongFromList}
        onSearchNavigate={handleNavigateFromSearch}
      />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={isSettingsOpen ? 'settings' : currentTab}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 350, damping: 35, mass: 0.75 },
            }}
            drag={isSettingsOpen ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, { offset, velocity }) => {
              if (isSettingsOpen) return;
              const swipe = offset.x;
              const vel = velocity.x;
              if (language === 'fa') {
                if (swipe > 60 || vel > 350) paginate(1);
                else if (swipe < -60 || vel < -350) paginate(-1);
              } else {
                if (swipe < -60 || vel < -350) paginate(1);
                else if (swipe > 60 || vel > 350) paginate(-1);
              }
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'auto',
              backgroundColor: 'transparent',
            }}
          >
            <Suspense fallback={null}>{renderContent()}</Suspense>
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        dir="ltr"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          direction: 'ltr',
        }}
      >
        <PlayerBar
          currentSong={player.currentSong}
          queue={player.queue}
          removeFromQueue={player.removeFromQueueAt}
          playNext={player.playNext}
          playPrev={player.playPrev}
          reorderQueue={player.reorderQueue}
          repeatMode={player.repeatMode}
          setRepeatMode={player.setRepeatMode}
          isShuffle={player.isShuffle}
          setIsShuffle={player.setShuffle}
          playToken={player.playToken}
          onSongPlayed={handleSongPlayed}
          onToggleFavorite={toggleFavoriteSong}
          t={t}
          theme={theme}
          onPlayStateChange={setIsPlaying}
          onPlayQueueSong={player.playQueueSongAt}
          onClearQueue={player.clearQueue}
          onShuffleQueue={player.shuffleQueue}
          onCreatePlaylist={handleCreatePlaylist}
          onSelectTabIndex={(idx) => {
            if (tabs[idx]) setTab(tabs[idx]);
          }}
          onOpenSettings={() => setTab('settings')}
          sleepTimer={sleepTimer}
          onClearSleepTimer={handleClearSleepTimer}
          peekNext={player.peekNext}
          soundSettings={soundSettings}
          displaySettings={displaySettings}
        />
      </div>

      {/* راهنمای رها کردن فایل/پوشه فقط هنگام کشیدن فایل روی پنجره ویندوز */}
      {isDraggingFiles && (
        <div
          style={{
            position: 'fixed',
            inset: 16,
            zIndex: 999999,
            borderRadius: '24px',
            border: `2px dashed ${theme.colors.primary}`,
            backgroundColor: theme.isDark ? 'rgba(12, 10, 24, 0.78)' : 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            pointerEvents: 'none',
          }}
        >
          <Upload size={44} color={theme.colors.primary} />
          <div style={{ fontSize: '20px', fontWeight: 700, color: theme.colors.textPrimary }}>
            {t.dropAudioTitle || 'فایل یا پوشه موسیقی را اینجا رها کنید'}
          </div>
          <div style={{ fontSize: '14px', color: theme.colors.textSecondary }}>
            {t.dropAudioHint || 'برای افزودن فوری به کتابخانه رها کنید'}
          </div>
        </div>
      )}
    </div>
    </MotionConfig>
  );
}

export default App;