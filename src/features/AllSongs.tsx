import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  MoreHorizontal,
  ListPlus,
  Trash2,
  CheckSquare,
  ArrowUpDown,
  Play,
  Edit2,
  FolderPlus,
  Check,
  Heart,
  ArrowLeft,
} from 'lucide-react';
import type { Song, Playlist } from '../types';
import { EditSongModal } from '../components/EditSongModal';
import { CoverImage } from '../components/CoverImage';
import { withAlpha } from '../utils/color';

// ================= اینترفیس پراپ‌ها =================

interface AllSongsProps {
  songs: Song[];
  playlists: Playlist[];
  currentSong: Song | null;
  isPlaying?: boolean;
  onPlaySongFromList: (song: Song, list: Song[]) => void;
  onCreatePlaylist?: (name: string, selectedSongs: Song[]) => void;
  addToQueue: (song: Song) => void;
  onDeleteSong: (id: string) => void;
  onUpdateSong: (updatedSong: Song) => void;
  onAddSongToPlaylist: (playlistId: string, song: Song) => void;
  onToggleFavorite?: (id: string) => void;
  t: any;
  searchTerm?: string;
  theme: any;
  title?: string;
  onBack?: () => void;
  emptyMessage?: string;
  glassCardCovers?: boolean;
  headerActions?: React.ReactNode;
  onBulkDeleteSongs?: (ids: string[]) => void;
  deleteActionLabel?: string;
}

// ================= کامپوننت اصلی =================

