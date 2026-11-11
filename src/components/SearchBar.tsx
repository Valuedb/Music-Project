import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, Play, Music, Mic, Disc, Trash2, ArrowUpRight } from 'lucide-react';
import type { Song } from '../types';
import { STORAGE_KEYS } from '../storage/keys';

interface SearchBarProps {
  onSearch?: (term: string) => void;
  placeholder?: string;
  theme: any;
  songs?: Song[];
  onPlaySong?: (song: Song, list: Song[]) => void;
  t?: any;
}

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
  onPlaySong,
  t = {},
}: SearchBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'artists' | 'albums'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // بارگذاری تاریخچه جستجوهای اخیر از localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.recentSearches || 'recentSearches');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.filter((item): item is string => typeof item === 'string').slice(0, 8));
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
        localStorage.setItem(STORAGE_KEYS.recentSearches || 'recentSearches', JSON.stringify(updated));
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
        localStorage.setItem(STORAGE_KEYS.recentSearches || 'recentSearches', JSON.stringify(updated));
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
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  // کلید میانبر Cmd/Ctrl + K و همچنین کلید / برای باز کردن سریع جستجو
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        handleClose();
      } else if (e.key === '/' && !isOpen) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  // فیلتر بلادرنگ هوشمند بر اساس آهنگ‌ها، خوانندگان و آلبوم‌ها
  const { filteredSongs, filteredArtists, filteredAlbums } = useMemo(() => {
    const norm = normalize(query);
    if (!norm) {
      return { filteredSongs: [], filteredArtists: [], filteredAlbums: [] };
    }

    // ۱. فیلتر آهنگ‌ها
    const matchedSongs = songs.filter(
      (s) =>
        normalize(s.name).includes(norm) ||
        normalize(s.artist).includes(norm) ||
        (s.album && normalize(s.album).includes(norm))
    );

    // ۲. فیلتر خوانندگان (گروه‌بندی آهنگ‌های مربوط به هر خواننده)
    const artistMap = new Map<string, { artist: string; songs: Song[]; cover: string }>();
    songs.forEach((s) => {
      if (normalize(s.artist).includes(norm)) {
        const existing = artistMap.get(s.artist);
        if (existing) {
          existing.songs.push(s);
        } else {
          artistMap.set(s.artist, {
            artist: s.artist,
            songs: [s],
            cover: s.cover,
          });
        }
      }
    });
    const matchedArtists = Array.from(artistMap.values());

    // ۳. فیلتر آلبوم‌ها
    const albumMap = new Map<string, { album: string; artist: string; songs: Song[]; cover: string }>();
    songs.forEach((s) => {
      const albumName = s.album || '';
      if (albumName && normalize(albumName).includes(norm)) {
        const existing = albumMap.get(albumName);
        if (existing) {
          existing.songs.push(s);
        } else {
          albumMap.set(albumName, {
            album: albumName,
            artist: s.artist,
            songs: [s],
            cover: s.cover,
          });
        }
      }
    });
    const matchedAlbums = Array.from(albumMap.values());

    return {
      filteredSongs: matchedSongs,
      filteredArtists: matchedArtists,
      filteredAlbums: matchedAlbums,
    };
  }, [query, songs]);

  // پخش یک آهنگ از نتایج
  const handlePlaySongItem = (song: Song, list: Song[] = songs) => {
    saveRecentSearch(query || song.name);
    if (onPlaySong) {
      onPlaySong(song, list);
    }
    handleClose();
  };

  // پخش تمام آهنگ‌های یک خواننده یا آلبوم
  const handlePlayGroup = (groupSongs: Song[]) => {
    if (groupSongs.length === 0) return;
    saveRecentSearch(query || groupSongs[0].artist);
    if (onPlaySong) {
      onPlaySong(groupSongs[0], groupSongs);
    }
    handleClose();
  };

  const totalResultsCount =
    filteredSongs.length + filteredArtists.length + filteredAlbums.length;

  const isDark = theme.isDark;
  const textColor = theme.colors.textPrimary;
  const textMuted = theme.colors.textSecondary;
  const primaryColor = theme.colors.primary;
  const surfaceBg = isDark ? 'rgba(28, 25, 46, 0.75)' : 'rgba(255, 255, 255, 0.82)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const hoverBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

  return (
    <>
      {/* دکمه باز کردن جستجو در TopBar */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        onClick={handleOpen}
        aria-label={t.search || 'Search'}
        title={`${t.search || 'Search'} (⌘K)`}
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

      {/* مودال هوشمند جستجو به سبک Apple Music Spotlight با پورتال مستقیم به بدنه صفحه */}
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
                maxWidth: '580px',
                maxHeight: 'min(640px, 80vh)',
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
                  placeholder={placeholder || t.searchHint || 'جستجوی آهنگ، خواننده یا آلبوم...'}
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

              {/* تب‌های فیلتر دسته‌بندی هوشمند (همه، آهنگ‌ها، خواننده‌ها، آلبوم‌ها) هنگام تایپ عبارت */}
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
                  }}
                >
                  <button
                    onClick={() => setActiveTab('all')}
                    style={{
                      border: 'none',
                      borderRadius: '20px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: activeTab === 'all' ? '700' : '500',
                      backgroundColor:
                        activeTab === 'all'
                          ? primaryColor
                          : isDark
                          ? 'rgba(255, 255, 255, 0.07)'
                          : 'rgba(0, 0, 0, 0.05)',
                      color: activeTab === 'all' ? '#ffffff' : textMuted,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    همه ({totalResultsCount})
                  </button>

                  {filteredSongs.length > 0 && (
                    <button
                      onClick={() => setActiveTab('songs')}
                      style={{
                        border: 'none',
                        borderRadius: '20px',
                        padding: '5px 12px',
                        fontSize: '12px',
                        fontWeight: activeTab === 'songs' ? '700' : '500',
                        backgroundColor:
                          activeTab === 'songs'
                            ? primaryColor
                            : isDark
                            ? 'rgba(255, 255, 255, 0.07)'
                            : 'rgba(0, 0, 0, 0.05)',
                        color: activeTab === 'songs' ? '#ffffff' : textMuted,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.songsCategory || 'آهنگ‌ها'} ({filteredSongs.length})
                    </button>
                  )}

                  {filteredArtists.length > 0 && (
                    <button
                      onClick={() => setActiveTab('artists')}
                      style={{
                        border: 'none',
                        borderRadius: '20px',
                        padding: '5px 12px',
                        fontSize: '12px',
                        fontWeight: activeTab === 'artists' ? '700' : '500',
                        backgroundColor:
                          activeTab === 'artists'
                            ? primaryColor
                            : isDark
                            ? 'rgba(255, 255, 255, 0.07)'
                            : 'rgba(0, 0, 0, 0.05)',
                        color: activeTab === 'artists' ? '#ffffff' : textMuted,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.artistsCategory || 'خوانندگان'} ({filteredArtists.length})
                    </button>
                  )}

                  {filteredAlbums.length > 0 && (
                    <button
                      onClick={() => setActiveTab('albums')}
                      style={{
                        border: 'none',
                        borderRadius: '20px',
                        padding: '5px 12px',
                        fontSize: '12px',
                        fontWeight: activeTab === 'albums' ? '700' : '500',
                        backgroundColor:
                          activeTab === 'albums'
                            ? primaryColor
                            : isDark
                            ? 'rgba(255, 255, 255, 0.07)'
                            : 'rgba(0, 0, 0, 0.05)',
                        color: activeTab === 'albums' ? '#ffffff' : textMuted,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.albumsCategory || 'آلبوم‌ها'} ({filteredAlbums.length})
                    </button>
                  )}
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
                {/* بخش اول: در صورت خالی بودن اینپوت جستجو -> نمایش جستجوهای اخیر */}
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

                        {/* چیپ‌های کپسولی تاریخچه جستجو */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
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
                                title="حذف"
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
                          padding: '30px 16px',
                          color: textMuted,
                          fontSize: '13px',
                        }}
                      >
                        <Clock size={28} style={{ opacity: 0.4, margin: '0 auto 8px auto' }} />
                        <div>{t.searchHint || 'نام آهنگ، خواننده یا آلبوم مورد نظر خود را بنویسید'}</div>
                      </div>
                    )}

                    {/* پیشنهادی‌های پرطرفدار کتابخانه موسیقی */}
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
                          پیشنهادی‌ها
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
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <img
                                src={s.cover}
                                alt=""
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '8px',
                                  objectFit: 'cover',
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

                {/* بخش دوم: در صورت وارد کردن متن جستجو -> نمایش نتایج دسته‌بندی‌شده */}
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
                        <div style={{ fontSize: '15px', fontWeight: '600', color: textColor, marginBottom: '6px' }}>
                          {t.noResults || 'نتیجه‌ای یافت نشد'}
                        </div>
                        <div style={{ fontSize: '13px' }}>
                          نتیجه‌ای برای «{query}» پیدا نشد. املای کلمه را بررسی کنید یا عبارت دیگری بنویسید.
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* دسته‌بندی: آهنگ‌ها */}
                        {(activeTab === 'all' || activeTab === 'songs') && filteredSongs.length > 0 && (
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
                              <span style={{ fontSize: '11px', opacity: 0.7 }}>({filteredSongs.length})</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {filteredSongs.slice(0, activeTab === 'songs' ? 25 : 6).map((song) => (
                                <motion.div
                                  key={song.id}
                                  whileHover={{ x: 3 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
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
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <div style={{ position: 'relative', width: '42px', height: '42px', flexShrink: 0 }}>
                                    <img
                                      src={song.cover}
                                      alt=""
                                      style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '10px',
                                        objectFit: 'cover',
                                        border: `1px solid ${cardBorder}`,
                                      }}
                                    />
                                    <div
                                      style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: 0,
                                        transition: 'opacity 0.15s ease',
                                      }}
                                      className="play-overlay"
                                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                                    >
                                      <Play size={16} color="#ffffff" fill="#ffffff" />
                                    </div>
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
                                      {song.artist} {song.album ? `• ${song.album}` : ''}
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

                                  <ArrowUpRight size={16} color={textMuted} style={{ opacity: 0.6 }} />
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* دسته‌بندی: خوانندگان */}
                        {(activeTab === 'all' || activeTab === 'artists') && filteredArtists.length > 0 && (
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
                              <span>{t.artistsCategory || 'خوانندگان'}</span>
                              <span style={{ fontSize: '11px', opacity: 0.7 }}>({filteredArtists.length})</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {filteredArtists.slice(0, activeTab === 'artists' ? 15 : 4).map((art) => (
                                <motion.div
                                  key={art.artist}
                                  whileHover={{ x: 3 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                  onClick={() => handlePlayGroup(art.songs)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '8px 10px',
                                    borderRadius: '14px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <img
                                    src={art.cover}
                                    alt=""
                                    style={{
                                      width: '42px',
                                      height: '42px',
                                      borderRadius: '50%',
                                      objectFit: 'cover',
                                      border: `1px solid ${cardBorder}`,
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
                                    </div>
                                  </div>
                                  <Play size={16} color={primaryColor} />
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* دسته‌بندی: آلبوم‌ها */}
                        {(activeTab === 'all' || activeTab === 'albums') && filteredAlbums.length > 0 && (
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
                              <span>{t.albumsCategory || 'آلبوم‌ها'}</span>
                              <span style={{ fontSize: '11px', opacity: 0.7 }}>({filteredAlbums.length})</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {filteredAlbums.slice(0, activeTab === 'albums' ? 15 : 4).map((alb) => (
                                <motion.div
                                  key={alb.album}
                                  whileHover={{ x: 3 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                  onClick={() => handlePlayGroup(alb.songs)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '8px 10px',
                                    borderRadius: '14px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <div style={{ position: 'relative', width: '42px', height: '42px' }}>
                                    <img
                                      src={alb.cover}
                                      alt=""
                                      style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '8px',
                                        objectFit: 'cover',
                                        border: `1px solid ${cardBorder}`,
                                      }}
                                    />
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
                                      {alb.album}
                                    </div>
                                    <div style={{ fontSize: '12px', color: textMuted }}>
                                      {alb.artist} • {alb.songs.length} {t.tracksCount || 'آهنگ'}
                                    </div>
                                  </div>
                                  <Play size={16} color={primaryColor} />
                                </motion.div>
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
                <span>جستجوی هوشمند در کتابخانه</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <kbd
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.07)',
                      fontSize: '10px',
                    }}
                  >
                    Esc
                  </kbd>{' '}
                  برای خروج
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