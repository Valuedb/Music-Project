import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEMO_SONGS } from './player/demoSongs';
import { PlayerBar } from './components/PlayerBar';
import { TopBar } from './components/TopBar';
import { Home } from './features/Home';
import { AllSongs } from './features/AllSongs';
import { Playlists } from './features/Playlists';
import { Settings } from './features/Settings';
import { usePersistentState } from './hooks/usePersistentState';
import { usePlayer } from './hooks/usePlayer';
import { STORAGE_KEYS } from './storage/keys';
import { isEqualizerSettings, isPlaylistList, isSongList } from './types/guards';
import type { EqualizerSettings, Playlist, Song } from './types';
import { DEFAULT_EQ_SETTINGS, audioEffects } from './player/audioEffects';
import { translations, type Language } from './locales';
import { getTheme, type PaletteType, type ThemeMode } from './theme';

const tabs = ['home', 'allSongs', 'playlists'] as const;

function App() {
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const currentTab = tabs[currentTabIndex];
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [direction, setDirection] = useState(0);

  const [language, setLanguage] = useState<Language>('fa');
  const [searchTerm, setSearchTerm] = useState("");
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [colorPalette, setColorPalette] = useState<PaletteType>('default');

  const [songs, setSongs] = usePersistentState<Song[]>(STORAGE_KEYS.library, DEMO_SONGS, isSongList);
  const [playlists, setPlaylists] = usePersistentState<Playlist[]>(STORAGE_KEYS.playlists, [], isPlaylistList);
  const [equalizerSettings, setEqualizerSettings] = usePersistentState<EqualizerSettings>(
    STORAGE_KEYS.equalizer,
    DEFAULT_EQ_SETTINGS,
    isEqualizerSettings
  );
  const player = usePlayer(songs);

  // اعمال تغییرات اکولایزر بر روی خروجی صوتی
  useEffect(() => {
    audioEffects.applySettings(equalizerSettings);
  }, [equalizerSettings]);

  // در صورت خالی بودن دیتابیس لوکال، ۴ آهنگ دمو به صورت خودکار بارگذاری شوند
  useEffect(() => {
    if (songs.length === 0) {
      setSongs(DEMO_SONGS);
    }
  }, [songs.length, setSongs]);

  const t = translations[language];
  const theme = getTheme(themeMode, colorPalette);

  /** وقتی یک پخش «واقعی» حساب شد (نه فقط کلیک یا رد شدن)، شمارنده‌ی پخش زیاد می‌شه و تاریخ پخش ثبت می‌شه */
  const handleSongPlayed = (id: string) => {
    setSongs((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, playCount: s.playCount + 1, lastPlayedAt: Date.now() }
          : s
      )
    );
  };

  /** تغییر وضعیت آهنگ محبوب (Favorite) */
  const toggleFavoriteSong = (id: string) => {
    setSongs((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
      )
    );
    setPlaylists((prev) =>
      prev.map((p) => ({
        ...p,
        songs: p.songs.map((s) =>
          s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
        ),
      }))
    );
  };

  /** پخش یک آهنگ از لیست و به‌روزرسانی تاریخچه پخش (Recently Played) */
  const handlePlaySongFromList = (song: Song, list: Song[]) => {
    setSongs((prev) =>
      prev.map((s) =>
        s.id === song.id ? { ...s, lastPlayedAt: Date.now() } : s
      )
    );
    player.playSongFromList(song, list);
  };

  const handleCreatePlaylist = (name: string, selectedSongs: Song[]) => {
    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name: name,
      songs: selectedSongs
    };
    setPlaylists((prev) => [...prev, newPlaylist]);
  };

  const deletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  };

  const renamePlaylist = (id: string, newName: string) => {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName } : p))
    );
  };

  const updatePlaylistSongs = (id: string, newSongs: Song[]) => {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === id ? { ...p, songs: newSongs } : p))
    );
  };

  const updateSong = (updatedSong: Song) => {
    setSongs((prev) => prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)));
    setPlaylists((prev) =>
      prev.map((p) => ({
        ...p,
        songs: p.songs.map((s) => (s.id === updatedSong.id ? updatedSong : s)),
      }))
    );
    player.syncSong(updatedSong);
  };

  const addSongToPlaylist = (playlistId: string, song: Song) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId && !p.songs.some((s) => s.id === song.id)) {
          return { ...p, songs: [...p.songs, song] };
        }
        return p;
      })
    );
  };

  const deleteSong = (id: string) => {
    setSongs((prev) => prev.filter((s) => s.id !== id));
    setPlaylists((prev) =>
      prev.map((p) => ({ ...p, songs: p.songs.filter((s) => s.id !== id) }))
    );
    player.removeSong(id);
  };

  const setTab = (tab: string) => {
    if (tab === 'settings') {
      setIsSettingsOpen(true);
      return;
    }
    const index = tabs.findIndex((name) => name === tab);
    if (index === -1) return;
    if (index !== currentTabIndex) {
      setDirection(index > currentTabIndex ? 1 : -1);
      setCurrentTabIndex(index);
    }
    setIsSettingsOpen(false);
  };

  // انیمیشن جابه‌جایی صفحات به سبک One UI / Samsung Music بدون جمع شدن صفحه
  const variants = {
    enter: (dir: number) => {
      if (dir === 0) return { x: 0 };
      const isRtl = language === 'fa';
      // در زبان فارسی (RTL)، حرکت به تب بعد (dir > 0) یعنی صفحه جدید از چپ وارد شود
      // در زبان انگلیسی (LTR)، حرکت به تب بعد (dir > 0) یعنی صفحه جدید از راست وارد شود
      const offset = dir > 0 ? (isRtl ? -100 : 100) : (isRtl ? 100 : -100);
      return {
        x: `${offset}%`,
      };
    },
    center: { zIndex: 1, x: 0 },
    exit: (dir: number) => {
      if (dir === 0) return { x: 0 };
      const isRtl = language === 'fa';
      const offset = dir > 0 ? (isRtl ? 100 : -100) : (isRtl ? -100 : 100);
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
          theme={theme}
        />
      );
    }

    switch (currentTab) {
      case 'home':
        return (
          <Home
            songs={songs}
            playlists={playlists}
            currentSong={player.currentSong}
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
          />
        );
      case 'allSongs':
        return (
          <AllSongs
            songs={songs}
            playlists={playlists}
            currentSong={player.currentSong}
            onPlaySongFromList={handlePlaySongFromList}
            onCreatePlaylist={handleCreatePlaylist}
            addToQueue={player.addToQueue}
            onDeleteSong={deleteSong}
            onUpdateSong={updateSong}
            onAddSongToPlaylist={addSongToPlaylist}
            onToggleFavorite={toggleFavoriteSong}
            t={t}
            searchTerm={searchTerm}
            theme={theme}
          />
        );
      case 'playlists':
        return (
          <Playlists
            playlists={playlists}
            allSongs={songs}
            onPlaySongFromList={player.playSongFromList}
            addToQueue={player.addToQueue}
            t={t}
            onCreatePlaylist={handleCreatePlaylist}
            onDeletePlaylist={deletePlaylist}
            onRenamePlaylist={renamePlaylist}
            onUpdatePlaylistSongs={updatePlaylistSongs}
            theme={theme}
            language={language}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: theme.colors.background,
        color: theme.colors.textPrimary,
        fontFamily: theme.fonts.main,
        overflow: 'hidden',
        direction: language === 'fa' ? 'rtl' : 'ltr',
      }}
    >
      <TopBar
        currentTab={isSettingsOpen ? 'settings' : currentTab}
        setCurrentTab={setTab}
        t={t}
        onSearch={setSearchTerm}
        theme={theme}
      />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
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
              backgroundColor: theme.colors.background,
            }}
          >
            {renderContent()}
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
        />
      </div>
    </div>
  );
}

export default App;