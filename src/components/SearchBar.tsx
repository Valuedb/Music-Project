import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Clock,
  Play,
  Music,
  Mic,
  Disc,
  Folder,
  ListMusic,
  Trash2,
  ArrowUpRight,
} from 'lucide-react';
import type { Playlist, Song } from '../types';
import { STORAGE_KEYS } from '../storage/keys';
import { CoverImage } from './CoverImage';

export interface SearchNavigateTarget {
  tab: 'artists' | 'albums' | 'folders' | 'playlists';
  key: string;
}

interface SearchBarProps {
  onSearch?: (term: string) => void;
  placeholder?: string;
  theme: any;
  songs?: Song[];
  playlists?: Playlist[];
  customFolders?: string[];
  onPlaySong?: (song: Song, list: Song[]) => void;
  onNavigate?: (target: SearchNavigateTarget) => void;
  t?: any;
}

type SearchCategoryTab = 'all' | 'songs' | 'artists' | 'albums' | 'folders' | 'playlists';

const UNCATEGORIZED_FOLDER_ID = '__uncategorized__';

// نرمال‌سازی حروف فارسی و انگلیسی برای جستجوی هوشمند و بدون حساسیت به حروف عربی/فارسی
const normalize = (text?: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // حذف اعراب
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[آأإء]/g, 'ا')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // حذف نیم‌فاصله اضافی
    .trim();
};

