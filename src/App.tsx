import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerBar } from './components/PlayerBar';
import { TopBar } from './components/TopBar';
import { Home } from './features/Home';
import { AllSongs } from './features/AllSongs';
import { Playlists } from './features/Playlists';
import { Settings } from './features/Settings';
import { translations, type Language } from './locales';
import { getTheme, type PaletteType, type ThemeMode } from './theme';

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

const tabs = ['home', 'allSongs', 'playlists'] as const;

function App() {
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const currentTab = tabs[currentTabIndex];
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [language, setLanguage] = useState<Language>('fa');
  const [searchTerm, setSearchTerm] = useState("");
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [colorPalette, setColorPalette] = useState<PaletteType>('default');

  const [songs, setSongs] = useState<Song[]>(() => {
    const saved = localStorage.getItem('musicLibrary');
    return saved ? JSON.parse(saved) : [];
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('playlists');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState(false);
  const [playTrigger, setPlayTrigger] = useState(0);
  const [direction, setDirection] = useState(0);

  const t = translations[language];
  const theme = getTheme(themeMode, colorPalette);

  useEffect(() => {
    localStorage.setItem('musicLibrary', JSON.stringify(songs));
  }, [songs]);

  useEffect(() => {
    localStorage.setItem('playlists', JSON.stringify(playlists));
  }, [playlists]);

  const playSongFromList = (song: Song, list: Song[]) => {
    setCurrentSong(song);
    setQueue(list);
    setSongs((prevSongs) =>
      prevSongs.map((s) =>
        s.id === song.id ? { ...s, playCount: s.playCount + 1 } : s
      )
    );
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
    setQueue((prev) => prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)));
    if (currentSong?.id === updatedSong.id) {
      setCurrentSong(updatedSong);
    }
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

  const addToQueue = (song: Song) => {
    setQueue((prev) => [...prev, song]);
  };

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((s) => s.id !== id));
  };

  const playNext = () => {
    const baseList = queue.length > 0 ? queue : songs;
    if (baseList.length === 0) return;

    let nextSong;
    if (isShuffle) {
      const availableSongs =
        baseList.length > 1
          ? baseList.filter((s) => s.id !== currentSong?.id)
          : baseList;
      nextSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
    } else {
      const currentIndex = baseList.findIndex((s) => s.id === currentSong?.id);
      if (currentIndex === baseList.length - 1) {
        nextSong = repeatMode === 'all' ? baseList[0] : baseList[currentIndex];
      } else {
        nextSong = baseList[currentIndex + 1];
      }
    }

    setCurrentSong(nextSong);
    setSongs((prevSongs) =>
      prevSongs.map((s) =>
        s.id === nextSong.id ? { ...s, playCount: s.playCount + 1 } : s
      )
    );
  };

  const playPrev = () => {
    const baseList = queue.length > 0 ? queue : songs;
    if (baseList.length === 0) return;

    let prevSong;
    if (isShuffle) {
      const availableSongs =
        baseList.length > 1
          ? baseList.filter((s) => s.id !== currentSong?.id)
          : baseList;
      prevSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
    } else {
      const currentIndex = baseList.findIndex((s) => s.id === currentSong?.id);
      if (currentIndex === 0) {
        prevSong = repeatMode === 'all' ? baseList[baseList.length - 1] : baseList[0];
      } else {
        prevSong = baseList[currentIndex - 1];
      }
    }

    setCurrentSong(prevSong);
    setSongs((prevSongs) =>
      prevSongs.map((s) =>
        s.id === prevSong.id ? { ...s, playCount: s.playCount + 1 } : s
      )
    );
  };

  const reorderQueue = (fromIndex: number, toIndex: number) => {
    setQueue((prev) => {
      const newQueue = [...prev];
      const [movedItem] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedItem);
      return newQueue;
    });
  };

  const deleteSong = (id: string) => {
    setSongs((prev) => prev.filter((s) => s.id !== id));
    setPlaylists((prev) =>
      prev.map((p) => ({ ...p, songs: p.songs.filter((s) => s.id !== id) }))
    );
    setQueue((prev) => prev.filter((s) => s.id !== id));
  };

  const setTab = (tab: string) => {
    const index = tabs.indexOf(tab as any);
    if (index !== -1) {
      setCurrentTabIndex(index);
      setIsSettingsOpen(false);
    }
    if (tab === 'settings') {
      setIsSettingsOpen(true);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 
        ? (language === 'fa' ? '100%' : '-100%') 
        : (language === 'fa' ? '-100%' : '100%'),
      opacity: 0.5,
      scale: 0.9,
    }),
    center: { zIndex: 1, x: 0, opacity: 1, scale: 1 },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 
        ? (language === 'fa' ? '100%' : '-100%') 
        : (language === 'fa' ? '-100%' : '100%'),
      opacity: 0.5,
      scale: 0.9,
    }),
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentTabIndex((prev) => {
      let next = prev + newDirection;
      if (next < 0) next = tabs.length - 1;
      if (next >= tabs.length) next = 0;
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
          theme={theme}
        />
      );
    }

    switch (currentTab) {
      case 'home':
        return (
          <Home
            songs={songs}
            onPlaySongFromList={playSongFromList}
            t={t}
            theme={theme}
          />
        );
      case 'allSongs':
        return (
          <AllSongs
            songs={songs}
            playlists={playlists}
            currentSong={currentSong} // ✅ پاس دادن آهنگ فعلی
            onPlaySongFromList={playSongFromList}
            onCreatePlaylist={handleCreatePlaylist}
            addToQueue={addToQueue}
            onDeleteSong={deleteSong}
            onUpdateSong={updateSong}
            onAddSongToPlaylist={addSongToPlaylist}
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
            onPlaySongFromList={playSongFromList}
            addToQueue={addToQueue}
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
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={isSettingsOpen ? 'settings' : currentTab}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag={isSettingsOpen ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(_, { offset }) => { // ✅ استفاده از _ به جای e
              if (isSettingsOpen) return;
              const swipe = offset.x;
              if (language === 'fa') {
                if (swipe < -100) paginate(-1);
                else if (swipe > 100) paginate(1);
              } else {
                if (swipe < -100) paginate(1);
                else if (swipe > 100) paginate(-1);
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
          currentSong={currentSong}
          queue={queue}
          removeFromQueue={removeFromQueue}
          playNext={playNext}
          playPrev={playPrev}
          reorderQueue={reorderQueue}
          repeatMode={repeatMode}
          setRepeatMode={setRepeatMode}
          isShuffle={isShuffle}
          setIsShuffle={setIsShuffle}
          playTrigger={playTrigger}
          t={t}
          theme={theme}
        />
      </div>
    </div>
  );
}

export default App;