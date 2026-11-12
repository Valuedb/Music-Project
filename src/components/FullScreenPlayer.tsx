import React, { useState, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Shuffle, Trash2, GripVertical, X, ListMusic, Music } from 'lucide-react';
import type { RepeatMode, Song } from '../types';
import { withAlpha } from '../utils/color';
import { CoverImage } from './CoverImage';

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playNext: () => boolean | void;
  playPrev: () => boolean | void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (newVol: number) => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: RepeatMode;
  onToggleRepeat: () => void;
  queue: Song[];
  removeFromQueue: (index: number) => void;
  onToggleFavorite?: (id: string) => void;
  reorderQueue?: (fromIndex: number, toIndex: number) => void;
  onPlayQueueSong?: (index: number) => void;
  onClearQueue?: () => void;
  onShuffleQueue?: () => void;
  t: any;
  theme: any;
}

export const FullScreenPlayer: React.FC<FullScreenPlayerProps> = memo(({
  isOpen,
  onClose,
  currentSong,
  isPlaying,
  onTogglePlay,
  playNext,
  playPrev,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
  queue,
  removeFromQueue,
  onToggleFavorite,
  reorderQueue,
  onPlayQueueSong,
  onClearQueue,
  onShuffleQueue,
  t,
  theme,
}) => {
  const [showQueue, setShowQueue] = useState(false);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [isHoveringVolume, setIsHoveringVolume] = useState(false);
  const [isHeartPopping, setIsHeartPopping] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [coverError, setCoverError] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const currentSongRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCoverError(false);
  }, [currentSong?.id, currentSong?.cover]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const currentQueueIdx = currentSong ? queue.findIndex((s) => s.id === currentSong.id) : -1;

  useEffect(() => {
    if (isOpen && showQueue && currentSongRowRef.current) {
      const timer = setTimeout(() => {
        currentSongRowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showQueue, currentQueueIdx]);

  if (typeof document === 'undefined') return null;

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const volumePercent = Math.max(0, Math.min(100, volume * 100));

  const primaryColor = theme?.colors?.primary || '#0a84ff';
  const songTitleColor = '#ffffff';
  const artistColor = 'rgba(255, 255, 255, 0.72)';
  const iconColor = '#ffffff';
  const iconActiveColor = primaryColor;
  const iconInactiveColor = 'rgba(255, 255, 255, 0.5)';
  const glowColor = `0 0 12px ${withAlpha(primaryColor, 0.7)}`;

  const btnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex && reorderQueue) {
      reorderQueue(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && currentSong && (
        <motion.div
          key="full-screen-player"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] } }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: '#0e0e13',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            direction: 'ltr',
          }}
        >
          {/* پس‌زمینه محو داینامیک کاور */}
          {currentSong.cover && !coverError ? (
            <motion.div
              initial={{ opacity: 0, scale: 1.44 }}
              animate={{ opacity: 1, scale: 1.3 }}
              exit={{ opacity: 0, scale: 1.38 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${currentSong.cover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(85px) brightness(0.35) saturate(1.7)',
                pointerEvents: 'none',
              }}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.36 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at 50% 35%, ${withAlpha(primaryColor, 0.16)} 0%, transparent 65%)`,
                pointerEvents: 'none',
              }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(12, 12, 16, 0.55)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              pointerEvents: 'none',
            }}
          />

          {/* محتوای داخلی تمام‌صفحه */}
          <motion.div
            initial={{ opacity: 0, y: 44, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 36, scale: 0.96, transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] } }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              width: '100%',
              maxWidth: isMobile ? '420px' : '540px',
              margin: '0 auto',
              padding: isMobile
                ? 'clamp(14px, 2.5vh, 22px) 22px clamp(32px, 6.5vh, 52px)'
                : 'clamp(16px, 2.5vh, 24px) 28px clamp(34px, 6.5vh, 54px)',
              boxSizing: 'border-box',
              justifyContent: 'space-between',
            }}
          >
            {/* هدر: دستگیره کشویی، دکمه بستن، عنوان و گزینه‌های علاقه‌مندی و صف */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', flexShrink: 0 }}>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  ...btnStyle,
                  width: '40px',
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: 'rgba(255, 255, 255, 0.35)',
                  marginBottom: '10px',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  position: 'relative',
                }}
              >
                <button
                  onClick={onClose}
                  title={t.close || 'بستن'}
                  style={{
                    ...btnStyle,
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    transition: 'background-color 0.2s',
                    zIndex: 2,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                <span
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.72)',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.nowPlaying || 'در حال پخش'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2 }}>
                  {onToggleFavorite && (
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      whileHover={{ opacity: 0.82 }}
                      animate={
                        isHeartPopping
                          ? { scale: [1, 1.35, 0.9, 1.12, 1] }
                          : { scale: 1 }
                      }
                      transition={{ duration: 0.32, ease: 'easeOut' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(currentSong.id);
                        setIsHeartPopping(true);
                        setTimeout(() => setIsHeartPopping(false), 450);
                      }}
                      title={
                        currentSong.isFavorite
                          ? t.removeFromFavorites || 'Remove from Favourites'
                          : t.addToFavorites || 'Add to Favourites'
                      }
                      style={{
                        ...btnStyle,
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: currentSong.isFavorite
                          ? 'rgba(255, 59, 48, 0.28)'
                          : 'rgba(255, 255, 255, 0.1)',
                        color: currentSong.isFavorite ? '#ff3b30' : '#ffffff',
                        boxShadow: currentSong.isFavorite
                          ? '0 0 16px rgba(255, 59, 48, 0.6)'
                          : 'none',
                      }}
                    >
                      <Heart
                        size={19}
                        fill={currentSong.isFavorite ? '#ff3b30' : 'none'}
                        color={currentSong.isFavorite ? '#ff3b30' : '#ffffff'}
                        strokeWidth={currentSong.isFavorite ? 0 : 2}
                      />
                    </motion.button>
                  )}

                  <button
                    onClick={() => setShowQueue(!showQueue)}
                    title={t.queue || 'Queue'}
                    style={{
                      ...btnStyle,
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: showQueue
                        ? withAlpha(primaryColor, 0.25)
                        : 'rgba(255, 255, 255, 0.1)',
                      color: showQueue ? iconActiveColor : '#ffffff',
                      transition: 'all 0.2s',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* محتوای وسط: کاور + عنوان یا صف پخش */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 0,
                padding: '8px 0',
                width: '100%',
              }}
            >
              {showQueue ? (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '360px',
                    backgroundColor: 'rgba(18, 18, 24, 0.55)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    borderRadius: '20px',
                    padding: '16px',
                    boxSizing: 'border-box',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      paddingBottom: '10px',
                      flexShrink: 0,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                        {t.queueTitle || t.queue || 'صف پخش'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px' }}>
                        {currentQueueIdx !== -1 ? (
                          <span>
                            {t.close === 'Close'
                              ? `Track ${currentQueueIdx + 1} of ${queue.length}`
                              : `آهنگ ${currentQueueIdx + 1} از ${queue.length}`}
                          </span>
                        ) : (
                          <span>
                            {queue.length} {t.totalTracks || 'آهنگ'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {queue.length > 2 && onShuffleQueue && (
                        <button
                          onClick={onShuffleQueue}
                          title={t.shuffleQueue || 'بر زدن صف'}
                          style={{
                            ...btnStyle,
                            color: 'rgba(255, 255, 255, 0.72)',
                            padding: '6px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          }}
                        >
                          <Shuffle size={15} />
                        </button>
                      )}
                      {queue.length > 0 && onClearQueue && (
                        <button
                          onClick={onClearQueue}
                          title={t.clearQueue || 'پاک کردن صف'}
                          style={{
                            ...btnStyle,
                            color: 'rgba(255, 255, 255, 0.72)',
                            padding: '6px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {queue.length === 0 ? (
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '13px',
                        textAlign: 'center',
                        padding: '32px 12px',
                      }}
                    >
                      <ListMusic size={24} style={{ opacity: 0.55 }} />
                      <span>{t.queueEmpty || 'صف پخش خالی است'}</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        paddingInlineEnd: '4px',
                      }}
                    >
                      {queue.map((song, index) => {
                        const isCurrent = currentSong?.id === song.id;
                        const isPast = currentQueueIdx !== -1 && index < currentQueueIdx;
                        const isItemDragged = draggedIndex === index;
                        const isOver = dragOverIndex === index;

                        return (
                          <div
                            key={`${song.id}-${index}`}
                            ref={isCurrent ? currentSongRowRef : undefined}
                            draggable={Boolean(reorderQueue)}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            onClick={() => onPlayQueueSong?.(index)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 10px',
                              borderRadius: '12px',
                              backgroundColor: isCurrent
                                ? withAlpha(primaryColor, 0.22)
                                : isOver
                                ? withAlpha(primaryColor, 0.16)
                                : 'rgba(255, 255, 255, 0.05)',
                              border: isCurrent
                                ? `1px solid ${withAlpha(primaryColor, 0.48)}`
                                : isOver
                                ? `1px solid ${primaryColor}`
                                : '1px solid rgba(255, 255, 255, 0.06)',
                              borderTop: isOver ? `2px solid ${primaryColor}` : undefined,
                              cursor: onPlayQueueSong ? 'pointer' : 'default',
                              opacity: isItemDragged ? 0.35 : isPast ? 0.6 : 1,
                              transition: 'all 0.15s ease',
                              userSelect: 'none',
                            }}
                          >
                            <div style={{ width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {isCurrent ? (
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '12px' }}>
                                  <motion.span
                                    animate={isPlaying ? { scaleY: [0.35, 1, 0.45, 0.85, 0.35] } : { scaleY: 0.4 }}
                                    transition={isPlaying ? { duration: 0.75, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
                                    style={{ width: '2px', height: '12px', backgroundColor: primaryColor, borderRadius: '1px', transformOrigin: 'bottom' }}
                                  />
                                  <motion.span
                                    animate={isPlaying ? { scaleY: [0.7, 0.3, 1, 0.5, 0.9, 0.7] } : { scaleY: 0.6 }}
                                    transition={isPlaying ? { duration: 0.65, repeat: Infinity, ease: 'easeInOut', delay: 0.1 } : { duration: 0.2 }}
                                    style={{ width: '2px', height: '12px', backgroundColor: primaryColor, borderRadius: '1px', transformOrigin: 'bottom' }}
                                  />
                                  <motion.span
                                    animate={isPlaying ? { scaleY: [0.4, 0.9, 0.3, 0.95, 0.4] } : { scaleY: 0.35 }}
                                    transition={isPlaying ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 } : { duration: 0.2 }}
                                    style={{ width: '2px', height: '12px', backgroundColor: primaryColor, borderRadius: '1px', transformOrigin: 'bottom' }}
                                  />
                                </div>
                              ) : (
                                <span style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.5)', fontVariantNumeric: 'tabular-nums' }}>
                                  {index + 1}
                                </span>
                              )}
                            </div>

                            <CoverImage
                              src={song.cover}
                              alt=""
                              iconSize={16}
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                flexShrink: 0,
                              }}
                            />

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '13px',
                                  fontWeight: isCurrent ? 700 : 500,
                                  color: isCurrent ? primaryColor : '#ffffff',
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
                                  color: 'rgba(255, 255, 255, 0.6)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {song.artist}
                              </div>
                            </div>

                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => removeFromQueue(index)}
                                title={t.removeFromQueue || 'حذف'}
                                style={{
                                  ...btnStyle,
                                  color: 'rgba(255, 255, 255, 0.5)',
                                  padding: '5px',
                                  borderRadius: '6px',
                                }}
                              >
                                <X size={15} />
                              </button>

                              {reorderQueue && (
                                <div
                                  style={{
                                    color: 'rgba(255, 255, 255, 0.45)',
                                    cursor: 'grab',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '2px',
                                  }}
                                >
                                  <GripVertical size={15} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.86, y: 14 }}
                    animate={{
                      opacity: 1,
                      scale: isPlaying ? 1 : 0.88,
                      y: isPlaying ? 0 : 6,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      y: 14,
                      transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] },
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 240,
                      damping: 24,
                      mass: 0.8,
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transformOrigin: 'center center',
                    }}
                  >
                    <motion.div
                      animate={{
                        boxShadow: isPlaying
                          ? '0 24px 50px rgba(0,0,0,0.65)'
                          : '0 10px 24px rgba(0,0,0,0.35)',
                      }}
                      transition={{ duration: 0.35 }}
                      style={{
                        width: 'min(230px, 58vw, 29vh)',
                        height: 'min(230px, 58vw, 29vh)',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {currentSong.cover && !coverError ? (
                        <img
                          src={currentSong.cover}
                          alt={currentSong.name}
                          onError={() => setCoverError(true)}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <Music size={56} color="rgba(255, 255, 255, 0.35)" strokeWidth={1.4} />
                      )}
                    </motion.div>
                  </motion.div>

                  <motion.div
                    animate={{
                      scale: isPlaying ? 1 : 0.94,
                      opacity: isPlaying ? 1 : 0.88,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 240,
                      damping: 24,
                    }}
                    style={{
                      marginTop: '14px',
                      textAlign: 'center',
                      width: '100%',
                      padding: '0 8px',
                      boxSizing: 'border-box',
                      transformOrigin: 'center top',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 'clamp(17px, 4.5vw, 21px)',
                        fontWeight: '700',
                        color: songTitleColor,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        letterSpacing: '-0.2px',
                      }}
                    >
                      {currentSong.name}
                    </div>
                    <div
                      style={{
                        fontSize: 'clamp(13px, 3.4vw, 15px)',
                        color: artistColor,
                        marginTop: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {currentSong.artist}
                    </div>
                  </motion.div>
                </div>
              )}
            </div>

            {/* کنترل‌های پخش، نوار زمان و ولوم */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: 12,
                transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
              }}
              transition={{ duration: 0.36, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px', flexShrink: 0 }}
            >
              {/* نوار پیشرفت زمان */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}
                onMouseEnter={() => setIsHoveringProgress(true)}
                onMouseLeave={() => setIsHoveringProgress(false)}
              >
                <span style={{ fontSize: '11.5px', color: artistColor, minWidth: '32px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                  {formatTime(currentTime)}
                </span>
                <div style={{ flex: 1, position: 'relative', height: '24px', display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: isHoveringProgress ? '6px' : '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.22)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '999px',
                      transition: 'height 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: `${progressPercent}%`,
                        height: '100%',
                        backgroundColor: primaryColor,
                        borderRadius: '999px',
                        boxShadow: glowColor,
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    value={currentTime}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                      zIndex: 2,
                    }}
                  />
                </div>
                <span style={{ fontSize: '11.5px', color: artistColor, minWidth: '30px', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                  {formatTime(duration)}
                </span>
              </div>

              {/* دکمه‌های اصلی پخش */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? '16px' : '34px',
                  padding: '0 4px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ opacity: 0.78 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                  onClick={onToggleShuffle}
                  title="Shuffle"
                  style={{
                    ...btnStyle,
                    color: isShuffle ? iconActiveColor : iconInactiveColor,
                    width: isMobile ? '42px' : '46px',
                    height: isMobile ? '42px' : '46px',
                    borderRadius: '50%',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  <svg width={isMobile ? 20 : 22} height={isMobile ? 20 : 22} viewBox="0 0 16 16" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.6 9.6 0 0 0 7.556 8a9.6 9.6 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.6 10.6 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.6 9.6 0 0 0 6.444 8a9.6 9.6 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5"
                    />
                    <path d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192" />
                  </svg>
                  {isShuffle && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '3px',
                        width: '4.5px',
                        height: '4.5px',
                        borderRadius: '50%',
                        backgroundColor: iconActiveColor,
                        boxShadow: glowColor,
                      }}
                    />
                  )}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ opacity: 0.78 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                  onClick={() => playPrev()}
                  title="Previous"
                  style={{
                    ...btnStyle,
                    color: iconColor,
                    width: isMobile ? '46px' : '54px',
                    height: isMobile ? '46px' : '54px',
                    flexShrink: 0,
                  }}
                >
                  <svg width={isMobile ? 26 : 30} height={isMobile ? 26 : 30} viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8.404 7.304a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696z" />
                    <path d="M.404 7.304a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696z" />
                  </svg>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ opacity: 0.82 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                  onClick={onTogglePlay}
                  title={isPlaying ? 'Pause' : 'Play'}
                  style={{
                    ...btnStyle,
                    color: iconColor,
                    width: isMobile ? '54px' : '64px',
                    height: isMobile ? '54px' : '64px',
                    flexShrink: 0,
                  }}
                >
                  {isPlaying ? (
                    <svg width={isMobile ? 42 : 48} height={isMobile ? 42 : 48} viewBox="0 0 16 16" fill="currentColor">
                      <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5" />
                    </svg>
                  ) : (
                    <svg width={isMobile ? 42 : 48} height={isMobile ? 42 : 48} viewBox="0 0 16 16" fill="currentColor" style={{ transform: 'translateX(2px)' }}>
                      <path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z" />
                    </svg>
                  )}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ opacity: 0.78 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                  onClick={() => playNext()}
                  title="Next"
                  style={{
                    ...btnStyle,
                    color: iconColor,
                    width: isMobile ? '46px' : '54px',
                    height: isMobile ? '46px' : '54px',
                    flexShrink: 0,
                  }}
                >
                  <svg width={isMobile ? 26 : 30} height={isMobile ? 26 : 30} viewBox="0 0 16 16" fill="currentColor">
                    <path d="M7.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696z" />
                    <path d="M15.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C8.713 12.69 8 12.345 8 11.692V4.308c0-.653.713-.998 1.233-.696z" />
                  </svg>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ opacity: 0.78 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                  onClick={onToggleRepeat}
                  title="Repeat"
                  style={{
                    ...btnStyle,
                    color: repeatMode !== 'off' ? iconActiveColor : iconInactiveColor,
                    width: isMobile ? '42px' : '46px',
                    height: isMobile ? '42px' : '46px',
                    borderRadius: '50%',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  {repeatMode === 'one' ? (
                    <svg width={isMobile ? 20 : 22} height={isMobile ? 20 : 22} viewBox="0 0 16 16" fill="currentColor">
                      <path d="M11 4v1.466a.25.25 0 0 0 .41.192l2.36-1.966a.25.25 0 0 0 0-.384l-2.36-1.966a.25.25 0 0 0-.41.192V3H5a5 5 0 0 0-4.48 7.223.5.5 0 0 0 .896-.446A4 4 0 0 1 5 4zm4.48 1.777a.5.5 0 0 0-.896.446A4 4 0 0 1 11 12H5.001v-1.466a.25.25 0 0 0-.41-.192l-2.36 1.966a.25.25 0 0 0 0 .384l2.36 1.966a.25.25 0 0 0 .41-.192V13h6a5 5 0 0 0 4.48-7.223Z" />
                      <path d="M9 5.5a.5.5 0 0 0-.854-.354l-1.75 1.75a.5.5 0 1 0 .708.708L8 6.707V10.5a.5.5 0 0 0 1 0z" />
                    </svg>
                  ) : (
                    <svg width={isMobile ? 20 : 22} height={isMobile ? 20 : 22} viewBox="0 0 16 16" fill="currentColor">
                      <path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m3.81.086a.5.5 0 0 1 .67.225A5 5 0 0 1 11 13H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.966a.25.25 0 0 1 .41.192V12h6a4 4 0 0 0 3.585-5.777.5.5 0 0 1 .225-.67Z" />
                    </svg>
                  )}
                  {repeatMode !== 'off' && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '3px',
                        width: '4.5px',
                        height: '4.5px',
                        borderRadius: '50%',
                        backgroundColor: iconActiveColor,
                        boxShadow: glowColor,
                      }}
                    />
                  )}
                </motion.button>
              </div>

              {/* اسلایدر ولوم صدا */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  maxWidth: '280px',
                  margin: '2px auto 0',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={() => setIsHoveringVolume(true)}
                onMouseLeave={() => setIsHoveringVolume(false)}
                onWheel={(e) => {
                  e.preventDefault();
                  const delta = e.deltaY < 0 ? 0.05 : -0.05;
                  onVolumeChange(Math.max(0, Math.min(1, volume + delta)));
                }}
              >
                <button
                  type="button"
                  onClick={() => onVolumeChange(0)}
                  title="Mute"
                  style={{ ...btnStyle, color: iconInactiveColor }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 9v6h4l5 5V4L11 9H7z" />
                  </svg>
                </button>

                <div style={{ flex: 1, position: 'relative', height: '22px', display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: isHoveringVolume ? '5px' : '3px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '999px',
                      transition: 'height 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: `${volumePercent}%`,
                        height: '100%',
                        backgroundColor: primaryColor,
                        borderRadius: '999px',
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                      zIndex: 2,
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => onVolumeChange(1)}
                  title="Max Volume"
                  style={{ ...btnStyle, color: iconInactiveColor }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}, (prev, next) => {
  if (!prev.isOpen && !next.isOpen) return true;
  return false;
});
