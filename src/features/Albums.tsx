import React, { useEffect, useMemo, useState } from 'react';
import {
  Disc,
  Play,
  LayoutGrid,
  List,
  ArrowUpDown,
} from 'lucide-react';
import type { Song, Playlist } from '../types';
import { AllSongs } from './AllSongs';
import { CoverImage } from '../components/CoverImage';

interface AlbumsProps {
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
  initialAlbum?: { key: string; token: number } | null;
}

interface AlbumGroup {
  key: string;
  name: string;
  artist: string;
  year?: string;
  songs: Song[];
  cover: string;
}

type ViewMode = 'grid' | 'list';
type SortMode = 'name' | 'tracks' | 'year';

export const Albums: React.FC<AlbumsProps> = ({
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
  initialAlbum = null,
}) => {
  const [selectedAlbumKey, setSelectedAlbumKey] = useState<string | null>(() =>
    initialAlbum ? initialAlbum.key : null
  );
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortMode>('name');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (initialAlbum) {
      setSelectedAlbumKey(initialAlbum.key);
    }
  }, [initialAlbum]);

  const singlesLabel = t.singlesAlbum || 'Singles';

  const groups = useMemo<AlbumGroup[]>(() => {
    const map = new Map<string, Song[]>();
    songs.forEach((song) => {
      const albumName = song.album?.trim() || singlesLabel;
      const existing = map.get(albumName);
      if (existing) {
        existing.push(song);
      } else {
        map.set(albumName, [song]);
      }
    });

    const list: AlbumGroup[] = Array.from(map.entries()).map(([name, albumSongs]) => {
      const uniqueArtists = Array.from(
        new Set(albumSongs.map((s) => s.artist?.trim()).filter(Boolean))
      );
      const artistLabel =
        uniqueArtists.length === 0
          ? (t.unknownArtist || 'Unknown')
          : uniqueArtists.length === 1
          ? uniqueArtists[0]
          : `${uniqueArtists[0]} & ${uniqueArtists.length - 1}`;
      const year = albumSongs.find((s) => s.year)?.year;
      const cover = albumSongs.find((s) => s.cover)?.cover || '';
      return {
        key: name,
        name,
        artist: artistLabel,
        year,
        songs: albumSongs,
        cover,
      };
    });

    return list.sort((a, b) => {
      if (sortBy === 'tracks') {
        const diff = b.songs.length - a.songs.length;
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }
      if (sortBy === 'year') {
        const yA = parseInt(a.year || '0', 10) || 0;
        const yB = parseInt(b.year || '0', 10) || 0;
        if (yB !== yA) return yB - yA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [songs, sortBy, singlesLabel, t.unknownArtist]);

  const activeAlbum = useMemo(
    () => (selectedAlbumKey ? groups.find((g) => g.key === selectedAlbumKey) || null : null),
    [selectedAlbumKey, groups]
  );

  if (selectedAlbumKey && activeAlbum) {
    return (
      <AllSongs
        songs={activeAlbum.songs}
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
        title={activeAlbum.name}
        onBack={() => setSelectedAlbumKey(null)}
        emptyMessage={t.noSongs}
        glassCardCovers={glassCardCovers}
      />
    );
  }

  const isRTL = language === 'fa';
  const hoverBg = theme.colors.surfaceHover || 'rgba(255, 255, 255, 0.08)';

  const cycleSort = () => {
    setSortBy((prev) => (prev === 'name' ? 'tracks' : prev === 'tracks' ? 'year' : 'name'));
  };

  const sortLabel =
    sortBy === 'tracks'
      ? (t.sortByTracks || 'تعداد آهنگ')
      : sortBy === 'year'
      ? (t.sortByYear || 'سال انتشار')
      : (t.album || 'آلبوم');

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
      {/* هدر صفحه آلبوم‌ها */}
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
            {t.albumsTitle || t.albums || 'آلبوم‌ها'}
          </h1>
          <div
            style={{
              marginTop: '4px',
              fontSize: '13px',
              color: theme.colors.textSecondary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {groups.length} {t.albumsCountLabel || 'آلبوم'} · {songs.length} {t.tracksCount || 'آهنگ'}
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
            onClick={cycleSort}
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
            <span>{sortLabel}</span>
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
          <Disc size={36} style={{ opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 500 }}>
            {t.noAlbums || 'هنوز آلبومی در کتابخانه وجود ندارد.'}
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
          {groups.map((album) => {
            const isHovered = hoveredId === album.key;
            const currentAlbumKey = currentSong ? (currentSong.album?.trim() || singlesLabel) : null;
            const isActiveAlbum = currentAlbumKey === album.key;
            return (
              <div
                key={album.key}
                onClick={() => setSelectedAlbumKey(album.key)}
                onMouseEnter={() => setHoveredId(album.key)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  backgroundColor: isHovered
                    ? (theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.88)')
                    : theme.colors.surface,
                  backdropFilter: 'blur(26px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(26px) saturate(180%)',
                  borderRadius: theme.radius.xl || '22px',
                  padding: '14px',
                  cursor: 'pointer',
                  border: `1px solid ${
                    isActiveAlbum
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
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    borderRadius: theme.radius.md || '14px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.28)',
                  }}
                >
                  <CoverImage
                    src={album.cover}
                    alt={album.name}
                    iconSize={40}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (album.songs.length > 0) {
                        onPlaySongFromList(album.songs[0], album.songs);
                      }
                    }}
                    title={t.playAll || 'پخش همه'}
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      insetInlineEnd: '10px',
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
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered ? 'scale(1)' : 'scale(0.85)',
                      transition: 'opacity 0.18s ease, transform 0.18s ease',
                      boxShadow: `0 4px 14px ${theme.colors.primary}66`,
                    }}
                  >
                    <Play size={17} fill="#ffffff" />
                  </button>
                </div>

                <h3
                  style={{
                    margin: '12px 0 3px 0',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: isActiveAlbum ? theme.colors.primary : theme.colors.textPrimary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {album.name}
                </h3>

                <div
                  style={{
                    fontSize: '12.5px',
                    color: theme.colors.textSecondary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {album.artist}
                  {album.year ? ` · ${album.year}` : ''}
                  {` · ${album.songs.length} ${t.tracksCount || 'آهنگ'}`}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {groups.map((album) => {
            const isHovered = hoveredId === album.key;
            const currentAlbumKey = currentSong ? (currentSong.album?.trim() || singlesLabel) : null;
            const isActiveAlbum = currentAlbumKey === album.key;
            return (
              <div
                key={album.key}
                onClick={() => setSelectedAlbumKey(album.key)}
                onMouseEnter={() => setHoveredId(album.key)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '10px 16px',
                  backgroundColor: isHovered ? hoverBg : theme.colors.surface,
                  backdropFilter: 'blur(22px) saturate(170%)',
                  WebkitBackdropFilter: 'blur(22px) saturate(170%)',
                  border: `1px solid ${isActiveAlbum ? theme.colors.primary : theme.colors.border}`,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'background-color 0.18s ease, border-color 0.18s ease',
                }}
              >
                <CoverImage
                  src={album.cover}
                  alt={album.name}
                  iconSize={20}
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '10px',
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
                      color: isActiveAlbum ? theme.colors.primary : theme.colors.textPrimary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {album.name}
                  </div>
                  <div
                    style={{
                      fontSize: '12.5px',
                      color: theme.colors.textSecondary,
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {album.artist}
                    {album.year ? ` · ${album.year}` : ''}
                    {` · ${album.songs.length} ${t.tracksCount || 'آهنگ'}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (album.songs.length > 0) {
                      onPlaySongFromList(album.songs[0], album.songs);
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
