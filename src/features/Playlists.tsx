import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Playlist, Song } from '../App';
import {
  Play,
  Music,
  MoreVertical,
  Trash2,
  Edit2,
  Plus,
  X,
  Check,
  ListPlus,
  ArrowLeft,
  LayoutGrid,
  List,
} from 'lucide-react';

interface PlaylistsProps {
  playlists: Playlist[];
  allSongs: Song[];
  onPlaySongFromList: (song: Song, list: Song[]) => void;
  addToQueue: (song: Song) => void;
  t: any;
  onCreatePlaylist: (name: string, selectedSongs: Song[]) => void;
  onDeletePlaylist: (id: string) => void;
  onRenamePlaylist: (id: string, newName: string) => void;
  onUpdatePlaylistSongs: (id: string, newSongs: Song[]) => void;
  theme: any;
  language: 'fa' | 'en';
}

type ViewMode = 'grid' | 'list';

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
        <img
          key={`${song.id}-${i}`}
          src={song.cover}
          alt=""
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
}) => (
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
      backgroundColor: theme.colors.background,
      border: `1px solid ${theme.colors.border}`,
      color: theme.colors.textPrimary,
      cursor: 'pointer',
      borderRadius: '50%',
      boxShadow: theme.shadows.soft,
      transition: 'transform 0.2s, background-color 0.2s',
      zIndex: 2,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'scale(1.1)';
      e.currentTarget.style.backgroundColor = theme.colors.surface;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.backgroundColor = theme.colors.background;
    }}
  >
    <MoreVertical size={16} />
  </button>
);

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
}) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      padding: '12px 15px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'start',
      color: color ?? theme.colors.textPrimary,
      transition: 'background 0.15s',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.surface)}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    {icon} <span style={{ fontSize: 14 }}>{label}</span>
  </button>
);

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
      backgroundColor: theme.colors.background,
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.border}`,
      boxShadow: theme.shadows.hard,
      zIndex: 30,
      minWidth: 180,
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

/** کارت پلی‌لیست در حالت grid */
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
    <div style={{ position: 'relative' }}>
      <div
        onClick={onOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          padding: 15,
          cursor: 'pointer',
          border: `1px solid ${theme.colors.border}`,
          boxShadow: hovered ? theme.shadows.hard : theme.shadows.soft,
          transform: hovered ? 'scale(1.03)' : 'scale(1)',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        }}
      >
        <PlaylistCover songs={playlist.songs} theme={theme} />
        <h3
          style={{
            fontWeight: 'bold',
            fontSize: 16,
            color: theme.colors.textPrimary,
            marginTop: 10,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {playlist.name}
        </h3>
        <p style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 2 }}>
          {playlist.songs.length} {t.allSongs}
        </p>
      </div>

      <div ref={menuRef} style={{ position: 'absolute', top: 10, insetInlineEnd: 10, zIndex: 3 }}>
        <PlaylistMenuButton isOpen={menuOpen} onClick={onToggleMenu} theme={theme} position="top" offset={0} />
        {menuOpen && (
          <PlaylistMenu onRename={onRename} onAddSong={onAddSong} onDelete={onDelete} theme={theme} t={t} align="end" />
        )}
      </div>
    </div>
  );
};

/** ردیف پلی‌لیست در حالت list */
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
        padding: 12,
        backgroundColor: hovered ? theme.colors.surface : 'transparent',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        cursor: 'pointer',
        transition: 'background 0.2s, transform 0.2s',
        transform: hovered ? 'scale(1.005)' : 'scale(1)',
        position: 'relative',
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

      <div ref={menuRef} style={{ position: 'relative', zIndex: 3 }}>
        <PlaylistMenuButton isOpen={menuOpen} onClick={onToggleMenu} theme={theme} position="inline" />
        {menuOpen && (
          <PlaylistMenu onRename={onRename} onAddSong={onAddSong} onDelete={onDelete} theme={theme} t={t} align="end" />
        )}
      </div>
    </div>
  );
};

/** پوسته‌ی مودال با انیمیشن ورود/خروج با استفاده از framer-motion */
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
  return (
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
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20,
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
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
      transition: 'transform 0.15s',
    }}
    onMouseEnter={(e) => !disabled && (e.currentTarget.style.transform = 'scale(1.05)')}
    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
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
          padding: '10px 14px',
          borderRadius: theme.radius.sm,
          border: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.surface,
          color: theme.colors.textPrimary,
          marginBottom: 12,
          fontSize: 14,
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
                <img
                  src={song.cover}
                  alt=""
                  style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }}
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
        padding: 12,
        borderRadius: theme.radius.sm,
        border: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.surface,
        color: theme.colors.textPrimary,
        marginBottom: 16,
        fontSize: 15,
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
}: {
  song: Song;
  index: number;
  onPlay: () => void;
  onAddToQueue: () => void;
  onRemove: (e: React.MouseEvent) => void;
  theme: any;
  t: any;
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
        gap: 12,
        padding: 10,
        borderBottom: `1px solid ${theme.colors.border}`,
        cursor: 'pointer',
        borderRadius: theme.radius.sm,
        backgroundColor: hovered ? theme.colors.surface : 'transparent',
        transition: 'background 0.2s',
      }}
    >
      <span style={{ color: theme.colors.textSecondary, width: 20, flexShrink: 0 }}>
        {index + 1}
      </span>
      <img
        src={song.cover}
        alt=""
        style={{ width: 44, height: 44, borderRadius: theme.radius.sm, objectFit: 'cover' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 'bold',
            color: theme.colors.textPrimary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {song.name}
        </div>
        <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>{song.artist}</div>
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
          transition: 'transform 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
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
}) => (
  <button
    onClick={onClick}
    style={{
      padding: '6px 10px',
      borderRadius: theme.radius.sm,
      border: 'none',
      cursor: 'pointer',
      backgroundColor: active ? theme.colors.surface : 'transparent',
      color: active ? theme.colors.primary : theme.colors.textSecondary,
      display: 'flex',
      alignItems: 'center',
      transition: 'all 0.15s',
    }}
  >
    {icon}
  </button>
);

// ============================================================
// کامپوننت اصلی
// ============================================================

export const Playlists = ({
  playlists,
  allSongs,
  onPlaySongFromList,
  addToQueue,
  t,
  onCreatePlaylist,
  onDeletePlaylist,
  onRenamePlaylist,
  onUpdatePlaylistSongs,
  theme,
  language,
}: PlaylistsProps) => {
  // شناسه پلی‌لیستی که باز شده تا همیشه با والد سینک باشد
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const activePlaylist = playlists.find((p) => p.id === activePlaylistId) ?? null;

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
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => {
              if (activePlaylist.songs.length > 0) {
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
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
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
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
        paddingBottom: 130,
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
              padding: '10px 16px',
              borderRadius: theme.radius.md,
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Plus size={18} /> {t.createPlaylist}
          </button>
        </div>
      </div>

      {playlists.length === 0 ? (
        <p style={{ color: theme.colors.textSecondary }}>—</p>
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
            {t.deleteSong}
          </ModalButton>
        </div>
      </Modal>
    </div>
  );
};