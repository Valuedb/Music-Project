import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FolderPlus,
  FolderUp,
  Play,
  LayoutGrid,
  List,
  MoreHorizontal,
  Edit2,
  Trash2,
  Plus,
  Check,
} from 'lucide-react';
import type { Song, Playlist } from '../types';
import { AllSongs } from './AllSongs';
import { CoverImage } from '../components/CoverImage';
import { extractSongsBatched } from '../utils/audioMetadata';

interface FoldersProps {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  playlists: Playlist[];
  customFolders: string[];
  onCreateFolder: (name: string) => void;
  onRenameFolder: (oldName: string, newName: string) => void;
  onDeleteFolder: (name: string) => void;
  onAssignSongsToFolder: (songIds: string[], folderName: string) => void;
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
  initialFolder?: { id: string; token: number } | null;
}

const UNCATEGORIZED_ID = '__uncategorized__';

interface FolderEntry {
  id: string;
  name: string;
  isUncategorized: boolean;
  songs: Song[];
}

type ViewMode = 'grid' | 'list';

const FolderModal: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  theme: any;
  width?: number;
}> = ({ open, onClose, children, theme, width = 420 }) => {
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

export const Folders: React.FC<FoldersProps> = ({
  songs,
  setSongs,
  playlists,
  customFolders,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onAssignSongsToFolder,
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
  initialFolder = null,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(() =>
    initialFolder ? initialFolder.id : null
  );
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (initialFolder) {
      setSelectedFolderId(initialFolder.id);
    }
  }, [initialFolder]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');

  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [addSongsFolder, setAddSongsFolder] = useState<string | null>(null);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [modalQuery, setModalQuery] = useState('');

  const folderInputRef = useRef<HTMLInputElement>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!activeMenuId) return;
      const ref = menuRefs.current[activeMenuId];
      if (ref && !ref.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeMenuId]);

  const uncategorizedLabel = t.uncategorizedFolder || 'بدون فولدر';

  const folders = useMemo<FolderEntry[]>(() => {
    const folderSongsMap = new Map<string, Song[]>();
    customFolders.forEach((f) => {
      const trimmed = f.trim();
      if (trimmed && !folderSongsMap.has(trimmed)) {
        folderSongsMap.set(trimmed, []);
      }
    });

    const uncategorizedSongs: Song[] = [];
    songs.forEach((song) => {
      const folderName = song.folder?.trim();
      if (folderName) {
        const list = folderSongsMap.get(folderName);
        if (list) list.push(song);
        else folderSongsMap.set(folderName, [song]);
      } else {
        uncategorizedSongs.push(song);
      }
    });

    const entries: FolderEntry[] = Array.from(folderSongsMap.entries())
      .map(([name, list]) => ({
        id: name,
        name,
        isUncategorized: false,
        songs: list,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (uncategorizedSongs.length > 0) {
      entries.push({
        id: UNCATEGORIZED_ID,
        name: uncategorizedLabel,
        isUncategorized: true,
        songs: uncategorizedSongs,
      });
    }

    return entries;
  }, [songs, customFolders, uncategorizedLabel]);

  const activeFolder = useMemo(
    () => (selectedFolderId ? folders.find((f) => f.id === selectedFolderId) || null : null),
    [selectedFolderId, folders]
  );

  const handleImportDirectory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = input.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    try {
      const fallbackName = activeFolder && !activeFolder.isUncategorized ? activeFolder.name : undefined;
      const imported = await extractSongsBatched(Array.from(files), fallbackName);
      if (imported.length > 0) {
        setSongs((prev) => [...prev, ...imported]);
      }
    } finally {
      setIsImporting(false);
      input.value = '';
    }
  };

  const handleCreateSubmit = () => {
    const trimmed = createName.trim();
    if (!trimmed) return;
    onCreateFolder(trimmed);
    setCreateName('');
    setCreateOpen(false);
  };

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (renameTarget && trimmed && trimmed !== renameTarget) {
      onRenameFolder(renameTarget, trimmed);
      if (selectedFolderId === renameTarget) {
        setSelectedFolderId(trimmed);
      }
    }
    setRenameTarget(null);
    setRenameValue('');
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDeleteFolder(deleteTarget);
      if (selectedFolderId === deleteTarget) {
        setSelectedFolderId(null);
      }
    }
    setDeleteTarget(null);
  };

  const openAddSongsModal = (folderName: string) => {
    setAddSongsFolder(folderName);
    setSelectedSongIds([]);
    setModalQuery('');
    setActiveMenuId(null);
  };

  const handleConfirmAddSongs = () => {
    if (!addSongsFolder || selectedSongIds.length === 0) return;
    onAssignSongsToFolder(selectedSongIds, addSongsFolder);
    setAddSongsFolder(null);
    setSelectedSongIds([]);
  };

  const filteredModalSongs = useMemo(() => {
    const q = modalQuery.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) => s.name.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
  }, [songs, modalQuery]);

  const directoryInputProps = {
    webkitdirectory: '',
    directory: '',
  } as React.InputHTMLAttributes<HTMLInputElement>;

  const hiddenDirectoryInput = (
    <input
      ref={folderInputRef}
      type="file"
      multiple
      accept="audio/*"
      {...directoryInputProps}
      onChange={handleImportDirectory}
      style={{ display: 'none' }}
    />
  );

  // نمای داخل یک فولدر
  if (selectedFolderId && activeFolder) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {hiddenDirectoryInput}
        {!activeFolder.isUncategorized && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              padding: '12px clamp(16px, 4vw, 40px) 0',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => openAddSongsModal(activeFolder.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.surface,
                color: theme.colors.textPrimary,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <Plus size={15} />
              <span>{t.addSong || 'افزودن آهنگ'}</span>
            </button>

            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              disabled={isImporting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: theme.radius.md,
                border: 'none',
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
                cursor: isImporting ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                opacity: isImporting ? 0.65 : 1,
              }}
            >
              <FolderUp size={15} />
              <span>{isImporting ? (t.loading || 'در حال خواندن...') : (t.importFolder || 'وارد کردن پوشه')}</span>
            </button>
          </div>
        )}

        <AllSongs
          songs={activeFolder.songs}
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
          title={activeFolder.name}
          onBack={() => setSelectedFolderId(null)}
          emptyMessage={t.noSongs}
          glassCardCovers={glassCardCovers}
        />

        {/* مودال افزودن آهنگ به فولدر */}
        <FolderModal open={addSongsFolder !== null} onClose={() => setAddSongsFolder(null)} theme={theme} width={500}>
          <h2 style={{ margin: '0 0 14px 0', fontSize: 19, color: theme.colors.textPrimary }}>
            {t.addSongsToFolder || 'افزودن آهنگ به فولدر'}
          </h2>
          <input
            type="text"
            value={modalQuery}
            onChange={(e) => setModalQuery(e.target.value)}
            placeholder={t.search}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 14px',
              borderRadius: theme.radius.md,
              border: `1.5px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textPrimary,
              marginBottom: 14,
              fontSize: 14,
              outline: 'none',
            }}
          />
          <div style={{ maxHeight: '48vh', overflowY: 'auto', marginBottom: 16 }}>
            {filteredModalSongs.map((song) => {
              const already = song.folder?.trim() === addSongsFolder;
              const isSelected = selectedSongIds.includes(song.id);
              return (
                <div
                  key={song.id}
                  onClick={() =>
                    !already &&
                    setSelectedSongIds((prev) =>
                      prev.includes(song.id) ? prev.filter((id) => id !== song.id) : [...prev, song.id]
                    )
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: 8,
                    borderRadius: theme.radius.sm,
                    cursor: already ? 'not-allowed' : 'pointer',
                    opacity: already ? 0.45 : 1,
                    backgroundColor: isSelected ? theme.colors.surface : 'transparent',
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      border: isSelected ? `2px solid ${theme.colors.primary}` : `2px solid ${theme.colors.textSecondary}`,
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
                    style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: theme.colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {song.name}
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>{song.artist}</div>
                  </div>
                  {already && (
                    <span style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                      {t.alreadyAdded || 'قبلاً اضافه شده'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={() => setAddSongsFolder(null)}
              style={{
                padding: '9px 16px',
                borderRadius: theme.radius.sm,
                border: 'none',
                backgroundColor: theme.colors.border,
                color: theme.colors.textPrimary,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {t.cancel}
            </button>
            <button
              type="button"
              disabled={selectedSongIds.length === 0}
              onClick={handleConfirmAddSongs}
              style={{
                padding: '9px 16px',
                borderRadius: theme.radius.sm,
                border: 'none',
                backgroundColor: theme.colors.primary,
                color: '#fff',
                cursor: selectedSongIds.length === 0 ? 'not-allowed' : 'pointer',
                opacity: selectedSongIds.length === 0 ? 0.5 : 1,
                fontWeight: 600,
              }}
            >
              {t.add} ({selectedSongIds.length})
            </button>
          </div>
        </FolderModal>
      </div>
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
      {hiddenDirectoryInput}

      {/* هدر فولدربندی‌ها */}
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
            {t.foldersTitle || t.folders || 'فولدربندی‌ها'}
          </h1>
          <div
            style={{
              marginTop: '4px',
              fontSize: '13px',
              color: theme.colors.textSecondary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {folders.length} {t.foldersCountLabel || 'فولدر'} · {songs.length} {t.tracksCount || 'آهنگ'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* سوییچ گرید/لیست */}
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
              }}
            >
              <List size={16} />
            </button>
          </div>

          {/* دکمه ساخت فولدر */}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 15px',
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textPrimary,
              cursor: 'pointer',
              fontSize: '13.5px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            <FolderPlus size={16} color={theme.colors.primary} />
            <span>{t.createFolder || 'ساخت فولدر'}</span>
          </button>

          {/* دکمه وارد کردن پوشه از دستگاه */}
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={isImporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 16px',
              borderRadius: theme.radius.md,
              border: 'none',
              backgroundColor: theme.colors.primary,
              color: '#ffffff',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              fontSize: '13.5px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: `0 2px 10px ${theme.colors.primary}44`,
              opacity: isImporting ? 0.65 : 1,
            }}
          >
            <FolderUp size={16} />
            <span>{isImporting ? (t.loading || 'در حال خواندن...') : (t.importFolder || 'وارد کردن پوشه')}</span>
          </button>
        </div>
      </div>

      {/* لیست فولدرها */}
      {folders.length === 0 ? (
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
          <Folder size={36} style={{ opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 500 }}>
            {t.noFolders || 'هنوز فولدری ساخته یا وارد نشده است.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
            gap: '16px',
          }}
        >
          {folders.map((folder) => {
            const isHovered = hoveredId === folder.id;
            const isMenuOpen = activeMenuId === folder.id;
            const covers = folder.songs.slice(0, 4);
            return (
              <div
                key={folder.id}
                style={{ position: 'relative', zIndex: isMenuOpen ? 50 : isHovered ? 2 : 1 }}
              >
                <div
                  onClick={() => setSelectedFolderId(folder.id)}
                  onMouseEnter={() => setHoveredId(folder.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    backgroundColor: isHovered
                      ? (theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.88)')
                      : theme.colors.surface,
                    backdropFilter: 'blur(26px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(26px) saturate(180%)',
                    borderRadius: theme.radius.xl || '22px',
                    padding: '16px',
                    cursor: 'pointer',
                    border: `1px solid ${isHovered ? (theme.colors.borderLight || theme.colors.primary + '88') : theme.colors.border}`,
                    boxShadow: isHovered
                      ? `0 16px 36px rgba(0, 0, 0, 0.32), 0 0 20px ${theme.colors.glow || theme.colors.primary}28`
                      : (theme.isDark ? '0 8px 24px rgba(0, 0, 0, 0.22)' : '0 4px 14px rgba(0, 0, 0, 0.05)'),
                    transition: 'all 0.22s cubic-bezier(0.2, 0, 0, 1)',
                    transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '1 / 1',
                      borderRadius: theme.radius.md || '14px',
                      overflow: 'hidden',
                      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: covers.length > 0 ? 'grid' : 'flex',
                      gridTemplateColumns: '1fr 1fr',
                      gridTemplateRows: '1fr 1fr',
                      gap: '2px',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {covers.length === 0 ? (
                      <Folder size={44} color={theme.colors.primary} style={{ opacity: 0.7 }} />
                    ) : (
                      <>
                        {covers.map((s, idx) => (
                          <CoverImage
                            key={`${s.id}-${idx}`}
                            src={s.cover}
                            alt=""
                            iconSize={16}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ))}
                        {Array.from({ length: 4 - covers.length }).map((_, idx) => (
                          <div
                            key={`e-${idx}`}
                            style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                          />
                        ))}
                      </>
                    )}

                    {folder.songs.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlaySongFromList(folder.songs[0], folder.songs);
                        }}
                        title={t.playAll || 'پخش همه'}
                        style={{
                          position: 'absolute',
                          bottom: '8px',
                          insetInlineEnd: '8px',
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
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
                    <Folder size={15} color={theme.colors.primary} style={{ flexShrink: 0 }} />
                    <h3
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: '15px',
                        color: theme.colors.textPrimary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {folder.name}
                    </h3>
                  </div>
                  <p
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: '12.5px',
                      margin: '3px 0 0 0',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {folder.songs.length} {t.tracksCount || 'آهنگ'}
                  </p>
                </div>

                {!folder.isUncategorized && (
                  <div
                    ref={(el) => {
                      menuRefs.current[folder.id] = el;
                    }}
                    style={{ position: 'absolute', top: '12px', insetInlineEnd: '12px', zIndex: 50 }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(isMenuOpen ? null : folder.id);
                      }}
                      aria-label="folder-menu"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: isMenuOpen ? theme.colors.surface : 'rgba(0,0,0,0.35)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <MoreHorizontal size={17} />
                    </button>

                    {isMenuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 6px)',
                          insetInlineEnd: 0,
                          padding: '5px',
                          backgroundColor: theme.isDark ? 'rgba(22, 18, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)',
                          backdropFilter: 'blur(26px)',
                          borderRadius: theme.radius.md,
                          border: `1px solid ${theme.colors.border}`,
                          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.42)',
                          minWidth: 180,
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setRenameTarget(folder.name);
                            setRenameValue(folder.name);
                            setActiveMenuId(null);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme.isDark
                              ? 'rgba(255, 255, 255, 0.12)'
                              : 'rgba(0, 0, 0, 0.07)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
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
                            color: theme.colors.textPrimary,
                            fontSize: 13.5,
                            fontWeight: 500,
                            transition: 'background-color 0.12s ease',
                          }}
                        >
                          <Edit2 size={15} /> <span>{t.renameFolder || 'تغییر نام'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openAddSongsModal(folder.name)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme.isDark
                              ? 'rgba(255, 255, 255, 0.12)'
                              : 'rgba(0, 0, 0, 0.07)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
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
                            color: theme.colors.textPrimary,
                            fontSize: 13.5,
                            fontWeight: 500,
                            transition: 'background-color 0.12s ease',
                          }}
                        >
                          <Plus size={15} /> <span>{t.addSong || 'افزودن آهنگ'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget(folder.name);
                            setActiveMenuId(null);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 69, 58, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
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
                            color: theme.colors.danger,
                            fontSize: 13.5,
                            fontWeight: 500,
                            transition: 'background-color 0.12s ease',
                          }}
                        >
                          <Trash2 size={15} /> <span>{t.deleteFolder || 'حذف فولدر'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {folders.map((folder) => {
            const isHovered = hoveredId === folder.id;
            const isMenuOpen = activeMenuId === folder.id;
            return (
              <div
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                onMouseEnter={() => setHoveredId(folder.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '10px 16px',
                  backgroundColor: isHovered ? hoverBg : theme.colors.surface,
                  backdropFilter: 'blur(22px) saturate(170%)',
                  WebkitBackdropFilter: 'blur(22px) saturate(170%)',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: isMenuOpen ? 50 : 1,
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: theme.colors.primary + '1F',
                    color: theme.colors.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Folder size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: theme.colors.textPrimary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {folder.name}
                  </div>
                  <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                    {folder.songs.length} {t.tracksCount || 'آهنگ'}
                  </div>
                </div>
                {folder.songs.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlaySongFromList(folder.songs[0], folder.songs);
                    }}
                    title={t.playAll || 'پخش همه'}
                    style={{
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
                      flexShrink: 0,
                    }}
                  >
                    <Play size={15} fill="#ffffff" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* مودال ساخت فولدر */}
      <FolderModal open={createOpen} onClose={() => setCreateOpen(false)} theme={theme}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 19, color: theme.colors.textPrimary }}>
          {t.createFolder || 'ساخت فولدر'}
        </h2>
        <input
          type="text"
          value={createName}
          onChange={(e) => setCreateName(e.target.value)}
          placeholder={t.folderName || 'نام فولدر...'}
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
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={() => setCreateOpen(false)}
            style={{
              padding: '10px 18px',
              borderRadius: theme.radius.sm,
              border: 'none',
              backgroundColor: theme.colors.border,
              color: theme.colors.textPrimary,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            disabled={!createName.trim()}
            onClick={handleCreateSubmit}
            style={{
              padding: '10px 18px',
              borderRadius: theme.radius.sm,
              border: 'none',
              backgroundColor: theme.colors.primary,
              color: '#fff',
              cursor: createName.trim() ? 'pointer' : 'not-allowed',
              opacity: createName.trim() ? 1 : 0.5,
              fontWeight: 600,
            }}
          >
            {t.create}
          </button>
        </div>
      </FolderModal>

      {/* مودال تغییر نام فولدر */}
      <FolderModal open={renameTarget !== null} onClose={() => setRenameTarget(null)} theme={theme}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 19, color: theme.colors.textPrimary }}>
          {t.renameFolder || 'تغییر نام فولدر'}
        </h2>
        <input
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
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
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={() => setRenameTarget(null)}
            style={{
              padding: '10px 18px',
              borderRadius: theme.radius.sm,
              border: 'none',
              backgroundColor: theme.colors.border,
              color: theme.colors.textPrimary,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            disabled={!renameValue.trim()}
            onClick={handleRenameSubmit}
            style={{
              padding: '10px 18px',
              borderRadius: theme.radius.sm,
              border: 'none',
              backgroundColor: theme.colors.primary,
              color: '#fff',
              cursor: renameValue.trim() ? 'pointer' : 'not-allowed',
              opacity: renameValue.trim() ? 1 : 0.5,
              fontWeight: 600,
            }}
          >
            {t.save}
          </button>
        </div>
      </FolderModal>

      {/* مودال حذف فولدر */}
      <FolderModal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} theme={theme}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: 19, color: theme.colors.textPrimary }}>
          {t.deleteFolder || 'حذف فولدر'}
        </h2>
        <p style={{ margin: '0 0 20px 0', color: theme.colors.textSecondary, fontSize: 14 }}>
          {t.deleteFolderConfirm || 'آیا از حذف این فولدر مطمئن هستید؟ (آهنگ‌ها در کتابخانه باقی می‌مانند)'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            style={{
              padding: '10px 18px',
              borderRadius: theme.radius.sm,
              border: 'none',
              backgroundColor: theme.colors.border,
              color: theme.colors.textPrimary,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleDeleteConfirm}
            style={{
              padding: '10px 18px',
              borderRadius: theme.radius.sm,
              border: 'none',
              backgroundColor: theme.colors.danger || '#ef4444',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {t.deleteFolder || 'حذف فولدر'}
          </button>
        </div>
      </FolderModal>

      {/* مودال افزودن آهنگ از لیست اصلی به یک فولدر */}
      <FolderModal open={addSongsFolder !== null} onClose={() => setAddSongsFolder(null)} theme={theme} width={500}>
        <h2 style={{ margin: '0 0 14px 0', fontSize: 19, color: theme.colors.textPrimary }}>
          {t.addSongsToFolder || 'افزودن آهنگ به فولدر'}
        </h2>
        <input
          type="text"
          value={modalQuery}
          onChange={(e) => setModalQuery(e.target.value)}
          placeholder={t.search}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px 14px',
            borderRadius: theme.radius.md,
            border: `1.5px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.surface,
            color: theme.colors.textPrimary,
            marginBottom: 14,
            fontSize: 14,
            outline: 'none',
          }}
        />
        <div style={{ maxHeight: '48vh', overflowY: 'auto', marginBottom: 16 }}>
          {filteredModalSongs.map((song) => {
            const already = song.folder?.trim() === addSongsFolder;
            const isSelected = selectedSongIds.includes(song.id);
            return (
              <div
                key={song.id}
                onClick={() =>
                  !already &&
                  setSelectedSongIds((prev) =>
                    prev.includes(song.id) ? prev.filter((id) => id !== song.id) : [...prev, song.id]
                  )
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 8,
                  borderRadius: theme.radius.sm,
                  cursor: already ? 'not-allowed' : 'pointer',
                  opacity: already ? 0.45 : 1,
                  backgroundColor: isSelected ? theme.colors.surface : 'transparent',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: isSelected ? `2px solid ${theme.colors.primary}` : `2px solid ${theme.colors.textSecondary}`,
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
                  style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: theme.colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {song.name}
                  </div>
                  <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>{song.artist}</div>
                </div>
                {already && (
                  <span style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                    {t.alreadyAdded || 'قبلاً اضافه شده'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={() => setAddSongsFolder(null)}
            style={{
              padding: '9px 16px',
              borderRadius: theme.radius.sm,
              border: 'none',
              backgroundColor: theme.colors.border,
              color: theme.colors.textPrimary,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            disabled={selectedSongIds.length === 0}
            onClick={handleConfirmAddSongs}
            style={{
              padding: '9px 16px',
              borderRadius: theme.radius.sm,
              border: 'none',
              backgroundColor: theme.colors.primary,
              color: '#fff',
              cursor: selectedSongIds.length === 0 ? 'not-allowed' : 'pointer',
              opacity: selectedSongIds.length === 0 ? 0.5 : 1,
              fontWeight: 600,
            }}
          >
            {t.add} ({selectedSongIds.length})
          </button>
        </div>
      </FolderModal>
    </div>
  );
};
