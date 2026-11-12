import React, { useEffect, useMemo, useState } from 'react';
import {
  Mic,
  Play,
  LayoutGrid,
  List,
  ArrowUpDown,
} from 'lucide-react';
import type { Song, Playlist } from '../types';
import { AllSongs } from './AllSongs';
import { CoverImage } from '../components/CoverImage';

interface ArtistsProps {
  songs: Song[];
  playlists: Playlist[];
  currentSong: Song | null;
  isPlaying?: boolean;
  onPlaySongFromList: (song: Song, list: Song[]) => void;
  onCreatePlaylist: (name: string, selectedSongs: Song[]) => void;
  addToQueue: (song: Song) => void;
  onDeleteSong: (id: string) => void;
  onUpdateSong: (updatedSong: Song) => void;
  onAddSongToPlaylist: (playlistId: string, song: Song) => void;
  onToggleFavorite: (id: string) => void;
  t: any;
  theme: any;
  language: 'fa' | 'en';
  glassCardCovers?: boolean;
  initialArtist?: { name: string; token: number } | null;
}

interface ArtistGroup {
  name: string;
  songs: Song[];
  albumsCount: number;
  cover: string;
}

type ViewMode = 'grid' | 'list';
type SortMode = 'name' | 'tracks';

export const Artists: React.FC<ArtistsProps> = ({
  songs,
  playlists,
  currentSong,
  isPlaying = false,
  onPlaySongFromList,
  onCreatePlaylist,
  addToQueue,
  onDeleteSong,
  onUpdateSong,
  onAddSongToPlaylist,
  onToggleFavorite,
  t,
  theme,
  language,
  glassCardCovers = true,
  initialArtist = null,
}) => {
  const [selectedArtist, setSelectedArtist] = useState<string | null>(() =>
    initialArtist ? initialArtist.name : null
  );
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortMode>('tracks');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (initialArtist) {
      setSelectedArtist(initialArtist.name);
    }
  }, [initialArtist]);

  const groups = useMemo<ArtistGroup[]>(() => {
    const map = new Map<string, Song[]>();
    songs.forEach((song) => {
      const artistName = song.artist?.trim() || (t.unknownArtist || 'Unknown');
      const existing = map.get(artistName);
      if (existing) {
        existing.push(song);
      } else {
        map.set(artistName, [song]);
      }
    });

    const list: ArtistGroup[] = Array.from(map.entries()).map(([name, artistSongs]) => {
      const uniqueAlbums = new Set(
        artistSongs
          .map((s) => s.album?.trim())
          .filter((a): a is string => Boolean(a))
      );
      const cover = artistSongs.find((s) => s.cover)?.cover || '';
      return {
        name,
        songs: artistSongs,
        albumsCount: uniqueAlbums.size,
        cover,
      };
    });

    return list.sort((a, b) => {
      if (sortBy === 'tracks') {
        const diff = b.songs.length - a.songs.length;
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
  }, [songs, sortBy, t.unknownArtist]);

  const activeGroup = useMemo(
    () => (selectedArtist ? groups.find((g) => g.name === selectedArtist) || null : null),
    [selectedArtist, groups]
  );

  // اگر آرتیست انتخاب شده هنوز آهنگ دارد، نمای تفصیلی آهنگ‌های همان آرتیست را نمایش بده
  if (selectedArtist && activeGroup) {
    return (
      <AllSongs
        songs={activeGroup.songs}
        playlists={playlists}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlaySongFromList={onPlaySongFromList}
        onCreatePlaylist={onCreatePlaylist}
        addToQueue={addToQueue}
        onDeleteSong={onDeleteSong}
        onUpdateSong={onUpdateSong}
        onAddSongToPlaylist={onAddSongToPlaylist}
        onToggleFavorite={onToggleFavorite}
        t={t}
        theme={theme}
        title={activeGroup.name}
        onBack={() => setSelectedArtist(null)}
        emptyMessage={t.noSongs}
        glassCardCovers={glassCardCovers}
      />
    );
  }

  const isRTL = language === 'fa';
  const hoverBg = theme.colors.surfaceHover || 'rgba(255, 255, 255, 0.08)';

  return (
    <div
      style={{
        flex: 1,
        padding: 'clamp(16px, 3vw, 36px) clamp(16px, 4vw, 40px) 130px',
        overflowY: 'auto',
        overflowX: 'hidden',
        direction: isRTL ? 'rtl' : 'ltr',
        boxSizing: 'border-box',
      }}
    >
      {/* هدر صفحه آرتیست‌ها */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '22px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'clamp(24px, 3.5vw, 32px)',
              fontWeight: '800',
              color: theme.colors.textPrimary,
              margin: 0,
              letterSpacing: '-0.4px',
            }}
          >
            {t.artistsTitle || t.artists || 'آرتیست‌ها'}
          </h1>
          <div
            style={{
              marginTop: '4px',
              fontSize: '13px',
              color: theme.colors.textSecondary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {groups.length} {t.artistsCountLabel || 'آرتیست'} · {songs.length} {t.tracksCount || 'آهنگ'}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {/* تغییر مرتب‌سازی */}
          <button
            type="button"
            onClick={() => setSortBy((prev) => (prev === 'tracks' ? 'name' : 'tracks'))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 13px',
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textPrimary,
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            <ArrowUpDown size={15} color={theme.colors.primary} />
            <span>{sortBy === 'tracks' ? (t.sortByTracks || 'تعداد آهنگ') : (t.sortArtist || 'نام')}</span>
          </button>

          {/* سوییچ نمایش گرید / لیست */}
          <div
            style={{
              display: 'flex',
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              padding: '3px',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label={t.viewGrid || 'Grid'}
              style={{
                padding: '6px 10px',
                borderRadius: theme.radius.sm,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'grid' ? theme.colors.primary + '22' : 'transparent',
                color: viewMode === 'grid' ? theme.colors.primary : theme.colors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label={t.viewList || 'List'}
              style={{
                padding: '6px 10px',
                borderRadius: theme.radius.sm,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'list' ? theme.colors.primary + '22' : 'transparent',
                color: viewMode === 'list' ? theme.colors.primary : theme.colors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* وضعیت خالی */}
      {groups.length === 0 ? (
        <div
          style={{
            padding: '56px 20px',
            textAlign: 'center',
            color: theme.colors.textSecondary,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            border: `1px dashed ${theme.colors.border}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Mic size={36} style={{ opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 500 }}>
            {t.noArtists || 'هنوز آرتیستی در کتابخانه وجود ندارد.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
            gap: '16px',
          }}
        >
          {groups.map((artist) => {
            const isHovered = hoveredId === artist.name;
            const isActiveArtist = currentSong && (currentSong.artist?.trim() || (t.unknownArtist || 'Unknown')) === artist.name;
            return (
              <div
                key={artist.name}
                onClick={() => setSelectedArtist(artist.name)}
                onMouseEnter={() => setHoveredId(artist.name)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  backgroundColor: isHovered
                    ? (theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.88)')
                    : theme.colors.surface,
                  backdropFilter: 'blur(26px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(26px) saturate(180%)',
                  borderRadius: theme.radius.xl || '22px',
                  padding: '18px 16px',
                  cursor: 'pointer',
                  border: `1px solid ${
                    isActiveArtist
                      ? theme.colors.primary
                      : isHovered
                      ? (theme.colors.borderLight || theme.colors.primary + '88')
                      : theme.colors.border
                  }`,
                  boxShadow: isHovered
                    ? `0 16px 36px rgba(0, 0, 0, 0.32), 0 0 20px ${theme.colors.glow || theme.colors.primary}28`
                    : (theme.isDark
                        ? '0 8px 24px rgba(0, 0, 0, 0.22)'
                        : '0 4px 14px rgba(0, 0, 0, 0.05)'),
                  transition: 'transform 0.22s cubic-bezier(0.2, 0, 0, 1), background-color 0.2s, border-color 0.2s',
                  transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '108px',
                    height: '108px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: `2px solid ${isActiveArtist ? theme.colors.primary : 'rgba(255, 255, 255, 0.18)'}`,
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                    flexShrink: 0,
                  }}
                >
                  <CoverImage
                    src={artist.cover}
                    alt={artist.name}
                    iconSize={36}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (artist.songs.length > 0) {
                        onPlaySongFromList(artist.songs[0], artist.songs);
                      }
                    }}
                    title={t.playAll || 'پخش همه'}
                    style={{
                      position: 'absolute',
                      bottom: '6px',
                      insetInlineEnd: '6px',
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: theme.colors.primary,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered ? 'scale(1)' : 'scale(0.85)',
                      transition: 'opacity 0.18s ease, transform 0.18s ease',
                      boxShadow: `0 4px 12px ${theme.colors.primary}66`,
                    }}
                  >
                    <Play size={16} fill="#ffffff" />
                  </button>
                </div>

                <h3
                  style={{
                    margin: '14px 0 4px 0',
                    fontSize: '15.5px',
                    fontWeight: 700,
                    color: isActiveArtist ? theme.colors.primary : theme.colors.textPrimary,
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {artist.name}
                </h3>

                <div
                  style={{
                    fontSize: '12.5px',
                    color: theme.colors.textSecondary,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {artist.songs.length} {t.tracksCount || 'آهنگ'}
                  {artist.albumsCount > 0 && ` · ${artist.albumsCount} ${t.albumsCountLabel || 'آلبوم'}`}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {groups.map((artist) => {
            const isHovered = hoveredId === artist.name;
            const isActiveArtist = currentSong && (currentSong.artist?.trim() || (t.unknownArtist || 'Unknown')) === artist.name;
            return (
              <div
                key={artist.name}
                onClick={() => setSelectedArtist(artist.name)}
                onMouseEnter={() => setHoveredId(artist.name)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '10px 16px',
                  backgroundColor: isHovered ? hoverBg : theme.colors.surface,
                  backdropFilter: 'blur(22px) saturate(170%)',
                  WebkitBackdropFilter: 'blur(22px) saturate(170%)',
                  border: `1px solid ${isActiveArtist ? theme.colors.primary : theme.colors.border}`,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'background-color 0.18s ease, border-color 0.18s ease',
                }}
              >
                <CoverImage
                  src={artist.cover}
                  alt={artist.name}
                  iconSize={20}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.18)',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: isActiveArtist ? theme.colors.primary : theme.colors.textPrimary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {artist.name}
                  </div>
                  <div
                    style={{
                      fontSize: '12.5px',
                      color: theme.colors.textSecondary,
                      marginTop: '2px',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {artist.songs.length} {t.tracksCount || 'آهنگ'}
                    {artist.albumsCount > 0 && ` · ${artist.albumsCount} ${t.albumsCountLabel || 'آلبوم'}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (artist.songs.length > 0) {
                      onPlaySongFromList(artist.songs[0], artist.songs);
                    }
                  }}
                  title={t.playAll || 'پخش همه'}
                  style={{
                    width: '36px',
                    height: '36px',
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
                  <Play size={16} fill="#ffffff" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
