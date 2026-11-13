import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Playlist, Song } from '../types';
import {
  Play,
  Music,
  MoreHorizontal,
  Trash2,
  Edit2,
  Plus,
  X,
  Check,
  ListPlus,
  ArrowLeft,
  LayoutGrid,
  List,
  Clock,
  Flame,
  History,
  Heart,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { CoverImage } from '../components/CoverImage';
import { AllSongs } from './AllSongs';

interface PlaylistsProps {
  playlists: Playlist[];
  allSongs: Song[];
  currentSong?: Song | null;
  isPlaying?: boolean;
  onPlaySongFromList: (song: Song, list: Song[]) => void;
  addToQueue: (song: Song) => void;
  onDeleteSong?: (id: string) => void;
  onUpdateSong?: (updatedSong: Song) => void;
  onAddSongToPlaylist?: (playlistId: string, song: Song) => void;
  onToggleFavorite?: (id: string) => void;
  t: any;
  onCreatePlaylist: (name: string, selectedSongs: Song[]) => void;
  onDeletePlaylist: (id: string) => void;
  onRenamePlaylist: (id: string, newName: string) => void;
  onUpdatePlaylistSongs: (id: string, newSongs: Song[]) => void;
  theme: any;
  language: 'fa' | 'en';
  glassCardCovers?: boolean;
  initialPlaylist?: { id: string; token: number } | null;
}

type ViewMode = 'grid' | 'list';
type SmartPlaylistKey = 'recentlyAdded' | 'mostPlayed' | 'recentlyPlayed' | 'favorites';

// ============================================================
// کامپوننت‌های کمکی
// ============================================================

/** کاور ترکیبی پلی‌لیست: ۴ کاور آهنگ اول در گرید ۲×۲، یا آیکون موسیقی اگر خالی باشد */
const PlaylistCover = ({ songs, theme }: { songs: Song[]; theme: any }) => {
  const covers = songs.slice(0, 4);

  if (covers.length === 0) {
    return (
      <div
        style={{
          aspectRatio: '1 / 1',
          backgroundColor: theme.colors.border,
          borderRadius: theme.radius.md,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Music size={40} color={theme.colors.textSecondary} />
      </div>
    );
  }

  return (
    <div
      style={{
        aspectRatio: '1 / 1',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '2px',
        borderRadius: theme.radius.md,
        overflow: 'hidden',
      }}
    >
      {covers.map((song, i) => (
        <CoverImage
          key={`${song.id}-${i}`}
          src={song.cover}
          alt=""
          iconSize={16}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ))}
      {Array.from({ length: 4 - covers.length }).map((_, i) => (
        <div key={`empty-${i}`} style={{ backgroundColor: theme.colors.border }} />
      ))}
    </div>
  );
};

/** دکمه‌ی همبرگری سه‌نقطه با موقعیت‌دهی RTL/LTR */
const PlaylistMenuButton = ({
  isOpen,
  onClick,
  theme,
  position,
  offset,
}: {
  isOpen: boolean;
  onClick: (e: React.MouseEvent) => void;
  theme: any;
  position: 'top' | 'inline';
  offset?: number;
}) => {
  const hoverBg = theme.colors.surfaceHover || 'rgba(255, 255, 255, 0.08)';
  const defaultBg = isOpen ? theme.colors.surface : 'transparent';
  return (
    <button
      onClick={onClick}
      aria-label="menu"
      style={{
        position: position === 'top' ? 'absolute' : 'relative',
        ...(position === 'top' ? { top: offset ?? 10, insetInlineEnd: offset ?? 10 } : {}),
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: defaultBg,
        border: 'none',
        color: theme.colors.textSecondary,
        cursor: 'pointer',
        borderRadius: '50%',
        transition: 'background-color 0.15s ease, color 0.15s ease',
        zIndex: 2,
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBg;
        e.currentTarget.style.color = theme.colors.textPrimary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = defaultBg;
        e.currentTarget.style.color = theme.colors.textSecondary;
      }}
    >
      <MoreHorizontal size={18} />
    </button>
  );
};

/** یک آیتم داخل منوی کشویی */
const MenuItem = ({
  icon,
  label,
  onClick,
  color,
  theme,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
  theme: any;
}) => {
  const hoverBg = color
    ? 'rgba(255, 69, 58, 0.15)'
    : theme.isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(0, 0, 0, 0.07)';
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '9px 12px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'start',
        color: color ?? theme.colors.textPrimary,
        transition: 'background-color 0.12s ease',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {icon} <span style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</span>
    </button>
  );
};

/** منوی کشویی عملیات پلی‌لیست (تغییر نام، افزودن، حذف) */
const PlaylistMenu = ({
  onRename,
  onAddSong,
  onDelete,
  theme,
  t,
  align,
}: {
  onRename: () => void;
  onAddSong: () => void;
  onDelete: () => void;
  theme: any;
  t: any;
  align: 'start' | 'end';
}) => (
  <div
    onClick={(e) => e.stopPropagation()}
    style={{
      position: 'absolute',
      top: 'calc(100% + 6px)',
      [align === 'end' ? 'insetInlineEnd' : 'insetInlineStart']: 0,
      padding: '5px',
      backgroundColor: theme.isDark ? 'rgba(22, 18, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)',
      backdropFilter: 'blur(26px) saturate(180%)',
      WebkitBackdropFilter: 'blur(26px) saturate(180%)',
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.border}`,
      boxShadow: '0 16px 36px rgba(0, 0, 0, 0.42)',
      zIndex: 1000,
      minWidth: 185,
      overflow: 'hidden',
    }}
  >
    <MenuItem icon={<Edit2 size={16} />} label={t.renamePlaylist} onClick={onRename} theme={theme} />
    <MenuItem icon={<Plus size={16} />} label={t.addSong} onClick={onAddSong} theme={theme} />
    <MenuItem
      icon={<Trash2 size={16} />}
      label={t.deletePlaylist}
      onClick={onDelete}
      color={theme.colors.danger}
      theme={theme}
    />
  </div>
);

/** کارت پلی‌لیست در حالت grid با شیشه بلوری اپل موزیک */
const PlaylistCard = ({
  playlist,
  onOpen,
  menuOpen,
  onToggleMenu,
  onRename,
  onAddSong,
  onDelete,
  theme,
  t,
  menuRef,
}: {
  playlist: Playlist;
  onOpen: () => void;
  menuOpen: boolean;
  onToggleMenu: (e: React.MouseEvent) => void;
  onRename: () => void;
  onAddSong: () => void;
  onDelete: () => void;
  theme: any;
  t: any;
  menuRef: (el: HTMLDivElement | null) => void;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: 'relative', zIndex: menuOpen ? 50 : (hovered ? 2 : 1) }}>
      <div
        onClick={onOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: hovered
            ? (theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.88)')
            : theme.colors.surface,
          backdropFilter: 'blur(26px) saturate(180%)',
          WebkitBackdropFilter: 'blur(26px) saturate(180%)',
          borderRadius: theme.radius.xl || '22px',
          padding: 16,
          cursor: 'pointer',
          border: `1px solid ${hovered ? (theme.colors.borderLight || theme.colors.primary + '88') : theme.colors.border}`,
          boxShadow: hovered
            ? `0 16px 36px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 20px ${theme.colors.glow || theme.colors.primary}33`
            : (theme.isDark
                ? '0 8px 24px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
                : '0 4px 14px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.7)'),
          transition: 'all 0.22s cubic-bezier(0.2, 0, 0, 1)',
          transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        }}
      >
        <PlaylistCover songs={playlist.songs} theme={theme} />
        <h3
          style={{
            fontWeight: '700',
            fontSize: 16,
            color: theme.colors.textPrimary,
            marginTop: 12,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {playlist.name}
        </h3>
        <p style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 3 }}>
          {playlist.songs.length} {t.allSongs}
        </p>
      </div>

      <div ref={menuRef} style={{ position: 'absolute', top: 12, insetInlineEnd: 12, zIndex: 50 }}>
        <PlaylistMenuButton isOpen={menuOpen} onClick={onToggleMenu} theme={theme} position="top" offset={0} />
        {menuOpen && (
          <PlaylistMenu onRename={onRename} onAddSong={onAddSong} onDelete={onDelete} theme={theme} t={t} align="end" />
        )}
      </div>
    </div>
  );
};

/** ردیف پلی‌لیست در حالت list با شیشه بلوری */
const PlaylistRow = ({
  playlist,
  onOpen,
  menuOpen,
  onToggleMenu,
  onRename,
  onAddSong,
  onDelete,
  theme,
  t,
  menuRef,
}: {
  playlist: Playlist;
  onOpen: () => void;
  menuOpen: boolean;
  onToggleMenu: (e: React.MouseEvent) => void;
  onRename: () => void;
  onAddSong: () => void;
  onDelete: () => void;
  theme: any;
  t: any;
  menuRef: (el: HTMLDivElement | null) => void;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 15,
        padding: '12px 16px',
        backgroundColor: hovered
          ? (theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.88)')
          : theme.colors.surface,
        backdropFilter: 'blur(22px) saturate(170%)',
        WebkitBackdropFilter: 'blur(22px) saturate(170%)',
        border: `1px solid ${hovered ? (theme.colors.borderLight || theme.colors.primary + '88') : theme.colors.border}`,
        borderRadius: '16px',
        cursor: 'pointer',
        boxShadow: hovered
          ? '0 10px 28px rgba(0,0,0,0.28)'
          : (theme.isDark ? '0 4px 14px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.04)'),
        transition: 'all 0.22s cubic-bezier(0.2, 0, 0, 1)',
        transform: hovered ? 'scale(1.006)' : 'scale(1)',
        position: 'relative',
        zIndex: menuOpen ? 50 : (hovered ? 2 : 1),
      }}
    >
      <div style={{ width: 56, height: 56, flexShrink: 0 }}>
        <PlaylistCover songs={playlist.songs} theme={theme} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 15,
            color: theme.colors.textPrimary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {playlist.name}
        </div>
        <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 }}>
          {playlist.songs.length} {t.allSongs}
        </div>
      </div>

      <div ref={menuRef} style={{ position: 'relative', zIndex: 50 }}>
        <PlaylistMenuButton isOpen={menuOpen} onClick={onToggleMenu} theme={theme} position="inline" />
        {menuOpen && (
          <PlaylistMenu onRename={onRename} onAddSong={onAddSong} onDelete={onDelete} theme={theme} t={t} align="end" />
        )}
      </div>
    </div>
  );
};

/** پوسته‌ی مودال با انیمیشن ورود/خروج با استفاده از framer-motion و createPortal */
const Modal = ({
  open,
  onClose,
  children,
  theme,
  width = 420,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  theme: any;
  width?: number;
}) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.colors.background,
              padding: 24,
              borderRadius: theme.radius.lg,
              width: '100%',
              maxWidth: width,
              maxHeight: '88vh',
              overflowY: 'auto',
              border: `1px solid ${theme.colors.border}`,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
              boxSizing: 'border-box',
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

/** دکمه‌ی استاندارد مودال */
const ModalButton = ({
  children,
  onClick,
  primary,
  disabled,
  theme,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  theme: any;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '10px 18px',
      borderRadius: theme.radius.sm,
      border: 'none',
      backgroundColor: primary ? theme.colors.primary : theme.colors.border,
      color: primary ? '#fff' : theme.colors.textPrimary,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      fontWeight: 600,
      transition: 'filter 0.15s ease, opacity 0.15s ease',
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.currentTarget.style.filter = primary ? 'brightness(1.12)' : 'brightness(1.2)';
      }
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.filter = 'none';
    }}
  >
    {children}
  </button>
);

/** مودال افزودن آهنگ به پلی‌لیست */
const AddSongModal = ({
  open,
  onClose,
  allSongs,
  existingIds,
  onConfirm,
  theme,
  t,
}: {
  open: boolean;
  onClose: () => void;
  allSongs: Song[];
  existingIds: string[];
  onConfirm: (selectedIds: string[]) => void;
  theme: any;
  t: any;
}) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) {
      setSelected([]);
      setQuery('');
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allSongs;
    return allSongs.filter(
      (s) => s.name.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
  }, [allSongs, query]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Modal open={open} onClose={onClose} theme={theme} width={520}>
      <h2 style={{ marginBottom: 16, fontSize: 20, color: theme.colors.textPrimary }}>
        {t.addSongsToPlaylist}
      </h2>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.search}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '12px 16px',
          borderRadius: theme.radius.md || '10px',
          border: `1.5px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.surface,
          color: theme.colors.textPrimary,
          marginBottom: 16,
          fontSize: 14,
          outline: 'none',
          display: 'block',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = theme.colors.primary;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary}33`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = theme.colors.border;
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      <div style={{ maxHeight: '50vh', overflowY: 'auto', marginBottom: 16 }}>
        {filtered.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: 20 }}>
            {allSongs.length === 0 ? t.noSongs : t.notFound}
          </p>
        ) : (
          filtered.map((song) => {
            const already = existingIds.includes(song.id);
            const isSelected = selected.includes(song.id);
            return (
              <div
                key={song.id}
                onClick={() => !already && toggle(song.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 8,
                  borderRadius: theme.radius.sm,
                  cursor: already ? 'not-allowed' : 'pointer',
                  opacity: already ? 0.45 : 1,
                  backgroundColor: isSelected ? theme.colors.surface : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: isSelected
                      ? `2px solid ${theme.colors.primary}`
                      : `2px solid ${theme.colors.textSecondary}`,
                    backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isSelected && <Check size={14} color="#fff" />}
                </div>
                <CoverImage
                  src={song.cover}
                  alt=""
                  iconSize={15}
                  style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      color: theme.colors.textPrimary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {song.name}
                  </div>
                  <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                    {song.artist}
                  </div>
                </div>
                {already && (
                  <span style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                    {t.alreadyAdded}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <ModalButton onClick={onClose} theme={theme}>
          {t.cancel}
        </ModalButton>
        <ModalButton
          primary
          disabled={selected.length === 0}
          onClick={() => onConfirm(selected)}
          theme={theme}
        >
          {t.addSong} ({selected.length})
        </ModalButton>
      </div>
    </Modal>
  );
};

/** مودال نام‌گذاری/تغییر نام */
const NameModal = ({
  open,
  title,
  value,
  onChange,
  onClose,
  onConfirm,
  placeholder,
  confirmLabel,
  theme,
  t,
}: {
  open: boolean;
  title: string;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  placeholder?: string;
  confirmLabel: string;
  theme: any;
  t: any;
}) => (
  <Modal open={open} onClose={onClose} theme={theme}>
    <h2 style={{ marginBottom: 16, fontSize: 20, color: theme.colors.textPrimary }}>{title}</h2>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus
      style={{
        width: '100%',
        boxSizing: 'border-box',
        padding: '12px 16px',
        borderRadius: theme.radius.md || '10px',
        border: `1.5px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.surface,
        color: theme.colors.textPrimary,
        marginBottom: 20,
        fontSize: 15,
        outline: 'none',
        display: 'block',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = theme.colors.primary;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary}33`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = theme.colors.border;
        e.currentTarget.style.boxShadow = 'none';
      }}
    />
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
      <ModalButton onClick={onClose} theme={theme}>
        {t.cancel}
      </ModalButton>
      <ModalButton primary disabled={!value.trim()} onClick={onConfirm} theme={theme}>
        {confirmLabel}
      </ModalButton>
    </div>
  </Modal>
);

/** ردیف آهنگ داخل صفحه‌ی پلی‌لیست */
const SongRow = ({
  song,
  index,
  onPlay,
  onAddToQueue,
  onRemove,
  theme,
  t,
  glassCardCovers = true,
}: {
  song: Song;
  index: number;
  onPlay: () => void;
  onAddToQueue: () => void;
  onRemove: (e: React.MouseEvent) => void;
  theme: any;
  t: any;
  glassCardCovers?: boolean;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onPlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        direction: 'ltr',
        textAlign: 'left',
        gap: 12,
        padding: '8px 12px',
        marginBottom: 8,
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${hovered ? (theme.isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)') : theme.colors.border}`,
        cursor: 'pointer',
        borderRadius: '14px',
        backgroundColor: hovered
          ? (theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)')
          : glassCardCovers
          ? (theme.isDark ? 'rgba(18, 14, 32, 0.45)' : 'rgba(255, 255, 255, 0.55)')
          : theme.colors.surface,
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        transition: 'all 0.2s',
      }}
    >
      {/* پس‌زمینه کاور شیشه‌ای روی کارت */}
      {glassCardCovers && song.cover && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${song.cover})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(12px) brightness(0.65) saturate(180%)',
              transform: 'scale(1.25)',
              opacity: theme.isDark ? 0.6 : 0.4,
              zIndex: 0,
              pointerEvents: 'none',
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
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      <span style={{ color: theme.colors.textSecondary, width: 22, flexShrink: 0, position: 'relative', zIndex: 1, fontWeight: 600 }}>
        {index + 1}
      </span>
      <CoverImage
        src={song.cover}
        alt=""
        iconSize={18}
        style={{
          width: 44,
          height: 44,
          borderRadius: '10px',
          objectFit: 'cover',
          position: 'relative',
          zIndex: 1,
          border: '1px solid rgba(255, 255, 255, 0.22)',
          boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontWeight: '600',
            color: theme.colors.textPrimary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: theme.isDark ? '0 1px 4px rgba(0,0,0,0.9)' : '0 1px 2px rgba(255,255,255,0.8)',
          }}
        >
          {song.name}
        </div>
        <div
          style={{
            fontSize: 13,
            color: theme.isDark ? 'rgba(255, 255, 255, 0.72)' : theme.colors.textSecondary,
            textShadow: theme.isDark ? '0 1px 3px rgba(0,0,0,0.8)' : 'none',
          }}
        >
          {song.artist}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddToQueue();
        }}
        title={t.addToQueue}
        style={{
          background: 'none',
          border: 'none',
          color: hovered ? theme.colors.primary : theme.colors.textSecondary,
          cursor: 'pointer',
          padding: 6,
          position: 'relative',
          zIndex: 1,
          transition: 'all 0.15s',
        }}
      >
        <ListPlus size={18} />
      </button>
      <button
        onClick={onRemove}
        title={t.deleteSong}
        style={{
          background: 'none',
          border: 'none',
          color: theme.colors.danger,
          cursor: 'pointer',
          padding: 6,
          position: 'relative',
          zIndex: 1,
          borderRadius: theme.radius.sm,
          transition: 'background-color 0.15s ease, opacity 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.surfaceHover || 'rgba(255, 255, 255, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
};

/** دکمه‌ی سوییچ حالت نمایش */
const ViewToggle = ({
  active,
  onClick,
  icon,
  theme,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  theme: any;
}) => {
  const hoverBg = theme.colors.surfaceHover || 'rgba(255, 255, 255, 0.08)';
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 11px',
        borderRadius: theme.radius.sm,
        border: 'none',
        cursor: 'pointer',
        backgroundColor: active ? theme.colors.surface : 'transparent',
        color: active ? theme.colors.primary : theme.colors.textSecondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.15s ease, color 0.15s ease',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = hoverBg;
          e.currentTarget.style.color = theme.colors.textPrimary;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = theme.colors.textSecondary;
        }
      }}
    >
      {icon}
    </button>
  );
};

