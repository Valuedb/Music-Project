import { useState, useEffect, useRef } from 'react';
import {
  MoreVertical,
  ListPlus,
  Trash2,
  CheckSquare,
  ArrowUpDown,
  Play,
  Edit2,
  FolderPlus,
  Check,
  MoreHorizontal,
} from 'lucide-react';
import type { Song, Playlist } from '../types';
import { EditSongModal } from '../components/EditSongModal';

// ================= اینترفیس پراپ‌ها =================

interface AllSongsProps {
  songs: Song[];
  playlists: Playlist[];
  currentSong: Song | null;
  onPlaySongFromList: (song: Song, list: Song[]) => void;
  onCreatePlaylist: (name: string, selectedSongs: Song[]) => void;
  addToQueue: (song: Song) => void;
  onDeleteSong: (id: string) => void;
  onUpdateSong: (updatedSong: Song) => void;
  onAddSongToPlaylist: (playlistId: string, song: Song) => void;
  t: any;
  searchTerm: string;
  theme: any;
}

// ================= کامپوننت اصلی =================

export const AllSongs = ({
  songs,
  playlists,
  currentSong,
  onPlaySongFromList,
  addToQueue,
  onDeleteSong,
  onUpdateSong,
  onAddSongToPlaylist,
  t,
  searchTerm,
  theme,
}: AllSongsProps) => {
  // استیت‌های انتخاب
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // استیت‌های منوها
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuDirection, setMenuDirection] = useState<'up' | 'down'>(
    'down'
  );
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
  const [targetPlaylistId, setTargetPlaylistId] = useState<
    string | null
  >(null);

  // رفرنس‌ها
  const topMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const songMenuRefs = useRef<{
    [key: string]: HTMLDivElement | null;
  }>({});
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
        if (menuRef && !menuRef.contains(event.target as Node)) {
          setActiveMenuId(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId, isSortMenuOpen, isTopMenuOpen]);

  // ================= توابع کمکی =================

  /** تبدیل ثانیه به فرمت دقیقه:ثانیه */
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ================= منطق داده‌ها =================

  /** فیلتر و مرتب‌سازی آهنگ‌ها */
  const filteredAndSortedSongs = songs
    .filter(
      (song) =>
        song.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') return b.addedAt - a.addedAt;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
      return 0;
    });

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
      selectedSongs.forEach((id) => onDeleteSong(id));
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
  const handleOpenPlaylistModal = (playlistId?: string) => {
    if (playlistId) setSelectedSongs([playlistId]);
    if (selectedSongs.length === 0 && !playlistId) {
      alert('لطفا ابتدا یک آهنگ انتخاب کنید.');
      return;
    }
    setIsPlaylistModalOpen(true);
    setActiveMenuId(null);
    setIsTopMenuOpen(false);
  };

  /** تایید نهایی افزودن به پلی‌لیست */
  const handleConfirmAddToPlaylist = () => {
    if (!targetPlaylistId) return;
    const toAdd = songs.filter((s) => selectedSongs.includes(s.id));
    toAdd.forEach((s) =>
      onAddSongToPlaylist(targetPlaylistId, s)
    );
    setIsPlaylistModalOpen(false);
    setTargetPlaylistId(null);
    exitSelectMode();
  };

  /** محاسبه جهت منو برای جلوگیری از خروج از صفحه */
  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    songId: string
  ) => {
    e.stopPropagation();
    const buttonRect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    setMenuDirection(spaceBelow < 250 ? 'up' : 'down');
    setActiveMenuId(activeMenuId === songId ? null : songId);
  };

  // ================= رندر =================
  return (
    <div ref={pageRef} style={styles.container}>
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
                      (e.currentTarget.style.backgroundColor =
                        theme.colors.surface)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        'transparent')
                    }
                  >
                    <FolderPlus size={16} />{' '}
                    {t.addToPlaylist || 'Add to Playlist'}
                  </button>
                  <button
                    onClick={handleBulkAddToQueue}
                    style={menuItemStyle(theme)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        theme.colors.surface)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        'transparent')
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
                      (e.currentTarget.style.backgroundColor =
                        theme.colors.surface)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        'transparent')
                    }
                  >
                    <Trash2 size={16} /> {t.deleteSong}
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
                  {['date', 'name', 'artist'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSortBy(type as any);
                        setIsSortMenuOpen(false);
                      }}
                      style={menuItemStyle(
                        theme,
                        sortBy === type
                      )}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          theme.colors.surface)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          'transparent')
                      }
                    >
                      {type === 'date'
                        ? t.sortDate
                        : type === 'name'
                        ? t.sortName
                        : t.sortArtist}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* لیست آهنگ‌ها */}
      {filteredAndSortedSongs.length === 0 ? (
        <p style={{ color: theme.colors.textSecondary }}>
          {songs.length === 0 ? t.noSongs : t.notFound}
        </p>
      ) : (
        <div style={styles.listContainer}>
          {filteredAndSortedSongs.map((song) => {
            const isHovered = hoveredSongId === song.id;
            const isSelected = selectedSongs.includes(song.id);
            const isMenuHovered = hoveredMenuId === song.id;
            const isMenuOpen = activeMenuId === song.id;
            const isPlaying = currentSong?.id === song.id;

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
                  isMenuOpen
                )}
              >
                {isSelectMode && (
                  <div
                    onClick={(e) =>
                      toggleSelect(e, song.id)
                    }
                    style={styles.checkbox(
                      theme,
                      isSelected
                    )}
                  >
                    {isSelected && (
                      <Check size={14} color="#fff" />
                    )}
                  </div>
                )}

                <div
                  style={{
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={song.cover}
                    alt=""
                    style={styles.coverImage}
                  />
                  {isHovered && !isSelectMode && (
                    <div style={styles.playOverlay}>
                      <Play
                        size={16}
                        fill="#fff"
                        color="#fff"
                      />
                    </div>
                  )}
                </div>

                <div
                  style={{ flex: 1, overflow: 'hidden' }}
                >
                  <div
                    style={{
                      ...styles.songTitle(
                        theme,
                        isSelected
                      ),
                      color: isPlaying
                        ? theme.colors.primary
                        : isSelected
                        ? theme.colors.primary
                        : theme.colors.textPrimary,
                    }}
                  >
                    {song.name}
                  </div>
                  <div style={styles.songArtist}>
                    {song.artist}{' '}
                    {song.album
                      ? `• ${song.album}`
                      : ''}
                  </div>
                </div>

                <div style={styles.duration}>
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
                      <MoreVertical size={18} />
                    </button>

                    {isMenuOpen && (
                      <div
                        style={{
                          ...styles.songMenu(theme),
                          [menuDirection === 'up'
                            ? 'bottom'
                            : 'top']: '100%',
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSingleSong(
                              song.id
                            );
                          }}
                          style={menuItemStyle(theme)}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              theme.colors
                                .surface)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              'transparent')
                          }
                        >
                          <CheckSquare size={16} />{' '}
                          {t.select || 'Select'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSong(song);
                            setIsEditModalOpen(true);
                            setActiveMenuId(null);
                          }}
                          style={menuItemStyle(theme)}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              theme.colors
                                .surface)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              'transparent')
                          }
                        >
                          <Edit2 size={16} />{' '}
                          {t.editSong || 'Edit Song'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPlaylistModal(
                              song.id
                            );
                          }}
                          style={menuItemStyle(theme)}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              theme.colors
                                .surface)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              'transparent')
                          }
                        >
                          <FolderPlus size={16} />{' '}
                          {t.addToPlaylist ||
                            'Add to Playlist'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToQueue(song);
                            setActiveMenuId(null);
                          }}
                          style={menuItemStyle(theme)}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              theme.colors
                                .surface)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              'transparent')
                          }
                        >
                          <ListPlus size={16} />{' '}
                          {t.addToQueue}
                        </button>
                        <button
                          onClick={(e) =>
                            handleDelete(e, song.id)
                          }
                          style={{
                            ...menuItemStyle(theme),
                            color:
                              theme.colors.danger,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              theme.colors
                                .surface)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              'transparent')
                          }
                        >
                          <Trash2 size={16} />{' '}
                          {t.deleteSong}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
      {isPlaylistModalOpen && (
        <div
          onClick={() => setIsPlaylistModalOpen(false)}
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
                onClick={() =>
                  setIsPlaylistModalOpen(false)
                }
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
        </div>
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
  padding: '10px 14px',
  textAlign: 'start' as const,
  border: 'none',
  background: active ? theme.colors.surface : 'none',
  color: active
    ? theme.colors.primary
    : theme.colors.textPrimary,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '13px',
  transition: 'background 0.2s',
  cursor: 'pointer',
});