const formatTime = (seconds?: number): string => {
  if (!seconds || isNaN(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const SearchBar = ({
  onSearch,
  placeholder,
  theme,
  songs = [],
  playlists = [],
  customFolders = [],
  onPlaySong,
  onNavigate,
  t = {},
}: SearchBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchCategoryTab>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // بارگذاری تاریخچه جستجوهای اخیر از localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.recentSearches || 'recentSearches');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(
            parsed.filter((item): item is string => typeof item === 'string').slice(0, 8)
          );
        }
      }
    } catch {
      // نادیده گرفتن خطای خواندن لوکال‌استوریج
    }
  }, []);

  // ذخیره تاریخچه جدید
  const saveRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(
          STORAGE_KEYS.recentSearches || 'recentSearches',
          JSON.stringify(updated)
        );
      } catch {
        // نادیده گرفتن خطا
      }
      return updated;
    });
  }, []);

  // حذف یک عبارت از تاریخچه
  const removeRecentSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== term);
      try {
        localStorage.setItem(
          STORAGE_KEYS.recentSearches || 'recentSearches',
          JSON.stringify(updated)
        );
      } catch {
        // نادیده گرفتن خطا
      }
      return updated;
    });
  };

  // پاک کردن تمام تاریخچه
  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.recentSearches || 'recentSearches');
    } catch {
      // نادیده گرفتن خطا
    }
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (onSearch) {
      onSearch('');
    }
  }, [onSearch]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  // کلید میانبر Cmd/Ctrl + K یا Ctrl + F و همچنین کلید / برای باز کردن سریع جستجو
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        setIsOpen((prev) => (e.key.toLowerCase() === 'f' ? true : !prev));
      } else if (e.key === 'Escape' && isOpen) {
        handleClose();
      } else if (e.key === '/' && !isOpen) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        setIsOpen(true);
      }
    };
    const handleOpenSearchEvent = () => setIsOpen(true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('app:open-search', handleOpenSearchEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('app:open-search', handleOpenSearchEvent);
    };
  }, [isOpen, handleClose]);

  // فوکوس خودکار هنگام باز شدن مودال
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => {
        document.body.style.overflow = originalOverflow;
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  const handleSelectRecent = (term: string) => {
    setQuery(term);
    if (onSearch) {
      onSearch(term);
    }
    inputRef.current?.focus();
  };

  const singlesLabel = t.singlesAlbum || 'Singles';
  const uncategorizedLabel = t.uncategorizedFolder || 'بدون فولدر';
  const unknownArtistLabel = t.unknownArtist || 'Unknown';

  // فیلتر بلادرنگ هوشمند در تمام بخش‌های کتابخانه (آهنگ‌ها، آرتیست‌ها، آلبوم‌ها، فولدرها و پلی‌لیست‌ها)
  const {
    filteredSongs,
    filteredArtists,
    filteredAlbums,
    filteredFolders,
    filteredPlaylists,
  } = useMemo(() => {
    const norm = normalize(query);
    if (!norm) {
      return {
        filteredSongs: [],
        filteredArtists: [],
        filteredAlbums: [],
        filteredFolders: [],
        filteredPlaylists: [],
      };
    }

    // ۱. فیلتر آهنگ‌ها
    const matchedSongs = songs.filter(
      (s) =>
        normalize(s.name).includes(norm) ||
        normalize(s.artist).includes(norm) ||
        (s.album && normalize(s.album).includes(norm)) ||
        (s.folder && normalize(s.folder).includes(norm))
    );

    // ۲. فیلتر آرتیست‌ها
    const artistMap = new Map<
      string,
      { artist: string; songs: Song[]; albumsCount: number; cover: string }
    >();
    songs.forEach((s) => {
      const artistName = s.artist?.trim() || unknownArtistLabel;
      const existing = artistMap.get(artistName);
      if (existing) {
        existing.songs.push(s);
        if (!existing.cover && s.cover) existing.cover = s.cover;
      } else {
        artistMap.set(artistName, {
          artist: artistName,
          songs: [s],
          albumsCount: 0,
          cover: s.cover || '',
        });
      }
    });
    const matchedArtists = Array.from(artistMap.values())
      .filter((item) => normalize(item.artist).includes(norm))
      .map((item) => ({
        ...item,
        albumsCount: new Set(
          item.songs.map((s) => s.album?.trim()).filter((a): a is string => Boolean(a))
        ).size,
      }));

    // ۳. فیلتر آلبوم‌ها
    const albumMap = new Map<
      string,
      { key: string; album: string; artist: string; songs: Song[]; cover: string }
    >();
    songs.forEach((s) => {
      const albumName = s.album?.trim() || singlesLabel;
      const existing = albumMap.get(albumName);
      if (existing) {
        existing.songs.push(s);
        if (!existing.cover && s.cover) existing.cover = s.cover;
      } else {
        albumMap.set(albumName, {
          key: albumName,
          album: albumName,
          artist: s.artist?.trim() || unknownArtistLabel,
          songs: [s],
          cover: s.cover || '',
        });
      }
    });
    const matchedAlbums = Array.from(albumMap.values())
      .map((item) => {
        const uniqueArtists = Array.from(
          new Set(item.songs.map((s) => s.artist?.trim()).filter(Boolean))
        );
        const artistLabel =
          uniqueArtists.length === 0
            ? unknownArtistLabel
            : uniqueArtists.length === 1
            ? uniqueArtists[0]
            : `${uniqueArtists[0]} & ${uniqueArtists.length - 1}`;
        return { ...item, artist: artistLabel };
      })
      .filter(
        (item) =>
          (item.key !== singlesLabel || normalize(singlesLabel).includes(norm)) &&
          (normalize(item.album).includes(norm) || normalize(item.artist).includes(norm))
      );

    // ۴. فیلتر فولدربندی‌ها (فولدرهای ساخته‌شده + فولدرهای آهنگ‌ها)
    const folderMap = new Map<string, Song[]>();
    customFolders.forEach((folderName) => {
      const trimmed = folderName.trim();
      if (trimmed && !folderMap.has(trimmed)) {
        folderMap.set(trimmed, []);
      }
    });
    const uncategorizedSongs: Song[] = [];
    songs.forEach((s) => {
      const folderName = s.folder?.trim();
      if (folderName) {
        const list = folderMap.get(folderName);
        if (list) list.push(s);
        else folderMap.set(folderName, [s]);
      } else {
        uncategorizedSongs.push(s);
      }
    });

    const folderEntries: { id: string; name: string; isUncategorized: boolean; songs: Song[] }[] =
      Array.from(folderMap.entries()).map(([name, list]) => ({
        id: name,
        name,
        isUncategorized: false,
        songs: list,
      }));
    if (uncategorizedSongs.length > 0) {
      folderEntries.push({
        id: UNCATEGORIZED_FOLDER_ID,
        name: uncategorizedLabel,
        isUncategorized: true,
        songs: uncategorizedSongs,
      });
    }
    const matchedFolders = folderEntries.filter((f) => normalize(f.name).includes(norm));

    // ۵. فیلتر پلی‌لیست‌ها
    const matchedPlaylists = playlists.filter((p) => normalize(p.name).includes(norm));

    return {
      filteredSongs: matchedSongs,
      filteredArtists: matchedArtists,
      filteredAlbums: matchedAlbums,
      filteredFolders: matchedFolders,
      filteredPlaylists: matchedPlaylists,
    };
  }, [query, songs, playlists, customFolders, singlesLabel, uncategorizedLabel, unknownArtistLabel]);

  // اگر تب انتخاب‌شده فعلی دیگر نتیجه‌ای ندارد، به‌صورت خودکار روی «همه» بیفتد
  const effectiveTab: SearchCategoryTab = useMemo(() => {
    if (activeTab === 'songs' && filteredSongs.length === 0) return 'all';
    if (activeTab === 'artists' && filteredArtists.length === 0) return 'all';
    if (activeTab === 'albums' && filteredAlbums.length === 0) return 'all';
    if (activeTab === 'folders' && filteredFolders.length === 0) return 'all';
    if (activeTab === 'playlists' && filteredPlaylists.length === 0) return 'all';
    return activeTab;
  }, [
    activeTab,
    filteredSongs.length,
    filteredArtists.length,
    filteredAlbums.length,
    filteredFolders.length,
    filteredPlaylists.length,
  ]);

  // پخش یک آهنگ از نتایج
  const handlePlaySongItem = (song: Song, list: Song[] = songs) => {
    saveRecentSearch(query || song.name);
    if (onPlaySong) {
      onPlaySong(song, list);
    }
    handleClose();
  };

  // پخش فوری تمام آهنگ‌های یک گروه (آرتیست، آلبوم، فولدر یا پلی‌لیست)
  const handlePlayGroup = (groupSongs: Song[], label: string) => {
    if (groupSongs.length === 0) return;
    saveRecentSearch(query || label);
    if (onPlaySong) {
      onPlaySong(groupSongs[0], groupSongs);
    }
    handleClose();
  };

  // ورود مستقیم به تب و آیتم انتخاب‌شده از نتایج جستجو
  const handleNavigateTarget = (
    target: SearchNavigateTarget,
    fallbackSongs: Song[],
    label: string
  ) => {
    saveRecentSearch(query || label);
    if (onNavigate) {
      onNavigate(target);
      handleClose();
      return;
    }
    if (fallbackSongs.length > 0 && onPlaySong) {
      onPlaySong(fallbackSongs[0], fallbackSongs);
    }
    handleClose();
  };

  const totalResultsCount =
    filteredSongs.length +
    filteredArtists.length +
    filteredAlbums.length +
    filteredFolders.length +
    filteredPlaylists.length;

  const isDark = theme.isDark;
  const textColor = theme.colors.textPrimary;
  const textMuted = theme.colors.textSecondary;
  const primaryColor = theme.colors.primary;
  const surfaceBg = isDark ? 'rgba(28, 25, 46, 0.78)' : 'rgba(255, 255, 255, 0.85)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const hoverBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

  const filterChips: { id: SearchCategoryTab; label: string; count: number }[] = [
    { id: 'all', label: t.all || 'همه', count: totalResultsCount },
    { id: 'songs', label: t.songsCategory || 'آهنگ‌ها', count: filteredSongs.length },
    {
      id: 'artists',
      label: t.artistsCategory || t.artists || 'آرتیست‌ها',
      count: filteredArtists.length,
    },
    { id: 'albums', label: t.albumsCategory || t.albums || 'آلبوم‌ها', count: filteredAlbums.length },
    {
      id: 'folders',
      label: t.foldersCategory || t.folders || 'فولدربندی‌ها',
      count: filteredFolders.length,
    },
    {
      id: 'playlists',
      label: t.playlistsCategory || t.playlists || 'پلی‌لیست‌ها',
      count: filteredPlaylists.length,
    },
  ];

  return (
    <>
      {/* دکمه باز کردن جستجو در TopBar */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        onClick={handleOpen}
        aria-label={t.search || 'Search'}
        title={`${t.search || 'Search'} (Ctrl+K)`}
        style={{
          background: 'none',
          border: 'none',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: textMuted,
          borderRadius: theme.radius?.md || '10px',
          transition: 'background-color 0.15s ease, color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = hoverBg;
          e.currentTarget.style.color = textColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = textMuted;
        }}
      >
        <Search size={22} />
      </motion.button>

      {/* مودال هوشمند جستجو با پورتال مستقیم به بدنه صفحه */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <div
                dir={t?.direction || (t?.home === 'خانه' ? 'rtl' : 'ltr')}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 99999,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  paddingTop: 'min(76px, 10vh)',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  paddingBottom: '24px',
                  boxSizing: 'border-box',
                  fontFamily: theme?.fonts?.main || 'system-ui, -apple-system, sans-serif',
                }}
              >
                {/* لایه بلوری تاریک پس‌زمینه */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleClose}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.68)' : 'rgba(15, 23, 42, 0.42)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                  }}
                />

                {/* پنجره اصلی جستجو */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -12 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '610px',
                    maxHeight: 'min(660px, 82vh)',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: surfaceBg,
                    backdropFilter: 'blur(36px) saturate(190%)',
                    WebkitBackdropFilter: 'blur(36px) saturate(190%)',
                    borderRadius: '24px',
                    border: `1px solid ${cardBorder}`,
                    boxShadow: isDark
                      ? `0 24px 60px rgba(0, 0, 0, 0.65), 0 0 32px ${theme.colors.glow || primaryColor}24, inset 0 1px 0 rgba(255, 255, 255, 0.15)`
                      : '0 20px 50px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                    overflow: 'hidden',
                    zIndex: 1,
                  }}
                >
                  {/* هدر جستجو و اینپوت اصلی */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '14px 18px',
                      borderBottom: `1px solid ${cardBorder}`,
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: primaryColor,
                        flexShrink: 0,
                      }}
                    >
                      <Search size={22} />
                    </div>

                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => handleQueryChange(e.target.value)}
                      placeholder={
                        placeholder ||
                        t.searchHint ||
                        'جستجوی آهنگ، آرتیست، آلبوم، فولدر یا پلی‌لیست...'
                      }
                      style={{
                        flex: 1,
                        minWidth: 0,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: '15px',
                        color: textColor,
                        fontWeight: '500',
                        fontFamily: 'inherit',
                        padding: '4px 8px',
                        direction: 'inherit',
                      }}
                    />

                    {/* دکمه پاک کردن متن جستجو */}
                    {query && (
                      <motion.button
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        onClick={() => handleQueryChange('')}
                        style={{
                          background: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: textColor,
                          padding: 0,
                          flexShrink: 0,
                        }}
                      >
                        <X size={14} />
                      </motion.button>
                    )}

                    {/* دکمه بستن سریع */}
                    <button
                      onClick={handleClose}
                      style={{
                        background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        border: `1px solid ${cardBorder}`,
                        borderRadius: '10px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: textMuted,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = textColor;
                        e.currentTarget.style.backgroundColor = hoverBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = textMuted;
                        e.currentTarget.style.backgroundColor = isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.05)';
                      }}
                    >
                      {t.close || 'بستن'}
                    </button>
                  </div>

                  {/* تب‌های فیلتر دسته‌بندی هوشمند هنگام تایپ عبارت */}
                  {query.trim().length > 0 && totalResultsCount > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 18px',
                        borderBottom: `1px solid ${cardBorder}`,
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        flexShrink: 0,
                      }}
                    >
                      {filterChips
                        .filter((chip) => chip.id === 'all' || chip.count > 0)
                        .map((chip) => {
                          const isSelected = effectiveTab === chip.id;
                          return (
                            <button
                              key={chip.id}
                              onClick={() => setActiveTab(chip.id)}
                              style={{
                                border: 'none',
                                borderRadius: '20px',
                                padding: '5px 12px',
                                fontSize: '12px',
                                fontWeight: isSelected ? '700' : '500',
                                backgroundColor: isSelected
                                  ? primaryColor
                                  : isDark
                                  ? 'rgba(255, 255, 255, 0.07)'
                                  : 'rgba(0, 0, 0, 0.05)',
                                color: isSelected ? '#ffffff' : textMuted,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                            >
                              {chip.label} ({chip.count})
                            </button>
                          );
                        })}
                    </div>
                  )}

                  {/* محتوای نتایج اسکرول‌شونده */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '12px 14px',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* بخش اول: در صورت خالی بودن اینپوت جستجو -> نمایش جستجوهای اخیر و پیشنهادی */}
                    {!query.trim() && (
                      <div>
                        {recentSearches.length > 0 ? (
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '10px',
                                padding: '0 6px',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: textMuted,
                                }}
                              >
                                <Clock size={15} />
                                <span>{t.recentSearches || 'جستجوهای اخیر'}</span>
                              </div>

                              <button
                                onClick={clearAllRecent}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: textMuted,
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 6px',
                                  borderRadius: '6px',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = textColor)}
                                onMouseLeave={(e) => (e.currentTarget.style.color = textMuted)}
                              >
                                <Trash2 size={13} />
                                <span>{t.clearRecent || 'پاک کردن همه'}</span>
                              </button>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px',
                                marginBottom: '16px',
                              }}
                            >
                              {recentSearches.map((term) => (
                                <div
                                  key={term}
                                  onClick={() => handleSelectRecent(term)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    backgroundColor: isDark
                                      ? 'rgba(255, 255, 255, 0.08)'
                                      : 'rgba(0, 0, 0, 0.05)',
                                    border: `1px solid ${cardBorder}`,
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    color: textColor,
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = isDark
                                      ? 'rgba(255, 255, 255, 0.14)'
                                      : 'rgba(0, 0, 0, 0.09)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = isDark
                                      ? 'rgba(255, 255, 255, 0.08)'
                                      : 'rgba(0, 0, 0, 0.05)';
                                  }}
                                >
                                  <span>{term}</span>
                                  <span
                                    onClick={(e) => removeRecentSearch(e, term)}
                                    title={t.deleteSong || 'حذف'}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: textMuted,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <X size={13} />
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              textAlign: 'center',
                              padding: '28px 16px',
                              color: textMuted,
                              fontSize: '13px',
                            }}
                          >
                            <Clock size={28} style={{ opacity: 0.4, margin: '0 auto 8px auto' }} />
                            <div>
                              {t.searchHint ||
                                'نام آهنگ، آرتیست، آلبوم، فولدر یا پلی‌لیست را تایپ کنید...'}
                            </div>
                          </div>
                        )}

                        {songs.length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <div
                              style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: textMuted,
                                marginBottom: '8px',
                                padding: '0 6px',
                              }}
                            >
                              {t.recommended || 'پیشنهادی‌ها'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {songs.slice(0, 4).map((s) => (
                                <div
                                  key={s.id}
                                  onClick={() => handlePlaySongItem(s)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '8px 10px',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.15s ease',
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.backgroundColor = hoverBg)
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.backgroundColor = 'transparent')
                                  }
                                >
                                  <CoverImage
                                    src={s.cover}
                                    alt=""
                                    iconSize={16}
                                    style={{
                                      width: '38px',
                                      height: '38px',
                                      borderRadius: '8px',
                                      objectFit: 'cover',
                                      flexShrink: 0,
                                    }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: textColor,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {s.name}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: '12px',
                                        color: textMuted,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {s.artist}
                                    </div>
                                  </div>
                                  <Play size={16} color={primaryColor} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* بخش دوم: نمایش نتایج دسته‌بندی‌شده */}
                    {query.trim().length > 0 && (
                      <div>
                        {totalResultsCount === 0 ? (
                          <div
                            style={{
                              textAlign: 'center',
                              padding: '40px 16px',
                              color: textMuted,
                            }}
                          >
                            <Music size={36} style={{ opacity: 0.35, margin: '0 auto 12px auto' }} />
                            <div
                              style={{
                                fontSize: '15px',
                                fontWeight: '600',
                                color: textColor,
                                marginBottom: '6px',
                              }}
                            >
                              {t.noResults || 'هیچ نتیجه‌ای یافت نشد'}
                            </div>
                            <div style={{ fontSize: '13px' }}>
                              {t.close === 'Close'
                                ? `No matches found for "${query}". Try a different keyword.`
                                : `نتیجه‌ای برای «${query}» پیدا نشد. عبارت دیگری را امتحان کنید.`}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* ۱. دسته‌بندی: آهنگ‌ها */}
                            {(effectiveTab === 'all' || effectiveTab === 'songs') &&
                              filteredSongs.length > 0 && (
                                <div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      fontSize: '13px',
                                      fontWeight: '700',
                                      color: textMuted,
                                      marginBottom: '8px',
                                      padding: '0 6px',
                                    }}
                                  >
                                    <Music size={15} color={primaryColor} />
                                    <span>{t.songsCategory || 'آهنگ‌ها'}</span>
                                    <span style={{ fontSize: '11px', opacity: 0.7 }}>
                                      ({filteredSongs.length})
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {filteredSongs
                                      .slice(0, effectiveTab === 'songs' ? 30 : 6)
                                      .map((song) => (
                                        <div
                                          key={song.id}
                                          onClick={() => handlePlaySongItem(song, filteredSongs)}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '8px 10px',
                                            borderRadius: '14px',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.15s ease',
                                          }}
                                          onMouseEnter={(e) =>
                                            (e.currentTarget.style.backgroundColor = hoverBg)
                                          }
                                          onMouseLeave={(e) =>
                                            (e.currentTarget.style.backgroundColor = 'transparent')
                                          }
                                        >
                                          <CoverImage
                                            src={song.cover}
                                            alt=""
                                            iconSize={16}
                                            style={{
                                              width: '42px',
                                              height: '42px',
                                              borderRadius: '10px',
                                              objectFit: 'cover',
                                              border: `1px solid ${cardBorder}`,
                                              flexShrink: 0,
                                            }}
                                          />

                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                              style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: textColor,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                              }}
                                            >
                                              {song.name}
                                            </div>
                                            <div
                                              style={{
                                                fontSize: '12px',
                                                color: textMuted,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                marginTop: '2px',
                                              }}
                                            >
                                              {song.artist}
                                              {song.album ? ` • ${song.album}` : ''}
                                            </div>
                                          </div>

                                          {song.duration ? (
                                            <span
                                              style={{
                                                fontSize: '12px',
                                                color: textMuted,
                                                fontVariantNumeric: 'tabular-nums',
                                              }}
                                            >
                                              {formatTime(song.duration)}
                                            </span>
                                          ) : null}

                                          <Play size={15} color={primaryColor} />
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                            {/* ۲. دسته‌بندی: آرتیست‌ها */}
                            {(effectiveTab === 'all' || effectiveTab === 'artists') &&
                              filteredArtists.length > 0 && (
                                <div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      fontSize: '13px',
                                      fontWeight: '700',
                                      color: textMuted,
                                      marginBottom: '8px',
                                      padding: '0 6px',
                                    }}
                                  >
                                    <Mic size={15} color={primaryColor} />
                                    <span>{t.artistsCategory || t.artists || 'آرتیست‌ها'}</span>
                                    <span style={{ fontSize: '11px', opacity: 0.7 }}>
                                      ({filteredArtists.length})
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {filteredArtists
                                      .slice(0, effectiveTab === 'artists' ? 20 : 4)
                                      .map((art) => (
                                        <div
                                          key={art.artist}
                                          onClick={() =>
                                            handleNavigateTarget(
                                              { tab: 'artists', key: art.artist },
                                              art.songs,
                                              art.artist
                                            )
                                          }
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '8px 10px',
                                            borderRadius: '14px',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.15s ease',
                                          }}
                                          onMouseEnter={(e) =>
                                            (e.currentTarget.style.backgroundColor = hoverBg)
                                          }
                                          onMouseLeave={(e) =>
                                            (e.currentTarget.style.backgroundColor = 'transparent')
                                          }
                                        >
                                          <CoverImage
                                            src={art.cover}
                                            alt=""
                                            iconSize={16}
                                            style={{
                                              width: '42px',
                                              height: '42px',
                                              borderRadius: '50%',
                                              objectFit: 'cover',
                                              border: `1px solid ${cardBorder}`,
                                              flexShrink: 0,
                                            }}
                                          />
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                              style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: textColor,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                              }}
                                            >
                                              {art.artist}
                                            </div>
                                            <div style={{ fontSize: '12px', color: textMuted }}>
                                              {art.songs.length} {t.tracksCount || 'آهنگ'}
                                              {art.albumsCount > 0 &&
                                                ` · ${art.albumsCount} ${t.albumsCountLabel || 'آلبوم'}`}
                                            </div>
                                          </div>
                                          {art.songs.length > 0 && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlayGroup(art.songs, art.artist);
                                              }}
                                              title={t.playAll || 'پخش همه'}
                                              style={{
                                                background: isDark
                                                  ? 'rgba(255,255,255,0.08)'
                                                  : 'rgba(0,0,0,0.06)',
                                                border: 'none',
                                                width: '30px',
                                                height: '30px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: primaryColor,
                                                flexShrink: 0,
                                              }}
                                            >
                                              <Play size={14} fill={primaryColor} />
                                            </button>
                                          )}
                                          <ArrowUpRight
                                            size={16}
                                            color={textMuted}
                                            style={{ opacity: 0.65, flexShrink: 0 }}
                                          />
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                            {/* ۳. دسته‌بندی: آلبوم‌ها */}
                            {(effectiveTab === 'all' || effectiveTab === 'albums') &&
                              filteredAlbums.length > 0 && (
                                <div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      fontSize: '13px',
                                      fontWeight: '700',
                                      color: textMuted,
                                      marginBottom: '8px',
                                      padding: '0 6px',
                                    }}
                                  >
                                    <Disc size={15} color={primaryColor} />
                                    <span>{t.albumsCategory || t.albums || 'آلبوم‌ها'}</span>
                                    <span style={{ fontSize: '11px', opacity: 0.7 }}>
                                      ({filteredAlbums.length})
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {filteredAlbums
                                      .slice(0, effectiveTab === 'albums' ? 20 : 4)
                                      .map((alb) => (
                                        <div
                                          key={alb.key}
                                          onClick={() =>
                                            handleNavigateTarget(
                                              { tab: 'albums', key: alb.key },
                                              alb.songs,
                                              alb.album
                                            )
                                          }
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '8px 10px',
                                            borderRadius: '14px',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.15s ease',
                                          }}
                                          onMouseEnter={(e) =>
                                            (e.currentTarget.style.backgroundColor = hoverBg)
                                          }
                                          onMouseLeave={(e) =>
                                            (e.currentTarget.style.backgroundColor = 'transparent')
                                          }
                                        >
                                          <CoverImage
                                            src={alb.cover}
                                            alt=""
                                            iconSize={16}
                                            style={{
                                              width: '42px',
                                              height: '42px',
                                              borderRadius: '8px',
                                              objectFit: 'cover',
                                              border: `1px solid ${cardBorder}`,
                                              flexShrink: 0,
                                            }}
                                          />
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                              style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: textColor,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                              }}
                                            >
                                              {alb.album}
                                            </div>
                                            <div style={{ fontSize: '12px', color: textMuted }}>
                                              {alb.artist} • {alb.songs.length}{' '}
                                              {t.tracksCount || 'آهنگ'}
                                            </div>
                                          </div>
                                          {alb.songs.length > 0 && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlayGroup(alb.songs, alb.album);
                                              }}
                                              title={t.playAll || 'پخش همه'}
                                              style={{
                                                background: isDark
                                                  ? 'rgba(255,255,255,0.08)'
                                                  : 'rgba(0,0,0,0.06)',
                                                border: 'none',
                                                width: '30px',
                                                height: '30px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: primaryColor,
                                                flexShrink: 0,
                                              }}
                                            >
                                              <Play size={14} fill={primaryColor} />
                                            </button>
                                          )}
                                          <ArrowUpRight
                                            size={16}
                                            color={textMuted}
                                            style={{ opacity: 0.65, flexShrink: 0 }}
                                          />
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                            {/* ۴. دسته‌بندی: فولدربندی‌ها */}
                            {(effectiveTab === 'all' || effectiveTab === 'folders') &&
                              filteredFolders.length > 0 && (
                                <div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      fontSize: '13px',
                                      fontWeight: '700',
                                      color: textMuted,
                                      marginBottom: '8px',
                                      padding: '0 6px',
                                    }}
                                  >
                                    <Folder size={15} color={primaryColor} />
                                    <span>{t.foldersCategory || t.folders || 'فولدربندی‌ها'}</span>
                                    <span style={{ fontSize: '11px', opacity: 0.7 }}>
                                      ({filteredFolders.length})
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {filteredFolders
                                      .slice(0, effectiveTab === 'folders' ? 20 : 4)
                                      .map((folder) => (
                                        <div
                                          key={folder.id}
                                          onClick={() =>
                                            handleNavigateTarget(
                                              { tab: 'folders', key: folder.id },
                                              folder.songs,
                                              folder.name
                                            )
                                          }
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '8px 10px',
                                            borderRadius: '14px',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.15s ease',
                                          }}
                                          onMouseEnter={(e) =>
                                            (e.currentTarget.style.backgroundColor = hoverBg)
                                          }
                                          onMouseLeave={(e) =>
                                            (e.currentTarget.style.backgroundColor = 'transparent')
                                          }
                                        >
                                          <div
                                            style={{
                                              width: '42px',
                                              height: '42px',
                                              borderRadius: '10px',
                                              backgroundColor: `${primaryColor}1F`,
                                              border: `1px solid ${cardBorder}`,
                                              color: primaryColor,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              flexShrink: 0,
                                            }}
                                          >
                                            <Folder size={18} />
                                          </div>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                              style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: textColor,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                              }}
                                            >
                                              {folder.name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: textMuted }}>
                                              {folder.songs.length} {t.tracksCount || 'آهنگ'}
                                            </div>
                                          </div>
                                          {folder.songs.length > 0 && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlayGroup(folder.songs, folder.name);
                                              }}
                                              title={t.playAll || 'پخش همه'}
                                              style={{
                                                background: isDark
                                                  ? 'rgba(255,255,255,0.08)'
                                                  : 'rgba(0,0,0,0.06)',
                                                border: 'none',
                                                width: '30px',
                                                height: '30px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: primaryColor,
                                                flexShrink: 0,
                                              }}
                                            >
                                              <Play size={14} fill={primaryColor} />
                                            </button>
                                          )}
                                          <ArrowUpRight
                                            size={16}
                                            color={textMuted}
                                            style={{ opacity: 0.65, flexShrink: 0 }}
                                          />
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                            {/* ۵. دسته‌بندی: پلی‌لیست‌ها */}
                            {(effectiveTab === 'all' || effectiveTab === 'playlists') &&
                              filteredPlaylists.length > 0 && (
                                <div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      fontSize: '13px',
                                      fontWeight: '700',
                                      color: textMuted,
                                      marginBottom: '8px',
                                      padding: '0 6px',
                                    }}
                                  >
                                    <ListMusic size={15} color={primaryColor} />
                                    <span>
                                      {t.playlistsCategory || t.playlists || 'پلی‌لیست‌ها'}
                                    </span>
                                    <span style={{ fontSize: '11px', opacity: 0.7 }}>
                                      ({filteredPlaylists.length})
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {filteredPlaylists
                                      .slice(0, effectiveTab === 'playlists' ? 20 : 4)
                                      .map((pl) => (
                                        <div
                                          key={pl.id}
                                          onClick={() =>
                                            handleNavigateTarget(
                                              { tab: 'playlists', key: pl.id },
                                              pl.songs,
                                              pl.name
                                            )
                                          }
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '8px 10px',
                                            borderRadius: '14px',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.15s ease',
                                          }}
                                          onMouseEnter={(e) =>
                                            (e.currentTarget.style.backgroundColor = hoverBg)
                                          }
                                          onMouseLeave={(e) =>
                                            (e.currentTarget.style.backgroundColor = 'transparent')
                                          }
                                        >
                                          <CoverImage
                                            src={pl.songs[0]?.cover}
                                            alt=""
                                            iconSize={16}
                                            style={{
                                              width: '42px',
                                              height: '42px',
                                              borderRadius: '10px',
                                              objectFit: 'cover',
                                              border: `1px solid ${cardBorder}`,
                                              flexShrink: 0,
                                            }}
                                          />
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                              style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: textColor,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                              }}
                                            >
                                              {pl.name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: textMuted }}>
                                              {pl.songs.length} {t.tracksCount || 'آهنگ'}
                                            </div>
                                          </div>
                                          {pl.songs.length > 0 && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlayGroup(pl.songs, pl.name);
                                              }}
                                              title={t.playAll || 'پخش همه'}
                                              style={{
                                                background: isDark
                                                  ? 'rgba(255,255,255,0.08)'
                                                  : 'rgba(0,0,0,0.06)',
                                                border: 'none',
                                                width: '30px',
                                                height: '30px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: primaryColor,
                                                flexShrink: 0,
                                              }}
                                            >
                                              <Play size={14} fill={primaryColor} />
                                            </button>
                                          )}
                                          <ArrowUpRight
                                            size={16}
                                            color={textMuted}
                                            style={{ opacity: 0.65, flexShrink: 0 }}
                                          />
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* فوتر باریک با کلیدهای راهنما */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 18px',
                      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.03)',
                      borderTop: `1px solid ${cardBorder}`,
                      fontSize: '11px',
                      color: textMuted,
                    }}
                  >
                    <span>{t.smartSearchFooter || 'جستجوی هوشمند در تمام کتابخانه'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <kbd
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(0, 0, 0, 0.07)',
                          fontSize: '10px',
                        }}
                      >
                        Esc
                      </kbd>{' '}
                      {t.toClose || 'برای خروج'}
                    </span>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};