/** کارت پلی‌لیست هوشمند (اخیراً اضافه شده، پرتکرارترین‌ها، اخیراً پخش شده، محبوب‌ها) */
const SmartPlaylistCard = ({
  title,
  count,
  icon,
  iconBg,
  iconColor,
  songs,
  emptyText,
  onClick,
  onQuickPlay,
  theme,
  t,
  language,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  songs: Song[];
  emptyText: string;
  onClick: () => void;
  onQuickPlay: () => void;
  theme: any;
  t: any;
  language: 'fa' | 'en';
}) => {
  const [hovered, setHovered] = useState(false);
  const [playHovered, setPlayHovered] = useState(false);

  const previewSongs = songs.slice(0, 4);
  const hasSongs = songs.length > 0;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered
          ? theme.isDark
            ? 'rgba(255, 255, 255, 0.09)'
            : 'rgba(255, 255, 255, 0.86)'
          : theme.colors.surface,
        backdropFilter: 'blur(26px) saturate(180%)',
        WebkitBackdropFilter: 'blur(26px) saturate(180%)',
        borderRadius: theme.radius.xl || '20px',
        border: `1px solid ${hovered ? theme.colors.primary + '88' : theme.colors.border}`,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.2, 0, 0, 1)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 14px 32px rgba(0, 0, 0, 0.28), inset 0 1px 0 ${
              theme.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.9)'
            }, 0 0 18px ${theme.colors.glow || theme.colors.primary}2a`
          : theme.isDark
          ? '0 6px 20px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
          : '0 4px 14px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
        boxSizing: 'border-box',
        minHeight: '132px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: iconBg,
              color: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontSize: '14.5px',
                fontWeight: 700,
                color: theme.colors.textPrimary,
                lineHeight: 1.25,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </h3>
            <span
              style={{
                fontSize: '12px',
                color: theme.colors.textSecondary,
                marginTop: '2px',
                display: 'block',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {count} {t.tracksCount || 'آهنگ'}
            </span>
          </div>
        </div>

        {hasSongs ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickPlay();
            }}
            onMouseEnter={() => setPlayHovered(true)}
            onMouseLeave={() => setPlayHovered(false)}
            title={t.playAll || 'پخش'}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: theme.colors.primary,
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: playHovered
                ? `0 0 12px ${theme.colors.primary}`
                : '0 2px 8px rgba(0,0,0,0.2)',
              transform: playHovered ? 'scale(1.06)' : 'scale(1)',
              transition: 'all 0.18s',
              flexShrink: 0,
            }}
          >
            <Play size={14} fill="#ffffff" />
          </button>
        ) : (
          <div style={{ color: theme.colors.textSecondary, opacity: 0.55 }}>
            {language === 'fa' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        {hasSongs ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              width: '100%',
              overflow: 'hidden',
            }}
          >
            {previewSongs.map((song, idx) => (
              <div
                key={song.id + idx}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: 'rgba(0,0,0,0.18)',
                }}
              >
                <CoverImage
                  src={song.cover}
                  alt=""
                  iconSize={15}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
            {count > previewSongs.length && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: theme.colors.textSecondary,
                  fontVariantNumeric: 'tabular-nums',
                  paddingInlineStart: '2px',
                  flexShrink: 0,
                }}
              >
                +{count - previewSongs.length}
              </span>
            )}
          </div>
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              color: theme.colors.textSecondary,
              lineHeight: 1.4,
              opacity: 0.85,
            }}
          >
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================================
// کامپوننت اصلی
// ============================================================

export const Playlists = ({
  playlists,
  allSongs,
  currentSong = null,
  isPlaying = false,
  onPlaySongFromList,
  addToQueue,
  onDeleteSong,
  onUpdateSong,
  onAddSongToPlaylist,
  onToggleFavorite,
  t,
  onCreatePlaylist,
  onDeletePlaylist,
  onRenamePlaylist,
  onUpdatePlaylistSongs,
  theme,
  language,
  glassCardCovers = true,
  initialPlaylist = null,
}: PlaylistsProps) => {
  // شناسه پلی‌لیست عادی یا هوشمند که باز شده
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(() =>
    initialPlaylist ? initialPlaylist.id : null
  );
  const [activeSmartList, setActiveSmartList] = useState<SmartPlaylistKey | null>(null);
  const activePlaylist = playlists.find((p) => p.id === activePlaylistId) ?? null;

  useEffect(() => {
    if (initialPlaylist) {
      setActiveSmartList(null);
      setActivePlaylistId(initialPlaylist.id);
    }
  }, [initialPlaylist]);

  const recentlyAdded = useMemo(
    () => [...allSongs].sort((a, b) => b.addedAt - a.addedAt),
    [allSongs]
  );
  const mostPlayed = useMemo(
    () => [...allSongs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)),
    [allSongs]
  );
  const recentlyPlayed = useMemo(
    () =>
      [...allSongs]
        .filter((s) => (s.lastPlayedAt && s.lastPlayedAt > 0) || (s.playCount && s.playCount > 0))
        .sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0)),
    [allSongs]
  );
  const favouriteSongs = useMemo(
    () => allSongs.filter((s) => s.isFavorite === true),
    [allSongs]
  );

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createValue, setCreateValue] = useState('');

  const [addSongOpen, setAddSongOpen] = useState(false);
  const [addSongTargetId, setAddSongTargetId] = useState<string | null>(null);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const pageRef = useRef<HTMLDivElement>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // بستن منو هنگام کلیک بیرون از آن
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!activeMenuId) return;
      const ref = menuRefs.current[activeMenuId];
      if (ref && !ref.contains(e.target as Node)) setActiveMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeMenuId]);

  // پخش کل پلی‌لیست از اولین آهنگ
  const handlePlayAll = () => {
    if (!activePlaylist || activePlaylist.songs.length === 0) return;
    onPlaySongFromList(activePlaylist.songs[0], activePlaylist.songs);
  };

  // حذف یک آهنگ از پلی‌لیست فعال (با تأیید)
  const handleRemoveSong = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    if (!activePlaylist) return;
    if (!window.confirm(t.deleteConfirm)) return;
    const updated = activePlaylist.songs.filter((s) => s.id !== songId);
    onUpdatePlaylistSongs(activePlaylist.id, updated);
  };

  // ذخیره نام جدید پس از تغییر نام
  const handleSaveRename = () => {
    if (renameTargetId && renameValue.trim()) {
      onRenamePlaylist(renameTargetId, renameValue.trim());
    }
    setRenameOpen(false);
    setRenameTargetId(null);
    setRenameValue('');
  };

  // ساخت پلی‌لیست جدید
  const handleCreate = () => {
    if (!createValue.trim()) return;
    onCreatePlaylist(createValue.trim(), []);
    setCreateValue('');
    setCreateOpen(false);
  };

  // افزودن آهنگ‌های انتخاب‌شده به پلی‌لیست هدف
  const handleAddSongsConfirm = (selectedIds: string[]) => {
    if (!addSongTargetId) return;
    const target = playlists.find((p) => p.id === addSongTargetId);
    if (!target) return;
    const toAdd = allSongs.filter(
      (s) => selectedIds.includes(s.id) && !target.songs.some((ts) => ts.id === s.id)
    );
    onUpdatePlaylistSongs(addSongTargetId, [...target.songs, ...toAdd]);
    setAddSongOpen(false);
    setAddSongTargetId(null);
  };

  // تأیید و اجرای حذف پلی‌لیست
  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      onDeletePlaylist(deleteTargetId);
      if (activePlaylistId === deleteTargetId) setActivePlaylistId(null);
    }
    setDeleteTargetId(null);
  };

  // پلی‌لیست هدف برای مودال افزودن آهنگ
  const addSongTarget = playlists.find((p) => p.id === addSongTargetId);
  const isRTL = language === 'fa';

  // ---------- صفحه‌ی داخلی پلی‌لیست هوشمند (یکپارچه با AllSongs) ----------
  if (activeSmartList) {
    const smartConfig = {
      recentlyAdded: {
        title: t.recentlyAdded || 'اخیراً اضافه شده',
        list: recentlyAdded,
        empty: t.noSongs || 'هیچ آهنگی وجود ندارد.',
      },
      mostPlayed: {
        title: t.mostPlayed || 'پرتکرارترین‌ها',
        list: mostPlayed,
        empty: t.noSongs || 'هنوز پخشی ثبت نشده است.',
      },
      recentlyPlayed: {
        title: t.recentlyPlayed || 'اخیراً پخش شده',
        list: recentlyPlayed,
        empty: t.noRecentlyPlayed || 'هنوز هیچ آهنگی پخش نشده است.',
      },
      favorites: {
        title: t.favouriteSongs || 'آهنگ‌های محبوب',
        list: favouriteSongs,
        empty: t.noFavorites || 'هنوز آهنگی به عنوان محبوب علامت‌گذاری نشده است.',
      },
    }[activeSmartList];

    return (
      <AllSongs
        songs={smartConfig.list}
        playlists={playlists}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlaySongFromList={onPlaySongFromList}
        onCreatePlaylist={onCreatePlaylist}
        addToQueue={addToQueue}
        onDeleteSong={onDeleteSong ?? (() => {})}
        onUpdateSong={onUpdateSong ?? (() => {})}
        onAddSongToPlaylist={onAddSongToPlaylist ?? (() => {})}
        onToggleFavorite={onToggleFavorite}
        t={t}
        theme={theme}
        title={smartConfig.title}
        onBack={() => setActiveSmartList(null)}
        emptyMessage={smartConfig.empty}
        glassCardCovers={glassCardCovers}
      />
    );
  }

  // ---------- صفحه‌ی داخلی پلی‌لیست ----------
  if (activePlaylist) {
    return (
      <div
        ref={pageRef}
        style={{
          flex: 1,
          padding: 'clamp(16px, 3vw, 40px)',
          paddingBottom: 130,
          overflowY: 'auto',
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        <button
          onClick={() => setActivePlaylistId(null)}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.primary,
            cursor: 'pointer',
            marginBottom: 20,
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(-5px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
        >
          <ArrowLeft size={18} style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
          {t.back}
        </button>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 'bold',
              color: theme.colors.textPrimary,
              marginInlineEnd: 'auto',
            }}
          >
            {activePlaylist.name}
          </h1>

          <button
            onClick={handlePlayAll}
            disabled={activePlaylist.songs.length === 0}
            style={{
              background: theme.colors.primary,
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: theme.radius.xl,
              cursor: activePlaylist.songs.length === 0 ? 'not-allowed' : 'pointer',
              opacity: activePlaylist.songs.length === 0 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 'bold',
              transition: 'filter 0.15s ease, opacity 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (activePlaylist.songs.length > 0) {
                e.currentTarget.style.filter = 'brightness(1.12)';
              }
            }}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
          >
            <Play size={18} fill="#fff" /> {t.playAll}
          </button>

          <button
            onClick={() => {
              setAddSongTargetId(activePlaylist.id);
              setAddSongOpen(true);
            }}
            style={{
              background: theme.colors.surface,
              color: theme.colors.textPrimary,
              border: `1px solid ${theme.colors.border}`,
              padding: '10px 18px',
              borderRadius: theme.radius.xl,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 'bold',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surfaceHover || 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = theme.colors.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surface;
              e.currentTarget.style.borderColor = theme.colors.border;
            }}
          >
            <Plus size={18} /> {t.addSong}
          </button>
        </div>

        {activePlaylist.songs.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary }}>—</p>
        ) : (
          activePlaylist.songs.map((song, index) => (
            <SongRow
              key={song.id}
              song={song}
              index={index}
              onPlay={() => onPlaySongFromList(song, activePlaylist.songs)}
              onAddToQueue={() => addToQueue(song)}
              onRemove={(e) => handleRemoveSong(e, song.id)}
              theme={theme}
              t={t}
              glassCardCovers={glassCardCovers}
            />
          ))
        )}

        <AddSongModal
          open={addSongOpen}
          onClose={() => {
            setAddSongOpen(false);
            setAddSongTargetId(null);
          }}
          allSongs={allSongs}
          existingIds={addSongTarget?.songs.map((s) => s.id) ?? []}
          onConfirm={handleAddSongsConfirm}
          theme={theme}
          t={t}
        />
      </div>
    );
  }

  // ---------- صفحه‌ی اصلی پلی‌لیست‌ها ----------
  return (
    <div
      ref={pageRef}
      style={{
        flex: 1,
        padding: 'clamp(16px, 3vw, 40px)',
        paddingBottom: 160,
        overflowY: 'auto',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 'bold',
            color: theme.colors.textPrimary,
          }}
        >
          {t.playlists}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              padding: 3,
            }}
          >
            <ViewToggle
              active={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
              icon={<LayoutGrid size={16} />}
              theme={theme}
            />
            <ViewToggle
              active={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              icon={<List size={16} />}
              theme={theme}
            />
          </div>

          <button
            onClick={() => setCreateOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: theme.colors.primary,
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: theme.radius.md,
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: `0 2px 10px ${theme.colors.primary}44`,
              transition: 'filter 0.15s ease, opacity 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'none';
            }}
          >
            <Plus size={18} /> {t.createPlaylist}
          </button>
        </div>
      </div>

      {/* بخش ۱: پلی‌لیست‌های هوشمند */}
      <div style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: theme.colors.textSecondary,
            margin: '0 0 14px 0',
          }}
        >
          {t.smartPlaylists || 'پلی‌لیست‌های هوشمند'}
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          <SmartPlaylistCard
            title={t.recentlyAdded || 'اخیراً اضافه شده'}
            count={recentlyAdded.length}
            icon={<Clock size={18} />}
            iconBg="rgba(10, 132, 255, 0.15)"
            iconColor="#0a84ff"
            songs={recentlyAdded}
            emptyText={t.noSongs || 'آهنگی موجود نیست'}
            onClick={() => setActiveSmartList('recentlyAdded')}
            onQuickPlay={() =>
              recentlyAdded.length > 0 && onPlaySongFromList(recentlyAdded[0], recentlyAdded)
            }
            theme={theme}
            t={t}
            language={language}
          />
          <SmartPlaylistCard
            title={t.mostPlayed || 'پرتکرارترین‌ها'}
            count={mostPlayed.length}
            icon={<Flame size={18} />}
            iconBg="rgba(255, 149, 0, 0.15)"
            iconColor="#ff9500"
            songs={mostPlayed}
            emptyText={t.noSongs || 'آهنگی موجود نیست'}
            onClick={() => setActiveSmartList('mostPlayed')}
            onQuickPlay={() =>
              mostPlayed.length > 0 && onPlaySongFromList(mostPlayed[0], mostPlayed)
            }
            theme={theme}
            t={t}
            language={language}
          />
          <SmartPlaylistCard
            title={t.recentlyPlayed || 'اخیراً پخش شده'}
            count={recentlyPlayed.length}
            icon={<History size={18} />}
            iconBg="rgba(94, 92, 230, 0.15)"
            iconColor="#5e5ce6"
            songs={recentlyPlayed}
            emptyText={t.noRecentlyPlayed || 'با پخش آهنگ‌ها، تاریخچه در اینجا ثبت می‌شود'}
            onClick={() => setActiveSmartList('recentlyPlayed')}
            onQuickPlay={() =>
              recentlyPlayed.length > 0 &&
              onPlaySongFromList(recentlyPlayed[0], recentlyPlayed)
            }
            theme={theme}
            t={t}
            language={language}
          />
          <SmartPlaylistCard
            title={t.favouriteSongs || 'آهنگ‌های محبوب'}
            count={favouriteSongs.length}
            icon={<Heart size={18} fill="#ff3b30" />}
            iconBg="rgba(255, 59, 48, 0.15)"
            iconColor="#ff3b30"
            songs={favouriteSongs}
            emptyText={t.noFavorites || 'برای افزودن آهنگ به اینجا، روی آیکون قلب کلیک کنید'}
            onClick={() => setActiveSmartList('favorites')}
            onQuickPlay={() =>
              favouriteSongs.length > 0 &&
              onPlaySongFromList(favouriteSongs[0], favouriteSongs)
            }
            theme={theme}
            t={t}
            language={language}
          />
        </div>
      </div>

      {/* بخش ۲: پلی‌لیست‌های شخصی کاربر */}
      <h2
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: theme.colors.textSecondary,
          margin: '0 0 14px 0',
        }}
      >
        {t.myPlaylists || 'پلی‌لیست‌های من'}
      </h2>

      {playlists.length === 0 ? (
        <p style={{ color: theme.colors.textSecondary }}>{t.noPlaylists || '—'}</p>
      ) : viewMode === 'grid' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 16,
          }}
        >
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onOpen={() => setActivePlaylistId(playlist.id)}
              menuOpen={activeMenuId === playlist.id}
              onToggleMenu={(e) => {
                e.stopPropagation();
                setActiveMenuId(activeMenuId === playlist.id ? null : playlist.id);
              }}
              onRename={() => {
                setRenameTargetId(playlist.id);
                setRenameValue(playlist.name);
                setRenameOpen(true);
                setActiveMenuId(null);
              }}
              onAddSong={() => {
                setAddSongTargetId(playlist.id);
                setAddSongOpen(true);
                setActiveMenuId(null);
              }}
              onDelete={() => {
                setDeleteTargetId(playlist.id);
                setActiveMenuId(null);
              }}
              theme={theme}
              t={t}
              menuRef={(el) => (menuRefs.current[playlist.id] = el)}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {playlists.map((playlist) => (
            <PlaylistRow
              key={playlist.id}
              playlist={playlist}
              onOpen={() => setActivePlaylistId(playlist.id)}
              menuOpen={activeMenuId === playlist.id}
              onToggleMenu={(e) => {
                e.stopPropagation();
                setActiveMenuId(activeMenuId === playlist.id ? null : playlist.id);
              }}
              onRename={() => {
                setRenameTargetId(playlist.id);
                setRenameValue(playlist.name);
                setRenameOpen(true);
                setActiveMenuId(null);
              }}
              onAddSong={() => {
                setAddSongTargetId(playlist.id);
                setAddSongOpen(true);
                setActiveMenuId(null);
              }}
              onDelete={() => {
                setDeleteTargetId(playlist.id);
                setActiveMenuId(null);
              }}
              theme={theme}
              t={t}
              menuRef={(el) => (menuRefs.current[playlist.id] = el)}
            />
          ))}
        </div>
      )}

      <NameModal
        open={renameOpen}
        title={t.renamePlaylist}
        value={renameValue}
        onChange={setRenameValue}
        onClose={() => {
          setRenameOpen(false);
          setRenameTargetId(null);
        }}
        onConfirm={handleSaveRename}
        confirmLabel={t.save}
        theme={theme}
        t={t}
      />

      <NameModal
        open={createOpen}
        title={t.createPlaylist}
        value={createValue}
        onChange={setCreateValue}
        onClose={() => {
          setCreateOpen(false);
          setCreateValue('');
        }}
        onConfirm={handleCreate}
        placeholder={t.playlistName}
        confirmLabel={t.create}
        theme={theme}
        t={t}
      />

      <AddSongModal
        open={addSongOpen}
        onClose={() => {
          setAddSongOpen(false);
          setAddSongTargetId(null);
        }}
        allSongs={allSongs}
        existingIds={addSongTarget?.songs.map((s) => s.id) ?? []}
        onConfirm={handleAddSongsConfirm}
        theme={theme}
        t={t}
      />

      <Modal
        open={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        theme={theme}
      >
        <h2 style={{ marginBottom: 12, fontSize: 20, color: theme.colors.textPrimary }}>
          {t.deletePlaylist}
        </h2>
        <p style={{ marginBottom: 20, color: theme.colors.textSecondary }}>
          {t.deletePlaylistConfirm}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <ModalButton onClick={() => setDeleteTargetId(null)} theme={theme}>
            {t.cancel}
          </ModalButton>
          <ModalButton primary onClick={handleConfirmDelete} theme={theme}>
            {t.deletePlaylist}
          </ModalButton>
        </div>
      </Modal>
    </div>
  );
};