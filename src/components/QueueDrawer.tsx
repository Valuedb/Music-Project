import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  Shuffle, 
  X, 
  Search, 
  GripVertical, 
  ListMusic, 
  Volume2,
  BookmarkPlus,
  Check
} from 'lucide-react';
import type { Song } from '../types';
import { withAlpha } from '../utils/color';
import { CoverImage } from './CoverImage';

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
  onCreatePlaylist?: (name: string, songs: Song[]) => void;
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
  onCreatePlaylist,
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
  const currentSongRowRef = useRef<HTMLDivElement>(null);

  const handleSavePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = playlistName.trim();
    if (!trimmed || displayQueue.length === 0 || !onCreatePlaylist) return;
    onCreatePlaylist(trimmed, displayQueue);
    setIsSavingPlaylist(false);
    setPlaylistName('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // بستن منو با کلیک بیرون در حالت دسکتاپ
  useEffect(() => {
    if (!isOpen || isMobile) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('[data-queue-toggle]')) return;
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMobile, onClose]);

  // زمان‌سنج ریست تأیید پاک‌کردن صف
  useEffect(() => {
    if (confirmClear) {
      const timer = setTimeout(() => setConfirmClear(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [confirmClear]);

  // ساخت لیست منظم صف پخش (اگر آهنگ جاری در لیست نباشد، در ابتدای آن قرار می‌گیرد)
  const displayQueue = useMemo(() => {
    const list = [...queue];
    if (currentSong && !list.some((s) => s.id === currentSong.id)) {
      list.unshift(currentSong);
    }
    return list;
  }, [queue, currentSong]);

  // پیدا کردن ایندکس آهنگ در حال پخش در لیست صف
  const currentIndex = useMemo(() => {
    if (!currentSong) return -1;
    return displayQueue.findIndex((s) => s.id === currentSong.id);
  }, [displayQueue, currentSong]);

  // اسکرول خودکار و نرم به موقعیت آهنگ در حال پخش هنگام باز شدن پنل
  useEffect(() => {
    if (isOpen && currentSongRowRef.current) {
      const timer = setTimeout(() => {
        currentSongRowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 160);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentIndex]);

  // محاسبه مجموع زمان کل صف
  const totalDurationFormatted = useMemo(() => {
    const totalSecs = displayQueue.reduce((acc, song) => acc + (song.duration || 0), 0);
    if (!totalSecs) return null;
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hours}h ${remMins}m`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, [displayQueue]);

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // لیست با نگه‌داشتن ایندکس اصلی
  const indexedList = useMemo(() => {
    return displayQueue.map((song, originalIndex) => ({ song, originalIndex }));
  }, [displayQueue]);

  // فیلتر جستجو (در صورت تایپ)
  const filteredList = useMemo(() => {
    if (!filterQuery.trim()) return indexedList;
    const q = filterQuery.toLowerCase();
    return indexedList.filter(
      ({ song }) =>
        song.name.toLowerCase().includes(q) ||
        song.artist.toLowerCase().includes(q)
    );
  }, [indexedList, filterQuery]);

  // رویدادهای درگ و دراپ
  const handleDragStart = (e: React.DragEvent, originalIndex: number) => {
    e.dataTransfer.setData('text/plain', originalIndex.toString());
    e.dataTransfer.effectAllowed = 'move';
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

  // استفاده دقیق و مستقیم از متریال و پالت تم
  const primaryColor = theme.colors.primary || '#0a84ff';
  const textPrimary = theme.colors.textPrimary || (theme.isDark ? '#f4f4f5' : '#18181b');
  const textSecondary = theme.colors.textSecondary || (theme.isDark ? '#a1a1aa' : '#71717a');
  const borderColor = theme.colors.border || (theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');
  
  // پس‌زمینه و سایه شیشه‌ای بر اساس تم و پالت فعال (هماهنگ با نوار پلیر)
  const panelBackground = theme.glass?.bar?.background || (theme.isDark ? 'rgba(24, 24, 28, 0.95)' : 'rgba(255, 255, 255, 0.95)');
  const panelBorder = theme.glass?.bar?.border || `1px solid ${borderColor}`;
  const panelShadow = theme.glass?.bar?.boxShadow || (theme.isDark ? '0 20px 48px rgba(0,0,0,0.5)' : '0 16px 40px rgba(0,0,0,0.12)');

  // لایه تاریک بک‌دراپ برای موبایل
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
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
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      style={{
        position: 'fixed',
        bottom: isMobile ? 0 : '86px',
        right: isMobile ? 0 : '24px',
        left: isMobile ? 0 : 'auto',
        width: isMobile ? '100%' : '390px',
        maxHeight: isMobile ? '82vh' : 'calc(100vh - 110px)',
        height: isMobile ? '82vh' : '560px',
        background: panelBackground,
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        borderRadius: isMobile ? '24px 24px 0 0' : '24px',
        border: panelBorder,
        boxShadow: panelShadow,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 99999,
        overflow: 'hidden',
        color: textPrimary,
      }}
    >
      <style>{`
        .q-row { transition: background-color 0.15s ease, border-color 0.15s ease; }
        .q-row:hover .q-del-btn { opacity: 1 !important; }
        .q-row:hover { background-color: ${withAlpha(primaryColor, theme.isDark ? 0.08 : 0.05)} !important; }
      `}</style>

      {/* دستگیره بالا مخصوص موبایل */}
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '2px' }}>
          <div
            style={{
              width: '38px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.2)',
            }}
          />
        </div>
      )}

      {/* هدر ساده و تمیز صف پخش */}
      <div
        style={{
          padding: '16px 20px 12px',
          borderBottom: `1px solid ${borderColor}`,
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
                backgroundColor: withAlpha(primaryColor, 0.14),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: primaryColor,
              }}
            >
              <ListMusic size={18} />
            </div>
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                {t.queueTitle || t.queue || 'صف پخش'}
              </div>
              <div style={{ fontSize: '12px', color: textSecondary, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {currentIndex !== -1 ? (
                  <span>
                    {t.close === 'Close'
                      ? `Track ${currentIndex + 1} of ${displayQueue.length}`
                      : `آهنگ ${currentIndex + 1} از ${displayQueue.length}`}
                  </span>
                ) : (
                  <span>{displayQueue.length} {t.totalTracks || 'آهنگ'}</span>
                )}
                {totalDurationFormatted && (
                  <>
                    <span style={{ opacity: 0.5 }}>·</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{totalDurationFormatted}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ابزارهای هدر: بر زدن، پاک‌کردن، بستن */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {displayQueue.length > 2 && (
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
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = primaryColor;
                  e.currentTarget.style.backgroundColor = withAlpha(primaryColor, 0.1);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = textSecondary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Shuffle size={17} />
              </button>
            )}

            {onCreatePlaylist && displayQueue.length > 0 && (
              <button
                onClick={() => {
                  setIsSavingPlaylist(!isSavingPlaylist);
                  if (!playlistName) {
                    setPlaylistName(
                      t.close === 'Close'
                        ? `Queue - ${new Date().toLocaleDateString('en-US')}`
                        : `صف پخش - ${new Date().toLocaleDateString('fa-IR')}`
                    );
                  }
                }}
                title={t.saveQueueAsPlaylist || 'ذخیره به عنوان پلی‌لیست'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isSavingPlaylist ? primaryColor : textSecondary,
                  cursor: 'pointer',
                  padding: '7px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  backgroundColor: isSavingPlaylist ? withAlpha(primaryColor, 0.12) : 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = primaryColor;
                  e.currentTarget.style.backgroundColor = withAlpha(primaryColor, 0.1);
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

            {displayQueue.length > 0 && (
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
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                  if (!confirmClear) e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  if (!confirmClear) {
                    e.currentTarget.style.color = textSecondary;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Trash2 size={confirmClear ? 13 : 17} />
                {confirmClear && <span>{t.clearQueue || 'حذف'}</span>}
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
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = textPrimary;
                e.currentTarget.style.backgroundColor = withAlpha(textPrimary, 0.08);
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
                backgroundColor: withAlpha(textPrimary, theme.isDark ? 0.05 : 0.03),
                border: `1px solid ${borderColor}`,
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
                  fontSize: '12.5px',
                  color: textPrimary,
                }}
              />
              <button
                type="submit"
                disabled={!playlistName.trim()}
                style={{
                  backgroundColor: primaryColor,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '5px 12px',
                  fontSize: '11.5px',
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
                  fontSize: '11.5px',
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

        {/* فیلتر جستجو تنها در لیست‌های بزرگ (> ۵ قطعه) */}
        {displayQueue.length > 5 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 10px',
              borderRadius: '10px',
              backgroundColor: withAlpha(textPrimary, theme.isDark ? 0.05 : 0.03),
              border: `1px solid ${borderColor}`,
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

      {/* محتوای صف پخش: لیست ترتیبی با هایلایت آهنگ جاری در جایگاه واقعی خود */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {displayQueue.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 20px',
              textAlign: 'center',
              borderRadius: '16px',
              border: `1px dashed ${borderColor}`,
              backgroundColor: withAlpha(textPrimary, 0.02),
              gap: '10px',
              marginTop: '10px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: withAlpha(primaryColor, 0.12),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: primaryColor,
              }}
            >
              <ListMusic size={22} />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: textPrimary }}>
              {t.queueEmpty || 'صف پخش خالی است'}
            </div>
            <div style={{ fontSize: '12px', color: textSecondary, maxWidth: '240px', lineHeight: 1.4 }}>
              {t.queueEmptyHint || 'آهنگ‌ها را برای پخش پیوسته به صف اضافه کنید.'}
            </div>
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: '13px', color: textSecondary }}>
            {t.noResults || 'هیچ نتیجه‌ای یافت نشد'}
          </div>
        ) : (
          filteredList.map(({ song, originalIndex }) => {
            const isCurrent = currentSong?.id === song.id;
            const isPast = currentIndex !== -1 && originalIndex < currentIndex;
            const isItemDragged = draggedIndex === originalIndex;
            const isOver = dragOverIndex === originalIndex;

            return (
              <div
                key={`${song.id}-${originalIndex}`}
                ref={isCurrent ? currentSongRowRef : undefined}
                className="q-row"
                draggable
                onDragStart={(e) => handleDragStart(e, originalIndex)}
                onDragOver={(e) => handleDragOver(e, originalIndex)}
                onDrop={(e) => handleDrop(e, originalIndex)}
                onDragEnd={handleDragEnd}
                onClick={() => onPlaySong(originalIndex)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '12px',
                  backgroundColor: isCurrent
                    ? withAlpha(primaryColor, theme.isDark ? 0.2 : 0.12)
                    : isOver
                    ? withAlpha(primaryColor, 0.15)
                    : withAlpha(textPrimary, theme.isDark ? 0.04 : 0.025),
                  border: isCurrent
                    ? `1px solid ${withAlpha(primaryColor, theme.isDark ? 0.45 : 0.32)}`
                    : isOver
                    ? `1px solid ${primaryColor}`
                    : `1px solid ${withAlpha(textPrimary, 0.06)}`,
                  boxShadow: isCurrent ? `0 4px 16px ${withAlpha(primaryColor, 0.14)}` : 'none',
                  opacity: isItemDragged ? 0.35 : isPast ? 0.65 : 1,
                  transform: isOver ? 'scale(1.01)' : 'scale(1)',
                  position: 'relative',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {/* خط راهنمای درگ زمانی که آیتم روی این سطر قرار دارد */}
                {isOver && draggedIndex !== null && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: primaryColor,
                      boxShadow: `0 0 8px ${primaryColor}`,
                      borderRadius: '1px',
                    }}
                  />
                )}

                {/* شماره ردیف یا انیمیشن اکولایزر برای آهنگ جاری */}
                <div
                  style={{
                    width: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isCurrent ? (
                    isPlaying ? (
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '14px' }}>
                        <motion.div
                          animate={{ height: ['4px', '14px', '6px', '12px', '4px'] }}
                          transition={{ repeat: Infinity, duration: 0.85, ease: 'easeInOut' }}
                          style={{ width: '2.5px', backgroundColor: primaryColor, borderRadius: '1px' }}
                        />
                        <motion.div
                          animate={{ height: ['12px', '5px', '14px', '6px', '12px'] }}
                          transition={{ repeat: Infinity, duration: 0.95, ease: 'easeInOut' }}
                          style={{ width: '2.5px', backgroundColor: primaryColor, borderRadius: '1px' }}
                        />
                        <motion.div
                          animate={{ height: ['7px', '13px', '4px', '14px', '7px'] }}
                          transition={{ repeat: Infinity, duration: 0.75, ease: 'easeInOut' }}
                          style={{ width: '2.5px', backgroundColor: primaryColor, borderRadius: '1px' }}
                        />
                      </div>
                    ) : (
                      <Volume2 size={15} style={{ color: primaryColor }} />
                    )
                  ) : (
                    <span
                      style={{
                        fontSize: '11px',
                        color: textSecondary,
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 500,
                      }}
                    >
                      {originalIndex + 1}
                    </span>
                  )}
                </div>

                {/* کاور آهنگ */}
                <div
                  style={{
                    position: 'relative',
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <CoverImage
                    src={song.cover}
                    alt=""
                    iconSize={16}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>

                {/* نام آهنگ و خواننده */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? primaryColor : textPrimary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.name}</span>
                    {isCurrent && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: primaryColor,
                          opacity: 0.9,
                          flexShrink: 0,
                        }}
                      >
                        {t.close === 'Close' ? '(Now Playing)' : '(در حال پخش)'}
                      </span>
                    )}
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

                {/* زمان قطعه */}
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

                {/* دکمه حذف سطر (در حالت هاور یا تاچ) */}
                <button
                  className="q-del-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFromQueue(originalIndex);
                  }}
                  title={t.removeFromQueue || 'حذف از صف'}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: textSecondary,
                    cursor: 'pointer',
                    padding: '5px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isMobile ? 0.7 : 0,
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = textSecondary;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <X size={15} />
                </button>

                {/* دستگیره جابه‌جایی اختصاصی (Drag Handle) */}
                <div
                  style={{
                    color: textSecondary,
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    flexShrink: 0,
                    touchAction: 'none',
                  }}
                  title={t.close === 'Close' ? 'Drag to reorder' : 'بکشید برای جابه‌جایی'}
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical size={16} />
                </div>
              </div>
            );
          })
        )}
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