export const AllSongs = ({
  songs,
  playlists,
  currentSong,
  isPlaying = false,
  onPlaySongFromList,
  onCreatePlaylist: _onCreatePlaylist,
  addToQueue,
  onDeleteSong,
  onUpdateSong,
  onAddSongToPlaylist,
  onToggleFavorite,
  t,
  searchTerm = '',
  theme,
  title,
  onBack,
  emptyMessage,
  glassCardCovers = true,
  headerActions,
  onBulkDeleteSongs,
  deleteActionLabel,
}: AllSongsProps) => {
  // استیت‌های انتخاب
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // استیت‌های منوها
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    right: number;
  }>({ top: 0, right: 16 });
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'artist'>(
    'date'
  );

  // استیت‌های UI
  const [hoveredSongId, setHoveredSongId] = useState<string | null>(
    null
  );
  const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(
    null
  );

  // استیت‌های مودال
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [playlistTargetSongIds, setPlaylistTargetSongIds] = useState<string[]>([]);
  const [targetPlaylistId, setTargetPlaylistId] = useState<
    string | null
  >(null);

  // رفرنس‌ها
  const topMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const songMenuRefs = useRef<{
    [key: string]: HTMLDivElement | null;
  }>({});
  const activeSongDropdownRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // ================= افکت‌ها =================

  /** بستن منوها هنگام کلیک در بیرون */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isTopMenuOpen &&
        topMenuRef.current &&
        !topMenuRef.current.contains(event.target as Node)
      ) {
        setIsTopMenuOpen(false);
      }
      if (
        isSortMenuOpen &&
        sortMenuRef.current &&
        !sortMenuRef.current.contains(event.target as Node)
      ) {
        setIsSortMenuOpen(false);
      }
      if (activeMenuId) {
        const menuRef = songMenuRefs.current[activeMenuId];
        const clickedTrigger = menuRef?.contains(event.target as Node);
        const clickedDropdown = activeSongDropdownRef.current?.contains(event.target as Node);
        if (!clickedTrigger && !clickedDropdown) {
          setActiveMenuId(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId, isSortMenuOpen, isTopMenuOpen]);

  /** بستن منوی سه‌نقطه هنگام اسکرول، تغییر اندازه یا فشردن Escape */
  useEffect(() => {
    if (!activeMenuId) return;
    const handleClose = (e: Event) => {
      if (
        e.type === 'scroll' &&
        activeSongDropdownRef.current &&
        e.target instanceof Node &&
        activeSongDropdownRef.current.contains(e.target)
      ) {
        return;
      }
      setActiveMenuId(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMenuId(null);
    };
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMenuId]);

  // ================= توابع کمکی =================

  /** تبدیل ثانیه به فرمت دقیقه:ثانیه */
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ================= منطق داده‌ها =================

  /** فیلتر و مرتب‌سازی آهنگ‌ها (مموایز شده برای جلوگیری از پردازش مجدد هنگام هاور ماوس) */
  const filteredAndSortedSongs = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return songs
      .filter(
        (song) =>
          song.name.toLowerCase().includes(q) ||
          song.artist.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (sortBy === 'date') return b.addedAt - a.addedAt;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
        return 0;
      });
  }, [songs, searchTerm, sortBy]);

  // ================= توابع کنترلی =================

  /** انتخاب یا لغو انتخاب یک آهنگ */
  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!isSelectMode) return;
    setSelectedSongs((prev) => {
      const isAlready = prev.includes(id);
      const newSelection = isAlready
        ? prev.filter((s) => s !== id)
        : [...prev, id];
      if (newSelection.length === 0) setIsSelectMode(false);
      return newSelection;
    });
  };

  /** انتخاب همه یا لغو انتخاب همه */
  const handleSelectAll = () => {
    if (selectedSongs.length === filteredAndSortedSongs.length) {
      setSelectedSongs([]);
      setIsSelectMode(false);
    } else {
      setSelectedSongs(filteredAndSortedSongs.map((s) => s.id));
      setIsSelectMode(true);
    }
  };

  /** فعال کردن حالت انتخاب از منوی سه‌نقطه */
  const handleSelectSingleSong = (id: string) => {
    setIsSelectMode(true);
    setSelectedSongs((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : [...prev, id]
    );
    setActiveMenuId(null);
  };

  /** خروج از حالت انتخاب */
  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedSongs([]);
    setIsTopMenuOpen(false);
  };

  /** حذف یک آهنگ با تأییدیه */
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm(t.deleteConfirm)) {
      onDeleteSong(id);
      setActiveMenuId(null);
    }
  };

  /** حذف گروهی آهنگ‌های انتخاب شده */
  const handleBulkDelete = () => {
    if (window.confirm(t.deleteConfirm)) {
      if (onBulkDeleteSongs) {
        onBulkDeleteSongs(selectedSongs);
      } else {
        selectedSongs.forEach((id) => onDeleteSong(id));
      }
      exitSelectMode();
    }
  };

  /** افزودن گروهی به صف */
  const handleBulkAddToQueue = () => {
    const toAdd = songs.filter((s) => selectedSongs.includes(s.id));
    toAdd.forEach((s) => addToQueue(s));
    exitSelectMode();
  };

  /** باز کردن مودال انتخاب پلی‌لیست */
  const handleOpenPlaylistModal = (songId?: string) => {
    const ids = songId ? [songId] : selectedSongs;
    if (ids.length === 0) return;
    setPlaylistTargetSongIds(ids);
    setTargetPlaylistId(null);
    setIsPlaylistModalOpen(true);
    setActiveMenuId(null);
    setIsTopMenuOpen(false);
  };

  /** بستن مودال انتخاب پلی‌لیست */
  const closePlaylistModal = () => {
    setIsPlaylistModalOpen(false);
    setTargetPlaylistId(null);
    setPlaylistTargetSongIds([]);
  };

  /** تایید نهایی افزودن به پلی‌لیست */
  const handleConfirmAddToPlaylist = () => {
    if (!targetPlaylistId) return;
    const targetIds = playlistTargetSongIds.length > 0 ? playlistTargetSongIds : selectedSongs;
    const toAdd = songs.filter((s) => targetIds.includes(s.id));
    toAdd.forEach((s) =>
      onAddSongToPlaylist(targetPlaylistId, s)
    );
    closePlaylistModal();
    if (isSelectMode) exitSelectMode();
  };

  /** محاسبه موقعیت منوی سه‌نقطه در ویوپورت با در نظر گرفتن نوار بالا و پلیر شناور پایین */
  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    songId: string
  ) => {
    e.stopPropagation();
    if (activeMenuId === songId) {
      setActiveMenuId(null);
      return;
    }
    const buttonRect = e.currentTarget.getBoundingClientRect();
    const estimatedMenuHeight = onToggleFavorite ? 245 : 208;
    const spaceBelow = window.innerHeight - buttonRect.bottom - 115;
    const spaceAbove = buttonRect.top - 80;
    const openUp = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;
    const right = Math.max(12, window.innerWidth - buttonRect.right);

    if (openUp) {
      setMenuPosition({
        bottom: Math.max(12, window.innerHeight - buttonRect.top + 6),
        right,
      });
    } else {
      const rawTop = buttonRect.bottom + 6;
      const maxTop = Math.max(12, window.innerHeight - estimatedMenuHeight - 16);
      setMenuPosition({
        top: Math.min(rawTop, maxTop),
        right,
      });
    }
    setActiveMenuId(songId);
  };

  const activeMenuSong = useMemo(
    () =>
      activeMenuId
        ? filteredAndSortedSongs.find((s) => s.id === activeMenuId) ?? null
        : null,
    [activeMenuId, filteredAndSortedSongs]
  );

  const menuHoverBg = theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.07)';
  const dangerHoverBg = withAlpha(theme.colors.danger || '#ff453a', 0.15);

  // ================= رندر =================
  return (
    <div ref={pageRef} style={styles.container}>
      {/* هدر دسته‌بندی در صورت باز شدن از بخش خانه */}
      {title && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '18px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  background: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.textPrimary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '7px 14px',
                  borderRadius: theme.radius.md,
                  transition: 'transform 0.2s, background-color 0.2s, scale 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <ArrowLeft size={16} /> {t.back}
              </button>
            )}
            <h1
              style={{
                fontSize: 'clamp(20px, 2.5vw, 26px)',
                fontWeight: '800',
                color: theme.colors.textPrimary,
                margin: 0,
              }}
            >
              {title}
            </h1>
            <span
              style={{
                fontSize: '13px',
                color: theme.colors.textSecondary,
                fontWeight: '500',
              }}
            >
              ({filteredAndSortedSongs.length} {t.tracksCount || 'آهنگ'})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {headerActions}
            {filteredAndSortedSongs.length > 0 && !isSelectMode && (
              <button
                onClick={() =>
                  onPlaySongFromList(
                    filteredAndSortedSongs[0],
                    filteredAndSortedSongs
                  )
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: theme.radius.md,
                  border: 'none',
                  backgroundColor: theme.colors.primary,
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'opacity 0.2s',
                }}
              >
                <Play size={15} fill="#fff" />
                <span>{t.playAll || 'پخش همه'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* نوار دکمه‌های بالا */}
      <div style={styles.headerActions}>
        <div style={{ marginInlineEnd: 'auto' }}>
          {isSelectMode && (
            <button
              onClick={handleSelectAll}
              style={styles.actionBtn(theme, true)}
            >
              {selectedSongs.length ===
                filteredAndSortedSongs.length &&
              filteredAndSortedSongs.length > 0
                ? t.deselectAll || 'Cancel All'
                : t.selectAll || 'Select All'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {isSelectMode && (
            <div style={{ position: 'relative' }} ref={topMenuRef}>
              <button
                onClick={() => setIsTopMenuOpen(!isTopMenuOpen)}
                style={styles.actionBtn(theme, isTopMenuOpen)}
              >
                <MoreHorizontal size={18} />{' '}
                {t.more || 'More'}
              </button>

              {isTopMenuOpen && (
                <div style={styles.dropdown(theme)}>
                  <button
                    onClick={() => handleOpenPlaylistModal()}
                    style={menuItemStyle(theme)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = menuHoverBg)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    <FolderPlus size={16} />{' '}
                    {t.addToPlaylist || 'Add to Playlist'}
                  </button>
                  <button
                    onClick={handleBulkAddToQueue}
                    style={menuItemStyle(theme)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = menuHoverBg)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    <ListPlus size={16} /> {t.addToQueue}
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    style={{
                      ...menuItemStyle(theme),
                      color: theme.colors.danger,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = dangerHoverBg)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    <Trash2 size={16} /> {deleteActionLabel || t.deleteSong}
                  </button>
                </div>
              )}
            </div>
          )}

          {songs.length > 0 && (
            <div style={{ position: 'relative' }} ref={sortMenuRef}>
              <button
                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                style={styles.actionBtn(theme, isSortMenuOpen)}
              >
                <ArrowUpDown size={16} /> {t.sortBy}
              </button>
              {isSortMenuOpen && (
                <div style={styles.dropdown(theme, '160px')}>
                  {['date', 'name', 'artist'].map((type) => {
                    const isActive = sortBy === type;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setSortBy(type as any);
                          setIsSortMenuOpen(false);
                        }}
                        style={menuItemStyle(theme, isActive)}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = menuHoverBg;
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isActive
                            ? withAlpha(theme.colors.primary, 0.16)
                            : 'transparent';
                        }}
                      >
                        {type === 'date'
                          ? t.sortDate
                          : type === 'name'
                          ? t.sortName
                          : t.sortArtist}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* لیست آهنگ‌ها */}
      {filteredAndSortedSongs.length === 0 ? (
        <div
          style={{
            padding: '50px 20px',
            textAlign: 'center',
            color: theme.colors.textSecondary,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            border: `1px dashed ${theme.colors.border}`,
            margin: '20px 0',
          }}
        >
          <p style={{ margin: 0, fontSize: '15px', fontWeight: '500' }}>
            {emptyMessage || (songs.length === 0 ? t.noSongs : t.notFound)}
          </p>
        </div>
      ) : (
        <div
          style={{
            ...styles.listContainer,
            gap:
              theme.display?.listDensity === 'compact'
                ? '5px'
                : theme.display?.listDensity === 'spacious'
                ? '13px'
                : '8px',
          }}
        >
          {filteredAndSortedSongs.map((song) => {
            const isHovered = hoveredSongId === song.id;
            const isSelected = selectedSongs.includes(song.id);
            const isMenuHovered = hoveredMenuId === song.id;
            const isMenuOpen = activeMenuId === song.id;
            const isCurrentSong = currentSong?.id === song.id;
            const isTrackPlaying = isCurrentSong && isPlaying;

            return (
              <div
                key={song.id}
                onMouseEnter={() => setHoveredSongId(song.id)}
                onMouseLeave={() => {
                  setHoveredSongId(null);
                  setHoveredMenuId(null);
                }}
                onClick={(e) =>
                  isSelectMode
                    ? toggleSelect(e, song.id)
                    : onPlaySongFromList(
                        song,
                        filteredAndSortedSongs
                      )
                }
                style={styles.songRow(
                  theme,
                  isSelected,
                  isHovered,
                  isMenuOpen,
                  isCurrentSong,
                  glassCardCovers
                )}
              >
                {/* پس‌زمینه کاور شیشه‌ای روی کارت آهنگ (مشابه نمونه ارسالی کاربر) */}
                {glassCardCovers && song.cover && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: theme.radius?.lg || '16px',
                      overflow: 'hidden',
                      zIndex: 0,
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${song.cover})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(12px) brightness(0.65) saturate(180%)',
                        transform: 'scale(1.25)',
                        opacity: theme.isDark ? 0.65 : 0.45,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: theme.isDark
                          ? 'linear-gradient(90deg, rgba(14, 11, 26, 0.72) 0%, rgba(22, 18, 40, 0.44) 50%, rgba(14, 11, 26, 0.72) 100%)'
                          : 'linear-gradient(90deg, rgba(255, 255, 255, 0.82) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.82) 100%)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                      }}
                    />
                  </div>
                )}

                {isSelectMode && (
                  <div
                    onClick={(e) =>
                      toggleSelect(e, song.id)
                    }
                    style={{
                      ...styles.checkbox(
                        theme,
                        isSelected
                      ),
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {isSelected && (
                      <Check size={14} color="#fff" />
                    )}
                  </div>
                )}

                <div
                  style={{
                    position: 'relative',
                    width: '46px',
                    height: '46px',
                    minWidth: '46px',
                    minHeight: '46px',
                    aspectRatio: '1 / 1',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    zIndex: 1,
                    border: '1px solid rgba(255, 255, 255, 0.22)',
                    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  <CoverImage
                    src={song.cover}
                    alt=""
                    iconSize={20}
                    style={{
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      aspectRatio: '1 / 1',
                      objectFit: 'cover',
                      borderRadius: '10px',
                    }}
                  />

                  {isCurrentSong && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        background: 'transparent',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: '2.5px',
                          height: '15px',
                          filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.9))',
                        }}
                      >
                        <motion.span
                          animate={
                            isTrackPlaying
                              ? { scaleY: [0.25, 0.95, 0.35, 0.8, 0.25] }
                              : { scaleY: 0.3 }
                          }
                          transition={
                            isTrackPlaying
                              ? {
                                  duration: 0.75,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                }
                              : { duration: 0.25 }
                          }
                          style={{
                            width: '2.5px',
                            height: '15px',
                            backgroundColor: '#ffffff',
                            borderRadius: '1.5px',
                            transformOrigin: 'bottom',
                            display: 'block',
                          }}
                        />
                        <motion.span
                          animate={
                            isTrackPlaying
                              ? { scaleY: [0.6, 0.25, 1, 0.45, 0.9, 0.6] }
                              : { scaleY: 0.55 }
                          }
                          transition={
                            isTrackPlaying
                              ? {
                                  duration: 0.65,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                  delay: 0.1,
                                }
                              : { duration: 0.25 }
                          }
                          style={{
                            width: '2.5px',
                            height: '15px',
                            backgroundColor: '#ffffff',
                            borderRadius: '1.5px',
                            transformOrigin: 'bottom',
                            display: 'block',
                          }}
                        />
                        <motion.span
                          animate={
                            isTrackPlaying
                              ? { scaleY: [0.35, 0.85, 0.2, 0.95, 0.4, 0.35] }
                              : { scaleY: 0.35 }
                          }
                          transition={
                            isTrackPlaying
                              ? {
                                  duration: 0.8,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                  delay: 0.2,
                                }
                              : { duration: 0.25 }
                          }
                          style={{
                            width: '2.5px',
                            height: '15px',
                            backgroundColor: '#ffffff',
                            borderRadius: '1.5px',
                            transformOrigin: 'bottom',
                            display: 'block',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{ flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}
                >
                  <div
                    style={{
                      ...styles.songTitle(
                        theme,
                        isSelected
                      ),
                      color: isCurrentSong
                        ? theme.colors.primary
                        : isSelected
                        ? theme.colors.primary
                        : theme.colors.textPrimary,
                    }}
                  >
                    {song.name}
                  </div>
                  <div style={styles.songArtist(theme)}>
                    {song.artist}{' '}
                    {song.album
                      ? `• ${song.album}`
                      : ''}
                  </div>
                </div>

                <div style={{ ...styles.duration(theme), position: 'relative', zIndex: 1 }}>
                  {formatTime(song.duration || 0)}
                </div>

                {!isSelectMode && (
                  <div
                    ref={(el) => {
                      songMenuRefs.current[song.id] =
                        el;
                    }}
                    style={{
                      position: 'relative',
                      zIndex: isMenuOpen ? 999 : 1,
                    }}
                    onMouseEnter={() =>
                      setHoveredMenuId(song.id)
                    }
                    onMouseLeave={() =>
                      setHoveredMenuId(null)
                    }
                  >
                    <button
                      onClick={(e) =>
                        handleOpenMenu(e, song.id)
                      }
                      style={styles.moreBtn(
                        theme,
                        isMenuHovered
                      )}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* منوی سه‌نقطه آهنگ به صورت Portal برای جلوگیری از بریده شدن در لیست‌های کوتاه */}
      {activeMenuSong &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={activeSongDropdownRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              ...styles.songMenu(theme),
              ...menuPosition,
              direction: t.deleteSong === 'حذف آهنگ' ? 'rtl' : 'ltr',
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectSingleSong(activeMenuSong.id);
              }}
              style={menuItemStyle(theme)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = menuHoverBg)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
            >
              <CheckSquare size={16} />{' '}
              {t.select || 'Select'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingSong(activeMenuSong);
                setIsEditModalOpen(true);
                setActiveMenuId(null);
              }}
              style={menuItemStyle(theme)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = menuHoverBg)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
            >
              <Edit2 size={16} />{' '}
              {t.editSong || 'Edit Song'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPlaylistModal(activeMenuSong.id);
              }}
              style={menuItemStyle(theme)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = menuHoverBg)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
            >
              <FolderPlus size={16} />{' '}
              {t.addToPlaylist || 'Add to Playlist'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToQueue(activeMenuSong);
                setActiveMenuId(null);
              }}
              style={menuItemStyle(theme)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = menuHoverBg)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
            >
              <ListPlus size={16} />{' '}
              {t.addToQueue}
            </button>
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(activeMenuSong.id);
                  setActiveMenuId(null);
                }}
                style={menuItemStyle(theme)}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = menuHoverBg)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <Heart
                  size={16}
                  fill={activeMenuSong.isFavorite ? '#ff3b30' : 'none'}
                  color={
                    activeMenuSong.isFavorite
                      ? '#ff3b30'
                      : theme.colors.textPrimary
                  }
                />{' '}
                {activeMenuSong.isFavorite
                  ? t.removeFromFavorites || 'Remove from Favourites'
                  : t.addToFavorites || 'Add to Favourites'}
              </button>
            )}
            <button
              onClick={(e) => handleDelete(e, activeMenuSong.id)}
              style={{
                ...menuItemStyle(theme),
                color: theme.colors.danger,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = dangerHoverBg)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
            >
              <Trash2 size={16} />{' '}
              {deleteActionLabel || t.deleteSong}
            </button>
          </div>,
          document.body
        )}

      {/* مودال ویرایش */}
      <EditSongModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        song={editingSong}
        onSave={(updated) => onUpdateSong(updated)}
        theme={theme}
        t={t}
      />

      {/* مودال انتخاب پلی‌لیست */}
      {isPlaylistModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={closePlaylistModal}
            style={styles.modalOverlay}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={styles.modalBox(theme)}
            >
              <h3
                style={{
                  margin: '0 0 20px 0',
                  color: theme.colors.textPrimary,
                  textAlign: 'center',
                }}
              >
                {t.selectPlaylist || 'انتخاب پلی‌لیست'}
              </h3>
              <div style={styles.modalList}>
                {playlists.length === 0 ? (
                  <p
                    style={{
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {t.noPlaylists ||
                      'هیچ پلی‌لیستی وجود ندارد.'}
                  </p>
                ) : (
                  playlists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() =>
                        setTargetPlaylistId(pl.id)
                      }
                      style={{
                        ...styles.modalItem(theme),
                        borderColor:
                          targetPlaylistId === pl.id
                            ? theme.colors.primary
                            : theme.colors.border,
                        backgroundColor:
                          targetPlaylistId === pl.id
                            ? `${theme.colors.primary}20`
                            : theme.colors.surface,
                      }}
                    >
                      {pl.name}{' '}
                      <span
                        style={{
                          fontSize: 12,
                          color:
                            theme.colors
                              .textSecondary,
                        }}
                      >
                        ({pl.songs.length}{' '}
                        {t.songs || 'آهنگ'})
                      </span>
                    </button>
                  ))
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '20px',
                }}
              >
                <button
                  onClick={closePlaylistModal}
                  style={styles.modalBtn(theme, false)}
                >
                  {t.cancel || 'لغو'}
                </button>
                <button
                  onClick={handleConfirmAddToPlaylist}
                  disabled={!targetPlaylistId}
                  style={styles.modalBtn(
                    theme,
                    true,
                    !targetPlaylistId
                  )}
                >
                  {t.add || 'افزودن'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

// ================= استایل‌های مجزا =================

/** استایل آیتم‌های منو */
const menuItemStyle = (
  theme: any,
  active: boolean = false
) => ({
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  textAlign: 'start' as const,
  border: 'none',
  backgroundColor: active ? withAlpha(theme.colors.primary, 0.16) : 'transparent',
  color: active
    ? theme.colors.primary
    : theme.colors.textPrimary,
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  fontSize: '13px',
  fontWeight: active ? 600 : 500,
  transition: 'background-color 0.12s ease, scale 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
  cursor: 'pointer',
});

/** مجموعه استایل‌های داخلی */
const styles = {
  container: {
    flex: 1,
    minHeight: '100%',
    boxSizing: 'border-box' as const,
    padding:
      'clamp(12px, 2vw, 24px) clamp(16px, 4vw, 40px) 130px',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'clamp(16px, 3vw, 24px)',
    minHeight: '34px',
    position: 'relative' as const,
    zIndex: 20,
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  actionBtn: (theme: any, active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: theme.radius.md,
    border: active
      ? 'none'
      : `1px solid ${theme.colors.border}`,
    backgroundColor: active
      ? theme.colors.primary
      : theme.colors.surface,
    color: active ? '#fff' : theme.colors.textPrimary,
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    height: '34px',
    transition: 'all 0.2s',
  }),
  dropdown: (
    theme: any,
    minWidth: string = '185px'
  ) => ({
    position: 'absolute' as const,
    top: 'calc(100% + 6px)',
    insetInlineEnd: 0,
    padding: '5px',
    backgroundColor: theme.isDark
      ? withAlpha(theme.colors.surfaceSolid, 0.96)
      : 'rgba(255, 255, 255, 0.96)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.42)',
    zIndex: 50,
    minWidth,
    overflow: 'hidden',
  }),
  songRow: (
    theme: any,
    isSelected: boolean,
    isHovered: boolean,
    isMenuOpen: boolean,
    isCurrentSong?: boolean,
    glassCardCovers?: boolean,
  ) => ({
    display: 'flex',
    alignItems: 'center',
    direction: 'ltr' as const,
    textAlign: 'left' as const,
    gap:
      theme.display?.listDensity === 'compact'
        ? '10px'
        : theme.display?.listDensity === 'spacious'
        ? '16px'
        : '14px',
    padding:
      theme.display?.listDensity === 'compact'
        ? '5px 12px'
        : theme.display?.listDensity === 'spacious'
        ? '12px 16px'
        : '8px 14px',
    borderRadius: theme.radius?.lg || '16px',
    cursor: 'pointer',
    position: 'relative' as const,
    transition: 'background-color 0.2s cubic-bezier(0.2, 0, 0, 1), border-color 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1)',
    backdropFilter: `blur(${theme.display?.glassBlur ?? 24}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${theme.display?.glassBlur ?? 24}px) saturate(180%)`,
    backgroundColor: isSelected
      ? `${theme.colors.primary}28`
      : isCurrentSong
      ? `${theme.colors.primary}20`
      : isHovered
      ? (theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.88)')
      : glassCardCovers
      ? (theme.isDark ? 'rgba(18, 14, 32, 0.45)' : 'rgba(255, 255, 255, 0.52)')
      : (theme.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.58)'),
    border: `1px solid ${
      isSelected || isCurrentSong
        ? theme.colors.primary
        : isHovered
        ? (theme.isDark ? 'rgba(255, 255, 255, 0.26)' : 'rgba(0, 0, 0, 0.18)')
        : (theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)')
    }`,
    boxShadow: isCurrentSong
      ? `0 0 18px ${theme.colors.primary}40`
      : isHovered
      ? (theme.isDark ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 14px rgba(0, 0, 0, 0.08)')
      : 'none',
    zIndex: isMenuOpen ? 100 : isHovered ? 2 : 1,
  }),
  checkbox: (theme: any, isSelected: boolean) => ({
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    border: isSelected
      ? `2px solid ${theme.colors.primary}`
      : `2px solid ${theme.colors.textSecondary}`,
    backgroundColor: isSelected
      ? theme.colors.primary
      : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s',
    cursor: 'pointer',
  }),
  coverImage: {
    width: '46px',
    height: '46px',
    minWidth: '46px',
    minHeight: '46px',
    aspectRatio: '1 / 1',
    display: 'block',
    borderRadius: '10px',
    objectFit: 'cover' as const,
    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.22)',
    filter: 'none',
  },
  playOverlay: {
    position: 'absolute' as const,
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songTitle: (theme: any, isSelected: boolean) => ({
    fontWeight: '600',
    fontSize: 'clamp(13px, 1.4vw, 15px)',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textAlign: 'left' as const,
    textShadow: theme.isDark ? '0 1px 4px rgba(0, 0, 0, 0.9)' : '0 1px 2px rgba(255, 255, 255, 0.8)',
    color: isSelected
      ? theme.colors.primary
      : theme.colors.textPrimary,
  }),
  songArtist: (theme: any) => ({
    fontSize: 'clamp(11px, 1.2vw, 13px)',
    color: theme.isDark ? 'rgba(255, 255, 255, 0.72)' : theme.colors.textSecondary,
    marginTop: '2px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textAlign: 'left' as const,
    textShadow: theme.isDark ? '0 1px 3px rgba(0, 0, 0, 0.8)' : 'none',
  }),
  duration: (theme: any) => ({
    fontSize: '12px',
    color: theme.colors.textSecondary,
    marginInlineEnd: '-2px',
    flexShrink: 0,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: '1',
    transform: 'translateY(2px)',
  }),
  moreBtn: (theme: any, isHovered: boolean) => ({
    background: isHovered
      ? (theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0,0,0,0.06)')
      : 'none',
    border: isHovered
      ? `1px solid ${theme.colors.border}`
      : 'none',
    color: theme.colors.textSecondary,
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  }),
  songMenu: (theme: any) => ({
    position: 'fixed' as const,
    padding: '5px',
    backgroundColor: theme.isDark
      ? withAlpha(theme.colors.surfaceSolid, 0.96)
      : 'rgba(255, 255, 255, 0.96)',
    backdropFilter: 'blur(26px) saturate(180%)',
    WebkitBackdropFilter: 'blur(26px) saturate(180%)',
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.hard,
    zIndex: 99999,
    minWidth: '188px',
    maxWidth: 'calc(100vw - 24px)',
    maxHeight: 'calc(100vh - 24px)',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    fontFamily: theme.fonts?.main,
  }),
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999999,
    padding: 20,
    boxSizing: 'border-box' as const,
  },
  modalBox: (theme: any) => ({
    backgroundColor: theme.isDark
      ? withAlpha(theme.colors.surfaceSolid, 0.94)
      : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(28px) saturate(180%)',
    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
    padding: 24,
    borderRadius: theme.radius.xl || '22px',
    width: '100%',
    maxWidth: 400,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
  }),
  modalList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    maxHeight: '40vh',
    overflowY: 'auto' as const,
  },
  modalItem: (theme: any) => ({
    width: '100%',
    padding: '12px 16px',
    textAlign: 'start' as const,
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    cursor: 'pointer',
    color: theme.colors.textPrimary,
    transition: 'all 0.2s',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
  modalBtn: (
    theme: any,
    primary: boolean,
    disabled: boolean = false
  ) => ({
    flex: 1,
    padding: '10px',
    borderRadius: theme.radius.md,
    border: primary
      ? 'none'
      : `1px solid ${theme.colors.border}`,
    backgroundColor: primary
      ? disabled
        ? theme.colors.border
        : theme.colors.primary
      : 'transparent',
    color: primary
      ? disabled
        ? theme.colors.textSecondary
        : '#fff'
      : theme.colors.textPrimary,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600,
  }),
};