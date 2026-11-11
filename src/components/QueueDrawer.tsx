import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Trash2, 
  Shuffle, 
  ArrowUp, 
  ArrowDown, 
  X, 
  Search, 
  BookmarkPlus, 
  GripVertical, 
  ListMusic, 
  CornerDownLeft,
  Check,
  Heart
} from 'lucide-react';
import type { Song } from '../types';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (index: number) => void;
  onRemoveFromQueue: (index: number) => void;
  onReorderQueue: (fromIndex: number, toIndex: number) => void;
  onClearQueue: () => void;
  onShuffleQueue: () => void;
  onPlayNextInQueue: (index: number) => void;
  onCreatePlaylist?: (name: string, songs: Song[]) => void;
  onToggleFavorite?: (id: string) => void;
  theme: any;
  t: any;
  isMobile: boolean;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  queue,
  currentSong,
  isPlaying,
  onPlaySong,
  onRemoveFromQueue,
  onReorderQueue,
  onClearQueue,
  onShuffleQueue,
  onPlayNextInQueue,
  onCreatePlaylist,
  onToggleFavorite,
  theme,
  t,
  isMobile,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // بستن منو با کلیک بیرون (در دسکتاپ)
  useEffect(() => {
    if (!isOpen || isMobile) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // اگر روی دکمه صف کلیک شده باشه نادیده بگیر
        const target = e.target as HTMLElement;
        if (target.closest('[data-queue-toggle]')) return;
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMobile, onClose]);

  // ریست پیام تایید حذف بعد از ۳ ثانیه
  useEffect(() => {
    if (confirmClear) {
      const timer = setTimeout(() => setConfirmClear(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [confirmClear]);

  // محاسبه مجموع زمان صف
  const totalDurationFormatted = useMemo(() => {
    const totalSecs = queue.reduce((acc, song) => acc + (song.duration || 0), 0);
    if (!totalSecs) return null;
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hours}h ${remMins}m`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, [queue]);

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // لیست فیلتر شده با حفظ اندیس‌های اصلی
  const indexedQueue = useMemo(() => {
    return queue.map((song, originalIndex) => ({ song, originalIndex }));
  }, [queue]);

  const filteredQueue = useMemo(() => {
    if (!filterQuery.trim()) return indexedQueue;
    const q = filterQuery.toLowerCase();
    return indexedQueue.filter(
      ({ song }) =>
        song.name.toLowerCase().includes(q) ||
        song.artist.toLowerCase().includes(q) ||
        (song.album && song.album.toLowerCase().includes(q))
    );
  }, [indexedQueue, filterQuery]);

  const handleSavePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = playlistName.trim();
    if (!trimmed || queue.length === 0 || !onCreatePlaylist) return;
    
    // آهنگ فعلی به همراه کل صف
    const songsToSave = currentSong ? [currentSong, ...queue] : [...queue];
    onCreatePlaylist(trimmed, songsToSave);
    setIsSavingPlaylist(false);
    setPlaylistName('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleDragStart = (e: React.DragEvent, originalIndex: number) => {
    e.dataTransfer.setData('text/plain', originalIndex.toString());
    setDraggedIndex(originalIndex);
  };

  const handleDragOver = (e: React.DragEvent, originalIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === originalIndex) return;
    setDragOverIndex(originalIndex);
  };

  const handleDrop = (e: React.DragEvent, dropTargetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(sourceIndex) && sourceIndex !== dropTargetIndex) {
      onReorderQueue(sourceIndex, dropTargetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (!isOpen) return null;

  const glassBg = theme.isDark
    ? 'rgba(22, 20, 32, 0.94)'
    : 'rgba(255, 255, 255, 0.94)';
  const borderCol = theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const itemBg = theme.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)';
  const itemHoverBg = theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const textPrimary = theme.colors.textPrimary || (theme.isDark ? '#f4f4f5' : '#18181b');
  const textSecondary = theme.colors.textSecondary || (theme.isDark ? '#a1a1aa' : '#71717a');
  const accentColor = theme.colors.primary || '#0a84ff';

  // لایه بک‌دراپ برای حالت موبایل
  const backdrop = isMobile && (
    <motion.div
      key="queue-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99998,
      }}
    />
  );

  const panelContent = (
    <motion.div
      key="queue-panel"
      ref={containerRef}
      initial={isMobile ? { y: '100%' } : { opacity: 0, y: 16, scale: 0.96 }}
      animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
      exit={isMobile ? { y: '100%' } : { opacity: 0, y: 16, scale: 0.96 }}
      transition={{ type: 'spring', damping: 30, stiffness: 320 }}
      style={{
        position: 'fixed',
        bottom: isMobile ? 0 : '86px',
        right: isMobile ? 0 : '24px',
        left: isMobile ? 0 : 'auto',
        width: isMobile ? '100%' : '410px',
        maxHeight: isMobile ? '86vh' : 'calc(100vh - 110px)',
        height: isMobile ? '86vh' : '580px',
        backgroundColor: glassBg,
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        borderRadius: isMobile ? '24px 24px 0 0' : '22px',
        border: `1px solid ${borderCol}`,
        boxShadow: isMobile
          ? '0 -16px 48px rgba(0, 0, 0, 0.45)'
          : '0 24px 64px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 99999,
        overflow: 'hidden',
        color: textPrimary,
      }}
    >
      <style>{`
        .queue-row:hover .play-overlay { opacity: 1 !important; }
        .queue-row:hover { background-color: ${itemHoverBg} !important; }
        .queue-row:active { transform: scale(0.99); }
      `}</style>

      {/* دستگیره سوایپ برای موبایل */}
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '4px' }}>
          <div
            style={{
              width: '36px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)',
            }}
          />
        </div>
      )}

      {/* هدر صف */}
      <div
        style={{
          padding: '16px 20px 14px',
          borderBottom: `1px solid ${borderCol}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accentColor,
              }}
            >
              <ListMusic size={18} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                {t.queueTitle || t.queue || 'صف پخش'}
              </div>
              <div style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>
                <span>{queue.length} {t.totalTracks || 'آهنگ'}</span>
                {totalDurationFormatted && (
                  <>
                    <span style={{ margin: '0 6px', opacity: 0.6 }}>·</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{totalDurationFormatted}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* کلیدهای کنترلی سریع در هدر */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {queue.length > 1 && (
              <button
                onClick={onShuffleQueue}
                title={t.shuffleQueue || 'بر زدن صف'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: textSecondary,
                  cursor: 'pointer',
                  padding: '7px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = accentColor;
                  e.currentTarget.style.backgroundColor = itemHoverBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = textSecondary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Shuffle size={17} />
              </button>
            )}

            {onCreatePlaylist && queue.length > 0 && (
              <button
                onClick={() => {
                  setIsSavingPlaylist(!isSavingPlaylist);
                  if (!playlistName) {
                    setPlaylistName(`صف پخش - ${new Date().toLocaleDateString('fa-IR')}`);
                  }
                }}
                title={t.saveQueueAsPlaylist || 'ذخیره به عنوان پلی‌لیست'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isSavingPlaylist ? accentColor : textSecondary,
                  cursor: 'pointer',
                  padding: '7px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.18s ease',
                  backgroundColor: isSavingPlaylist ? itemHoverBg : 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = accentColor;
                  e.currentTarget.style.backgroundColor = itemHoverBg;
                }}
                onMouseLeave={(e) => {
                  if (!isSavingPlaylist) {
                    e.currentTarget.style.color = textSecondary;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <BookmarkPlus size={17} />
              </button>
            )}

            {queue.length > 0 && (
              <button
                onClick={() => {
                  if (confirmClear) {
                    onClearQueue();
                    setConfirmClear(false);
                  } else {
                    setConfirmClear(true);
                  }
                }}
                title={confirmClear ? (t.clearQueueConfirm || 'حذف همه؟') : (t.clearQueue || 'پاک کردن صف')}
                style={{
                  background: confirmClear ? 'rgba(239, 68, 68, 0.15)' : 'none',
                  border: confirmClear ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
                  color: confirmClear ? '#ef4444' : textSecondary,
                  cursor: 'pointer',
                  padding: confirmClear ? '4px 8px' : '7px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                  if (!confirmClear) e.currentTarget.style.backgroundColor = itemHoverBg;
                }}
                onMouseLeave={(e) => {
                  if (!confirmClear) {
                    e.currentTarget.style.color = textSecondary;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Trash2 size={confirmClear ? 14 : 17} />
                {confirmClear && <span>{t.clearQueue || 'پاک کن'}</span>}
              </button>
            )}

            <button
              onClick={onClose}
              title={t.close || 'بستن'}
              style={{
                background: 'none',
                border: 'none',
                color: textSecondary,
                cursor: 'pointer',
                padding: '7px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = textPrimary;
                e.currentTarget.style.backgroundColor = itemHoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = textSecondary;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* فرم ذخیره پلی‌لیست */}
        <AnimatePresence>
          {isSavingPlaylist && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSavePlaylist}
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                padding: '8px 10px',
                borderRadius: '12px',
                backgroundColor: itemBg,
                border: `1px solid ${borderCol}`,
                overflow: 'hidden',
              }}
            >
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder={t.playlistName || 'نام پلی‌لیست جدید...'}
                autoFocus
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '13px',
                  color: textPrimary,
                }}
              />
              <button
                type="submit"
                disabled={!playlistName.trim()}
                style={{
                  backgroundColor: accentColor,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: playlistName.trim() ? 'pointer' : 'not-allowed',
                  opacity: playlistName.trim() ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Check size={13} />
                <span>{t.save || 'ذخیره'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSavingPlaylist(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: textSecondary,
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '5px 8px',
                }}
              >
                {t.cancel || 'لغو'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* پیام موفقیت ذخیره پلی‌لیست */}
        <AnimatePresence>
          {savedSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{
                fontSize: '12px',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                borderRadius: '8px',
              }}
            >
              <Check size={14} />
              <span>{t.playlistSaved || 'صف در پلی‌لیست ذخیره شد'}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* جستجو در صف (اگر بیش از ۳ آهنگ باشد) */}
        {queue.length > 3 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 10px',
              borderRadius: '10px',
              backgroundColor: itemBg,
              border: `1px solid ${borderCol}`,
            }}
          >
            <Search size={14} style={{ color: textSecondary, flexShrink: 0 }} />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={t.searchInQueue || 'جستجو در صف...'}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                color: textPrimary,
              }}
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: textSecondary,
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* بخش اسکرول‌شونده محتوای صف */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* ۱. آهنگ در حال پخش (Now Playing) */}
        {currentSong && (
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px',
                padding: '0 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{t.nowPlaying || 'در حال پخش'}</span>
              {isPlaying && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '12px' }}>
                  <motion.div
                    animate={{ height: ['4px', '12px', '6px', '11px', '4px'] }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                    style={{ width: '2px', backgroundColor: accentColor, borderRadius: '1px' }}
                  />
                  <motion.div
                    animate={{ height: ['10px', '4px', '12px', '5px', '10px'] }}
                    transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
                    style={{ width: '2px', backgroundColor: accentColor, borderRadius: '1px' }}
                  />
                  <motion.div
                    animate={{ height: ['6px', '11px', '4px', '12px', '6px'] }}
                    transition={{ repeat: Infinity, duration: 0.7, ease: 'easeInOut' }}
                    style={{ width: '2px', backgroundColor: accentColor, borderRadius: '1px' }}
                  />
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '14px',
                backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                border: `1px solid ${accentColor}44`,
                boxShadow: `0 4px 16px ${accentColor}18`,
              }}
            >
              <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
                <img
                  src={currentSong.cover}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '8px',
                    objectFit: 'cover',
                  }}
                />
                {isPlaying && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.35)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                    }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: accentColor }} />
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: accentColor,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentSong.name}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: textSecondary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: '2px',
                  }}
                >
                  {currentSong.artist}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {onToggleFavorite && (
                  <button
                    onClick={() => onToggleFavorite(currentSong.id)}
                    title={currentSong.isFavorite ? t.removeFromFavorites : t.addToFavorites}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: currentSong.isFavorite ? '#ef4444' : textSecondary,
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Heart size={16} fill={currentSong.isFavorite ? '#ef4444' : 'none'} />
                  </button>
                )}
                <span
                  style={{
                    fontSize: '11px',
                    color: textSecondary,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatDuration(currentSong.duration)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ۲. آهنگ‌های در ادامه (Up Next) */}
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '8px',
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>
              {t.upNext || 'در ادامه'} ({filteredQueue.length})
            </span>
            {queue.length > 1 && (
              <span style={{ fontSize: '10px', fontWeight: 500, color: textSecondary, opacity: 0.7 }}>
                {isMobile ? 'از دکمه‌ها برای جابه‌جایی استفاده کنید' : 'بکشید و رها کنید برای جابه‌جایی'}
              </span>
            )}
          </div>

          {queue.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '36px 20px',
                textAlign: 'center',
                borderRadius: '16px',
                border: `1px dashed ${borderCol}`,
                backgroundColor: itemBg,
                gap: '10px',
                marginTop: '4px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: textSecondary,
                }}
              >
                <ListMusic size={24} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: textPrimary }}>
                {t.queueEmpty || 'صف پخش خالی است'}
              </div>
              <div style={{ fontSize: '12px', color: textSecondary, maxWidth: '240px', lineHeight: 1.4 }}>
                {t.queueEmptyHint || 'از منوی هر آهنگ، «افزودن به صف» را بزنید تا پشت سر هم پخش شوند.'}
              </div>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                fontSize: '13px',
                color: textSecondary,
              }}
            >
              {t.noResults || 'هیچ نتیجه‌ای یافت نشد'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredQueue.map(({ song, originalIndex }) => {
                const isItemDragged = draggedIndex === originalIndex;
                const isOver = dragOverIndex === originalIndex;

                return (
                  <div
                    key={`${song.id}-${originalIndex}`}
                    className="queue-row"
                    draggable
                    onDragStart={(e) => handleDragStart(e, originalIndex)}
                    onDragOver={(e) => handleDragOver(e, originalIndex)}
                    onDrop={(e) => handleDrop(e, originalIndex)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '12px',
                      backgroundColor: isOver
                        ? accentColor + '22'
                        : itemBg,
                      border: isOver
                        ? `1px solid ${accentColor}`
                        : `1px solid ${borderCol}`,
                      opacity: isItemDragged ? 0.45 : 1,
                      transform: isOver ? 'scale(1.01)' : 'scale(1)',
                      transition: 'all 0.16s ease',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                    onClick={() => onPlaySong(originalIndex)}
                  >
                    {/* آیکون دستگیره درگ */}
                    <div
                      style={{
                        color: textSecondary,
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.6,
                        flexShrink: 0,
                      }}
                      title="بکشید برای جابه‌جایی"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical size={16} />
                    </div>

                    {/* کاور با هاور پخش */}
                    <div
                      style={{
                        position: 'relative',
                        width: '38px',
                        height: '38px',
                        flexShrink: 0,
                        borderRadius: '7px',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={song.cover}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <div
                        className="play-overlay"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.16s ease',
                          color: '#ffffff',
                        }}
                      >
                        <Play size={14} fill="#ffffff" />
                      </div>
                    </div>

                    {/* عنوان و خواننده */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: textPrimary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {song.name}
                      </div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          color: textSecondary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '1px',
                        }}
                      >
                        {song.artist}
                      </div>
                    </div>

                    {/* زمان آهنگ */}
                    <span
                      style={{
                        fontSize: '11px',
                        color: textSecondary,
                        fontVariantNumeric: 'tabular-nums',
                        flexShrink: 0,
                      }}
                    >
                      {formatDuration(song.duration)}
                    </span>

                    {/* نوار عملیات آیتم */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        flexShrink: 0,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* انتقال به بالا */}
                      {originalIndex > 0 && (
                        <button
                          onClick={() => onReorderQueue(originalIndex, originalIndex - 1)}
                          title={t.moveUp || 'انتقال به بالا'}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: textSecondary,
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.16s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = textPrimary)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = textSecondary)}
                        >
                          <ArrowUp size={14} />
                        </button>
                      )}

                      {/* انتقال به پایین */}
                      {originalIndex < queue.length - 1 && (
                        <button
                          onClick={() => onReorderQueue(originalIndex, originalIndex + 1)}
                          title={t.moveDown || 'انتقال به پایین'}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: textSecondary,
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.16s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = textPrimary)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = textSecondary)}
                        >
                          <ArrowDown size={14} />
                        </button>
                      )}

                      {/* پخش بلافاصله پس از آهنگ جاری (Play Next) */}
                      {originalIndex > 0 && (
                        <button
                          onClick={() => onPlayNextInQueue(originalIndex)}
                          title={t.playNext || 'پخش به عنوان بعدی'}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: textSecondary,
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.16s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = accentColor)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = textSecondary)}
                        >
                          <CornerDownLeft size={14} />
                        </button>
                      )}

                      {/* حذف از صف */}
                      <button
                        onClick={() => onRemoveFromQueue(originalIndex)}
                        title={t.removeFromQueue || 'حذف از صف'}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: textSecondary,
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.16s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = textSecondary)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {backdrop}
      {panelContent}
    </AnimatePresence>
  );
};
