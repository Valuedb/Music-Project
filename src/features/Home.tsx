import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Shuffle,
  Moon,
  RefreshCw,
  Folder,
  ListMusic,
  Mic,
  Clock,
  Disc,
  Music,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';
import type { Playlist, SleepTimerState, Song } from '../types';
import type { SearchNavigateTarget } from '../components/SearchBar';
import { CoverImage } from '../components/CoverImage';

interface HomeProps {
  songs: Song[];
  playlists: Playlist[];
  customFolders: string[];
  currentSong: Song | null;
  onPlaySongFromList: (song: Song, list: Song[]) => void;
  onShuffleAll: () => void;
  onNavigateToItem: (target: SearchNavigateTarget) => void;
  onSelectTab: (tab: string) => void;
  sleepTimer: SleepTimerState;
  onSetSleepTimer: (timer: SleepTimerState) => void;
  t: any;
  theme: any;
  language: 'fa' | 'en';
  isPlaying?: boolean;
  glassCardCovers?: boolean;
}

const formatTrackDuration = (seconds?: number): string => {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const formatTotalLibraryTime = (totalSeconds: number, t: any): string => {
  if (!totalSeconds || totalSeconds <= 0) return `0 ${t.minutesShort || 'm'}`;
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes} ${t.minutesShort || 'm'}`;
  }
  return `${hours} ${t.hoursShort || 'h'} ${minutes} ${t.minutesShort || 'm'}`;
};

const formatCountdown = (seconds: number): string => {
  const clamped = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

interface QuickAccessEntry {
  id: string;
  kind: 'playlist' | 'folder';
  name: string;
  songs: Song[];
  cover: string;
}

interface TopArtistEntry {
  name: string;
  songs: Song[];
  totalPlays: number;
  cover: string;
}

export const Home: React.FC<HomeProps> = ({
  songs,
  playlists,
  customFolders,
  currentSong,
  onPlaySongFromList,
  onShuffleAll,
  onNavigateToItem,
  onSelectTab,
  sleepTimer,
  onSetSleepTimer,
  t,
  theme,
  language,
  isPlaying = false,
  glassCardCovers = true,
}) => {
  const isRTL = language === 'fa';
  const [pickSeed, setPickSeed] = useState(0);
  const [sleepMenuOpen, setSleepMenuOpen] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [hoveredSongId, setHoveredSongId] = useState<string | null>(null);
  const [hoveredQuickId, setHoveredQuickId] = useState<string | null>(null);
  const [hoveredArtist, setHoveredArtist] = useState<string | null>(null);
  const sleepMenuRef = useRef<HTMLDivElement>(null);

  // به‌روزرسانی شمارنده تایمر خواب فقط وقتی تایمر زمان‌دار فعال است
  useEffect(() => {
    if (sleepTimer.mode !== 'until') return;
    setNowTs(Date.now());
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [sleepTimer]);

  // بستن منوی تایمر خواب با کلیک بیرون
  useEffect(() => {
    if (!sleepMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (sleepMenuRef.current && !sleepMenuRef.current.contains(e.target as Node)) {
        setSleepMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [sleepMenuOpen]);

  // آهنگ اصلی برای باکس Continue Listening
  const heroSong = useMemo<Song | null>(() => {
    if (currentSong) return currentSong;
    if (songs.length === 0) return null;
    const lastPlayed = [...songs]
      .filter((s) => (s.lastPlayedAt ?? 0) > 0)
      .sort((a, b) => (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0));
    if (lastPlayed.length > 0) return lastPlayed[0];
    return [...songs].sort((a, b) => b.addedAt - a.addedAt)[0];
  }, [currentSong, songs]);

  const isHeroPlaying = Boolean(
    isPlaying && currentSong && heroSong && currentSong.id === heroSong.id
  );

  // محاسبه آمار کتابخانه و آرتیست‌های برتر
  const {
    totalDurationSeconds,
    artistsCount,
    albumsCount,
    foldersCount,
    topArtists,
  } = useMemo(() => {
    let totalDur = 0;
    const albumSet = new Set<string>();
    const folderSet = new Set<string>(
      customFolders.map((f) => f.trim()).filter(Boolean)
    );
    const artistMap = new Map<string, Song[]>();

    songs.forEach((song) => {
      if (song.duration && Number.isFinite(song.duration)) {
        totalDur += song.duration;
      }
      if (song.album?.trim()) {
        albumSet.add(song.album.trim().toLowerCase());
      }
      if (song.folder?.trim()) {
        folderSet.add(song.folder.trim());
      }
      const artistName = song.artist?.trim() || (t.unknownArtist || 'Unknown');
      const existing = artistMap.get(artistName);
      if (existing) existing.push(song);
      else artistMap.set(artistName, [song]);
    });

    const artistsSorted: TopArtistEntry[] = Array.from(artistMap.entries())
      .map(([name, artistSongs]) => {
        const totalPlays = artistSongs.reduce((acc, s) => acc + (s.playCount || 0), 0);
        const cover = artistSongs.find((s) => s.cover)?.cover || '';
        return { name, songs: artistSongs, totalPlays, cover };
      })
      .sort((a, b) => {
        if (b.totalPlays !== a.totalPlays) return b.totalPlays - a.totalPlays;
        return b.songs.length - a.songs.length;
      });

    return {
      totalDurationSeconds: totalDur,
      artistsCount: artistMap.size,
      albumsCount: albumSet.size,
      foldersCount: folderSet.size,
      topArtists: artistsSorted,
    };
  }, [songs, customFolders, t.unknownArtist]);

  // انتخاب ۶ آهنگ پیشنهادی با قابلیت Refresh بدون پرش ناخواسته
  const quickPicks = useMemo<Song[]>(() => {
    if (songs.length === 0) return [];
    const scored = songs.map((song, idx) => {
      let hash = (pickSeed + 1) * 2654435761 + idx * 97;
      for (let i = 0; i < song.id.length; i++) {
        hash = (hash * 31 + song.id.charCodeAt(i)) >>> 0;
      }
      return { song, score: hash };
    });
    scored.sort((a, b) => a.score - b.score);
    return scored.slice(0, 6).map((item) => item.song);
  }, [songs, pickSeed]);

  // دسترسی سریع به پلی‌لیست‌ها و فولدرهای ساخته‌شده
  const quickAccessItems = useMemo<QuickAccessEntry[]>(() => {
    const items: QuickAccessEntry[] = [];

    playlists.forEach((pl) => {
      items.push({
        id: pl.id,
        kind: 'playlist',
        name: pl.name,
        songs: pl.songs,
        cover: pl.songs.find((s) => s.cover)?.cover || '',
      });
    });

    const folderMap = new Map<string, Song[]>();
    customFolders.forEach((f) => {
      const trimmed = f.trim();
      if (trimmed) folderMap.set(trimmed, []);
    });
    songs.forEach((song) => {
      const f = song.folder?.trim();
      if (!f) return;
      const list = folderMap.get(f);
      if (list) list.push(song);
      else folderMap.set(f, [song]);
    });

    folderMap.forEach((folderSongs, folderName) => {
      items.push({
        id: folderName,
        kind: 'folder',
        name: folderName,
        songs: folderSongs,
        cover: folderSongs.find((s) => s.cover)?.cover || '',
      });
    });

    return items
      .sort((a, b) => b.songs.length - a.songs.length)
      .slice(0, 4);
  }, [playlists, customFolders, songs]);

  const handleHeroPrimaryAction = () => {
    if (!heroSong) return;
    if (currentSong && currentSong.id === heroSong.id) {
      window.dispatchEvent(new CustomEvent('app:toggle-play'));
    } else {
      onPlaySongFromList(heroSong, songs);
    }
  };

  const remainingSleepSeconds =
    sleepTimer.mode === 'until'
      ? Math.max(0, Math.ceil((sleepTimer.endsAt - nowTs) / 1000))
      : 0;

  const isSleepActive = sleepTimer.mode !== 'off';

  const sleepButtonLabel =
    sleepTimer.mode === 'until'
      ? formatCountdown(remainingSleepSeconds)
      : sleepTimer.mode === 'songEnd'
      ? t.sleepAfterSong || 'پایان این آهنگ'
      : t.sleepTimer || 'تایمر خواب';

  const topArtist = topArtists[0] || null;
  const surfaceHoverBg = theme.isDark
    ? 'rgba(255, 255, 255, 0.09)'
    : 'rgba(255, 255, 255, 0.88)';
  const menuBg = theme.isDark
    ? 'rgba(22, 18, 42, 0.96)'
    : 'rgba(255, 255, 255, 0.98)';
  const menuItemHover = theme.isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(0, 0, 0, 0.07)';

  const DirectionalChevron = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div
      style={{
        flex: 1,
        padding: 'clamp(16px, 3vw, 32px) clamp(16px, 4vw, 40px) 136px',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      {/* هدر صفحه */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: 'clamp(16px, 2.2vw, 24px)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'clamp(24px, 3vw, 32px)',
              fontWeight: 800,
              color: theme.colors.textPrimary,
              margin: 0,
              letterSpacing: '-0.5px',
            }}
          >
            {t.listenNow || 'همین حالا گوش کن'}
          </h1>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '13px',
              color: theme.colors.textSecondary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {songs.length} {t.tracksCount || 'آهنگ'} ·{' '}
            {formatTotalLibraryTime(totalDurationSeconds, t)}
          </p>
        </div>
      </div>

      {/* ردیف ۱: کارت اصلی ادامه گوش دادن + کنترل‌های سریع + تایمر خواب */}
      <div
        style={{
          position: 'relative',
          borderRadius: theme.radius.xl || '24px',
          border: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.surface,
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          boxShadow: theme.isDark
            ? '0 14px 36px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
            : '0 10px 28px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.85)',
          padding: 'clamp(18px, 2.6vw, 28px)',
          marginBottom: '20px',
          overflow: 'visible',
          boxSizing: 'border-box',
        }}
      >
        {/* لایه بلوری کاور پس‌زمینه داخل کارت بدون شکستن border-radius */}
        {heroSong?.cover && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: theme.radius.xl || '24px',
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: '-24px',
                backgroundImage: `url(${heroSong.cover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(34px) saturate(160%)',
                opacity: theme.isDark ? 0.32 : 0.22,
                transform: 'scale(1.1)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: theme.isDark
                  ? 'linear-gradient(120deg, rgba(16, 14, 28, 0.84) 0%, rgba(16, 14, 28, 0.62) 100%)'
                  : 'linear-gradient(120deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.72) 100%)',
              }}
            />
          </div>
        )}

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          {/* اطلاعات آهنگ فعلی یا آخرین آهنگ */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              minWidth: 0,
              flex: '1 1 280px',
            }}
          >
            <CoverImage
              src={heroSong?.cover}
              alt={heroSong?.name || ''}
              iconSize={34}
              iconColor={theme.colors.textSecondary}
              fallbackBg={
                theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
              }
              style={{
                width: 'clamp(78px, 9vw, 104px)',
                height: 'clamp(78px, 9vw, 104px)',
                borderRadius: '16px',
                objectFit: 'cover',
                flexShrink: 0,
                border: `1px solid ${theme.colors.border}`,
                boxShadow: '0 10px 26px rgba(0, 0, 0, 0.28)',
              }}
            />

            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: theme.colors.primary,
                  marginBottom: '6px',
                }}
              >
                {isHeroPlaying
                  ? t.nowPlaying || 'در حال پخش'
                  : t.continueListening || 'ادامه گوش دادن'}
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: 'clamp(18px, 2.2vw, 24px)',
                  fontWeight: 800,
                  color: theme.colors.textPrimary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.25,
                }}
              >
                {heroSong ? heroSong.name : t.noSongSelected || 'آهنگی انتخاب نشده'}
              </h2>

              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '14px',
                  color: theme.colors.textSecondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {heroSong
                  ? heroSong.album?.trim()
                    ? `${heroSong.artist} · ${heroSong.album}`
                    : heroSong.artist
                  : t.noSongs || 'هنوز آهنگی اضافه نشده است.'}
              </p>
            </div>
          </div>

          {/* دکمه‌های اقدام سریع + تایمر خواب */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <button
              onClick={handleHeroPrimaryAction}
              disabled={!heroSong}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: heroSong ? 'pointer' : 'not-allowed',
                opacity: heroSong ? 1 : 0.5,
                boxShadow: `0 6px 18px ${theme.colors.primary}44`,
                transition: 'filter 0.15s ease, opacity 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (heroSong) e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
              }}
            >
              {isHeroPlaying ? (
                <Pause size={16} fill="#ffffff" />
              ) : (
                <Play size={16} fill="#ffffff" />
              )}
              <span>
                {isHeroPlaying
                  ? t.pausePlayback || 'توقف پخش'
                  : t.resumePlayback || 'ادامه پخش'}
              </span>
            </button>

            <button
              onClick={onShuffleAll}
              disabled={songs.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '14px',
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)',
                color: theme.colors.textPrimary,
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: songs.length > 0 ? 'pointer' : 'not-allowed',
                opacity: songs.length > 0 ? 1 : 0.5,
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (songs.length > 0) {
                  e.currentTarget.style.backgroundColor = surfaceHoverBg;
                  e.currentTarget.style.borderColor = theme.colors.primary + '88';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.borderColor = theme.colors.border;
              }}
            >
              <Shuffle size={15} />
              <span>{t.shuffleAll || 'پخش تصادفی همه'}</span>
            </button>

            {/* کنترل تایمر خواب */}
            <div ref={sleepMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setSleepMenuOpen((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '10px 15px',
                  borderRadius: '14px',
                  border: `1px solid ${
                    isSleepActive ? theme.colors.primary : theme.colors.border
                  }`,
                  backgroundColor: isSleepActive
                    ? `${theme.colors.primary}22`
                    : theme.isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                  color: isSleepActive
                    ? theme.colors.primary
                    : theme.colors.textPrimary,
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <Moon size={15} />
                <span>{sleepButtonLabel}</span>
              </button>

              {sleepMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    insetInlineEnd: 0,
                    minWidth: '185px',
                    padding: '6px',
                    borderRadius: theme.radius.md || '14px',
                    backgroundColor: menuBg,
                    backdropFilter: 'blur(26px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(26px) saturate(180%)',
                    border: `1px solid ${theme.colors.border}`,
                    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.42)',
                    zIndex: 80,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  {[15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        onSetSleepTimer({
                          mode: 'until',
                          endsAt: Date.now() + mins * 60 * 1000,
                        });
                        setSleepMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: theme.colors.textPrimary,
                        fontSize: '13px',
                        fontWeight: 500,
                        textAlign: 'start',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = menuItemHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span>
                        {mins} {t.sleepMinutes || 'دقیقه'}
                      </span>
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      onSetSleepTimer({ mode: 'songEnd' });
                      setSleepMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color:
                        sleepTimer.mode === 'songEnd'
                          ? theme.colors.primary
                          : theme.colors.textPrimary,
                      fontSize: '13px',
                      fontWeight: sleepTimer.mode === 'songEnd' ? 700 : 500,
                      textAlign: 'start',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = menuItemHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span>{t.endOfSong || 'پایان آهنگ فعلی'}</span>
                    {sleepTimer.mode === 'songEnd' && <Check size={14} />}
                  </button>

                  {isSleepActive && (
                    <>
                      <div
                        style={{
                          height: '1px',
                          backgroundColor: theme.colors.border,
                          margin: '3px 4px',
                        }}
                      />
                      <button
                        onClick={() => {
                          onSetSleepTimer({ mode: 'off' });
                          setSleepMenuOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'transparent',
                          color: theme.colors.danger || '#ff453a',
                          fontSize: '13px',
                          fontWeight: 600,
                          textAlign: 'start',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            'rgba(255, 69, 58, 0.14)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <X size={14} />
                        <span>{t.sleepTimerOff || 'خاموش'}</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ردیف آمار فشرده کتابخانه (Library Insights) بدون کارت تو در تو و بدون پیل */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1px',
          backgroundColor: theme.colors.border,
          borderRadius: theme.radius.lg || '18px',
          border: `1px solid ${theme.colors.border}`,
          overflow: 'hidden',
          marginBottom: '26px',
        }}
      >
        <div
          style={{
            backgroundColor: theme.colors.surface,
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Clock size={18} color={theme.colors.primary} style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '11.5px', color: theme.colors.textSecondary }}>
              {t.totalDuration || 'مجموع زمان'}
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: theme.colors.textPrimary,
                fontVariantNumeric: 'tabular-nums',
                marginTop: '2px',
              }}
            >
              {formatTotalLibraryTime(totalDurationSeconds, t)}
            </div>
          </div>
        </div>

        <button
          onClick={() => onSelectTab('artists')}
          style={{
            backgroundColor: theme.colors.surface,
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'start',
          }}
        >
          <Mic size={18} color="#ff9500" style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '11.5px', color: theme.colors.textSecondary }}>
              {t.artists || 'آرتیست‌ها'}
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: theme.colors.textPrimary,
                fontVariantNumeric: 'tabular-nums',
                marginTop: '2px',
              }}
            >
              {artistsCount} {t.artistsCountLabel || 'آرتیست'}
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelectTab('albums')}
          style={{
            backgroundColor: theme.colors.surface,
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'start',
          }}
        >
          <Disc size={18} color="#5e5ce6" style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '11.5px', color: theme.colors.textSecondary }}>
              {(t.albums || 'آلبوم‌ها') + ' / ' + (t.folders || 'فولدرها')}
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: theme.colors.textPrimary,
                fontVariantNumeric: 'tabular-nums',
                marginTop: '2px',
              }}
            >
              {albumsCount} · {foldersCount}
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            if (topArtist) {
              onNavigateToItem({ tab: 'artists', key: topArtist.name });
            } else {
              onSelectTab('artists');
            }
          }}
          style={{
            backgroundColor: theme.colors.surface,
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'start',
          }}
        >
          <Music size={18} color="#ff3b30" style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '11.5px', color: theme.colors.textSecondary }}>
              {t.topArtist || 'محبوب‌ترین آرتیست'}
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: theme.colors.textPrimary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: '2px',
              }}
            >
              {topArtist ? topArtist.name : '—'}
            </div>
          </div>
        </button>
      </div>

      {/* ردیف ۲: انتخاب سریع (Quick Picks) */}
      <div style={{ marginBottom: '28px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            gap: '12px',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '17px',
              fontWeight: 700,
              color: theme.colors.textPrimary,
            }}
          >
            {t.quickPicks || 'انتخاب سریع'}
          </h2>

          {songs.length > 1 && (
            <button
              onClick={() => setPickSeed((s) => s + 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '10px',
                padding: '6px 12px',
                color: theme.colors.textSecondary,
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'color 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.colors.textPrimary;
                e.currentTarget.style.borderColor = theme.colors.primary + '88';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.colors.textSecondary;
                e.currentTarget.style.borderColor = theme.colors.border;
              }}
            >
              <RefreshCw size={13} />
              <span>{t.refreshPicks || 'تغییر پیشنهادها'}</span>
            </button>
          )}
        </div>

        {quickPicks.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>
            {t.noSongs || 'هنوز آهنگی اضافه نشده است.'}
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '10px',
            }}
          >
            {quickPicks.map((song) => {
              const isCurrent = currentSong?.id === song.id;
              const isHovered = hoveredSongId === song.id;

              return (
                <div
                  key={song.id}
                  onClick={() => onPlaySongFromList(song, quickPicks)}
                  onMouseEnter={() => setHoveredSongId(song.id)}
                  onMouseLeave={() => setHoveredSongId(null)}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '14px',
                    border: `1px solid ${
                      isCurrent
                        ? theme.colors.primary
                        : isHovered
                        ? theme.colors.primary + '66'
                        : theme.colors.border
                    }`,
                    backgroundColor: isHovered ? surfaceHoverBg : theme.colors.surface,
                    backdropFilter: 'blur(20px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                    cursor: 'pointer',
                    transition: 'background-color 0.18s ease, border-color 0.18s ease',
                  }}
                >
                  {glassCardCovers && song.cover && (
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${song.cover})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(18px)',
                        opacity: theme.isDark ? 0.16 : 0.12,
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                    <CoverImage
                      src={song.cover}
                      alt={song.name}
                      iconSize={18}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '10px',
                        objectFit: 'cover',
                      }}
                    />
                    {(isHovered || isCurrent) && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '10px',
                          backgroundColor: 'rgba(0, 0, 0, 0.45)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Play size={16} fill="#ffffff" color="#ffffff" />
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: isCurrent ? theme.colors.primary : theme.colors.textPrimary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {song.name}
                    </div>
                    <div
                      style={{
                        fontSize: '12.5px',
                        color: theme.colors.textSecondary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '2px',
                      }}
                    >
                      {song.artist}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '12px',
                      color: theme.colors.textSecondary,
                      fontVariantNumeric: 'tabular-nums',
                      flexShrink: 0,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {formatTrackDuration(song.duration)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ردیف ۳: دسترسی سریع (پلی‌لیست‌ها و فولدرها) + آرتیست‌های برتر */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '20px',
        }}
      >
        {/* ستون ۱: دسترسی سریع */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            backdropFilter: 'blur(24px) saturate(170%)',
            WebkitBackdropFilter: 'blur(24px) saturate(170%)',
            borderRadius: theme.radius.xl || '20px',
            border: `1px solid ${theme.colors.border}`,
            padding: '18px 20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: theme.colors.textPrimary,
              }}
            >
              {t.quickAccess || 'دسترسی سریع'}
            </h2>
            <button
              onClick={() => onSelectTab('playlists')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: theme.colors.primary,
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span>{t.viewAll || 'مشاهده همه'}</span>
              <DirectionalChevron size={14} />
            </button>
          </div>

          {quickAccessItems.length === 0 ? (
            <div style={{ padding: '14px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: theme.colors.textSecondary }}>
                {t.noQuickAccess || 'هنوز پلی‌لیست یا فولدری ساخته نشده است.'}
              </p>
              <div>
                <button
                  onClick={() => onSelectTab('playlists')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                    color: theme.colors.textPrimary,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t.createPlaylistOrFolder || 'ساخت پلی‌لیست'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {quickAccessItems.map((item) => {
                const keyId = `${item.kind}:${item.id}`;
                const isHovered = hoveredQuickId === keyId;

                return (
                  <div
                    key={keyId}
                    onClick={() =>
                      onNavigateToItem({
                        tab: item.kind === 'playlist' ? 'playlists' : 'folders',
                        key: item.id,
                      })
                    }
                    onMouseEnter={() => setHoveredQuickId(keyId)}
                    onMouseLeave={() => setHoveredQuickId(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 10px',
                      borderRadius: '12px',
                      backgroundColor: isHovered ? menuItemHover : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {item.cover ? (
                      <CoverImage
                        src={item.cover}
                        alt={item.name}
                        iconSize={16}
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: '10px',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: '10px',
                          backgroundColor:
                            item.kind === 'folder'
                              ? 'rgba(10, 132, 255, 0.15)'
                              : 'rgba(94, 92, 230, 0.15)',
                          color: item.kind === 'folder' ? '#0a84ff' : '#5e5ce6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {item.kind === 'folder' ? (
                          <Folder size={18} />
                        ) : (
                          <ListMusic size={18} />
                        )}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: theme.colors.textPrimary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: theme.colors.textSecondary,
                          fontVariantNumeric: 'tabular-nums',
                          marginTop: '2px',
                        }}
                      >
                        {item.kind === 'folder'
                          ? t.folderLabel || 'فولدر'
                          : t.playlistLabel || 'پلی‌لیست'}{' '}
                        · {item.songs.length} {t.tracksCount || 'آهنگ'}
                      </div>
                    </div>

                    {item.songs.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlaySongFromList(item.songs[0], item.songs);
                        }}
                        title={t.playAll || 'پخش'}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: theme.colors.primary,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <Play size={13} fill="#ffffff" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ستون ۲: آرتیست‌های برتر */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            backdropFilter: 'blur(24px) saturate(170%)',
            WebkitBackdropFilter: 'blur(24px) saturate(170%)',
            borderRadius: theme.radius.xl || '20px',
            border: `1px solid ${theme.colors.border}`,
            padding: '18px 20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: theme.colors.textPrimary,
              }}
            >
              {t.topArtists || 'آرتیست‌های برتر'}
            </h2>
            <button
              onClick={() => onSelectTab('artists')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: theme.colors.primary,
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span>{t.viewAll || 'مشاهده همه'}</span>
              <DirectionalChevron size={14} />
            </button>
          </div>

          {topArtists.length === 0 ? (
            <p style={{ margin: 0, fontSize: '13px', color: theme.colors.textSecondary }}>
              {t.noArtists || 'هنوز آرتیستی در کتابخانه وجود ندارد.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topArtists.slice(0, 5).map((artist) => {
                const isHovered = hoveredArtist === artist.name;
                return (
                  <div
                    key={artist.name}
                    onClick={() =>
                      onNavigateToItem({ tab: 'artists', key: artist.name })
                    }
                    onMouseEnter={() => setHoveredArtist(artist.name)}
                    onMouseLeave={() => setHoveredArtist(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 10px',
                      borderRadius: '12px',
                      backgroundColor: isHovered ? menuItemHover : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <CoverImage
                      src={artist.cover}
                      alt={artist.name}
                      iconSize={16}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: theme.colors.textPrimary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {artist.name}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: theme.colors.textSecondary,
                          fontVariantNumeric: 'tabular-nums',
                          marginTop: '2px',
                        }}
                      >
                        {artist.songs.length} {t.tracksCount || 'آهنگ'} ·{' '}
                        {artist.totalPlays} {t.plays || 'پخش'}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlaySongFromList(artist.songs[0], artist.songs);
                      }}
                      title={t.playAll || 'پخش'}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: theme.colors.primary,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <Play size={13} fill="#ffffff" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};