/** مجموعه استایل‌های داخلی */
const styles = {
  container: {
    flex: 1,
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
    minWidth: string = '180px'
  ) => ({
    position: 'absolute' as const,
    top: 'calc(100% + 6px)',
    insetInlineEnd: 0,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.hard,
    zIndex: 50,
    minWidth,
    overflow: 'hidden',
  }),
  songRow: (
    theme: any,
    isSelected: boolean,
    isHovered: boolean,
    isMenuOpen: boolean
  ) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(10px, 2vw, 16px)',
    padding:
      'clamp(6px, 1vw, 10px) clamp(8px, 2vw, 12px)',
    borderRadius: '12px',
    cursor: 'pointer',
    position: 'relative' as const,
    transition: 'all 0.2s ease',
    backgroundColor: isSelected
      ? `${theme.colors.primary}20`
      : isHovered
      ? 'rgba(255, 255, 255, 0.08)'
      : theme.colors.surface,
    border: `1px solid ${
      isSelected
        ? theme.colors.primary
        : isHovered
        ? theme.colors.border
        : 'transparent'
    }`,
    boxShadow: isHovered
      ? '0 8px 24px rgba(0,0,0,0.2)'
      : '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: isMenuOpen ? 50 : 1,
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
    width: 'clamp(36px, 4vw, 44px)',
    height: 'clamp(36px, 4vw, 44px)',
    borderRadius: '8px',
    objectFit: 'cover' as const,
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  },
  playOverlay: {
    position: 'absolute' as const,
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: '8px',
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
    color: isSelected
      ? theme.colors.primary
      : theme.colors.textPrimary,
  }),
  songArtist: {
    fontSize: 'clamp(11px, 1.2vw, 13px)',
    color: '#888',
    marginTop: '2px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  duration: {
    fontSize: '12px',
    color: '#888',
    marginInlineEnd: '-2px',
    flexShrink: 0,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: '1',
    transform: 'translateY(2px)',
  },
  moreBtn: (theme: any, isHovered: boolean) => ({
    background: isHovered
      ? theme.colors.background
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
    position: 'absolute' as const,
    insetInlineEnd: 0,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.hard,
    zIndex: 999,
    minWidth: '180px',
    overflow: 'hidden',
  }),
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modalBox: (theme: any) => ({
    backgroundColor: theme.colors.background,
    padding: 24,
    borderRadius: theme.radius.lg,
    width: '100%',
    maxWidth: 400,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.hard,
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