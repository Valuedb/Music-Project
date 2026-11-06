import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { RepeatMode, Song } from '../types';
import './FullScreenPlayer.css';

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
  t: any;
  theme: any;
}

export const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({
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
  t,
  theme,
}) => {
  const [showQueue, setShowQueue] = useState(false);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);

  if (typeof document === 'undefined') return null;

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const volumePercent = Math.max(0, Math.min(100, volume * 100));

  const songTitleColor = '#ffffff';
  const artistColor = '#dbdbdb';
  const iconColor = '#ffffff';
  const iconActiveColor = theme?.colors?.primary || '#0a84ff';
  const iconInactiveColor = 'rgba(255, 255, 255, 0.45)';
  const glowColor = `0 0 16px ${theme?.colors?.primary || '#0a84ff'}`;

  const btnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && currentSong && (
        <motion.div
          className={`full-screen-player ${isPlaying ? 'is-playing' : 'is-paused'}`}
          key="full-screen-player"
          initial={{ y: '100%', opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0.8 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: '#121214',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* پس‌زمینه محو داینامیک */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${currentSong.cover})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(80px) brightness(0.35) saturate(1.8)',
              transform: 'scale(1.3)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(15, 15, 18, 0.65)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              pointerEvents: 'none',
            }}
          />

          {/* محتوای داخلی تمام‌صفحه */}
          <div
            className="full-screen-player__content"
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              width: '100%',
              maxWidth: '420px',
              margin: '0 auto',
              padding: 'clamp(12px, 2vh, 18px) 20px clamp(36px, 8vh, 60px) 20px',
              boxSizing: 'border-box',
              justifyContent: 'space-between',
            }}
          >
            {/* هدر: نشانگر سوایپ و دکمه بستن */}
            <div className="full-screen-player__header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  ...btnStyle,
                  width: '38px',
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
                }}
              >
                <button
                  onClick={onClose}
                  style={{
                    ...btnStyle,
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                  </svg>
                </button>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>
                    {t.nowPlaying || 'در حال پخش'}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#ffffff',
                      maxWidth: '220px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentSong.album || currentSong.name}
                  </div>
                </div>

                <button
                  onClick={() => setShowQueue(!showQueue)}
                  style={{
                    ...btnStyle,
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: showQueue ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
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

            {/* بخش میانی: کاور با ابعاد بهینه‌شده و اطلاعات آهنگ */}
            <div
              className="full-screen-player__main"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 0,
                padding: '4px 0',
                width: '100%',
              }}
            >
              {showQueue ? (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '320px',
                    backgroundColor: 'rgba(25, 25, 28, 0.85)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    padding: '16px',
                    overflowY: 'auto',
                    boxSizing: 'border-box',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{t.queue || 'صف پخش'}</span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{queue.length} {t.allSongs || 'آهنگ'}</span>
                  </div>
                  {queue.length === 0 ? (
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
                      {t.queueEmpty || 'صف پخش خالی است'}
                    </div>
                  ) : (
                    queue.map((song, index) => (
                      <div
                        key={song.id + index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '8px',
                          padding: '8px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <img
                          src={song.cover}
                          alt=""
                          style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {song.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#a1a1a6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {song.artist}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromQueue(index)}
                          style={{
                            ...btnStyle,
                            color: 'rgba(255,255,255,0.5)',
                            padding: '6px',
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="full-screen-player__artwork-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <img
                    className="full-screen-player__artwork"
                    src={currentSong.cover}
                    alt={currentSong.name}
                    style={{
                      width: 'min(190px, 48vw, 24vh)',
                      height: 'min(190px, 48vw, 24vh)',
                      borderRadius: '18px',
                      objectFit: 'cover',
                      boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                    }}
                  />
                  <div className="full-screen-player__track-info" style={{ marginTop: '14px', textAlign: 'center', width: '100%', padding: '0 8px', boxSizing: 'border-box' }}>
                    <div
                      style={{
                        fontSize: 'clamp(16px, 4.2vw, 20px)',
                        fontWeight: '700',
                        color: songTitleColor,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {currentSong.name}
                    </div>
                    <div
                      style={{
                        fontSize: 'clamp(12px, 3.2vw, 14px)',
                        color: artistColor,
                        marginTop: '3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {currentSong.artist}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* بخش کنترل‌ها و نوار پیشرفت */}
            <div className="full-screen-player__controls" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* نوار پیشرفت دقیقا با استایل پلیربار کاربر */}
              <div
                className="full-screen-player__progress"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}
                onMouseEnter={() => setIsHoveringProgress(true)}
                onMouseLeave={() => setIsHoveringProgress(false)}
              >
                <span style={{ fontSize: '11px', color: artistColor, width: '34px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {formatTime(currentTime)}
                </span>
                <div style={{ flex: 1, position: 'relative', height: '18px', display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: isHoveringProgress ? '6px' : '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.18)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '4px',
                      transition: 'height 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: `${progressPercent}%`,
                        height: '100%',
                        backgroundColor: theme?.colors?.primary || '#0a84ff',
                        borderRadius: '4px',
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
                <span style={{ fontSize: '11px', color: artistColor, width: '34px', fontVariantNumeric: 'tabular-nums' }}>
                  {formatTime(duration)}
                </span>
              </div>

              {/* دکمه‌های کنترل با همان آیکون‌ها و استایل اصلی (دکمه پلی بدون کادر دایره‌ای) */}
              <div
                className="full-screen-player__control-buttons"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 8px',
                  marginTop: '2px',
                }}
              >
                <button
                  onClick={onToggleShuffle}
                  style={{
                    ...btnStyle,
                    color: isShuffle ? iconActiveColor : iconInactiveColor,
                    padding: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.6 9.6 0 0 0 7.556 8a9.6 9.6 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.6 10.6 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.6 9.6 0 0 0 6.444 8a9.6 9.6 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5"
                    />
                    <path d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192" />
                  </svg>
                </button>

                <button
                  onClick={() => playPrev()}
                  style={{
                    ...btnStyle,
                    color: iconColor,
                    padding: '8px',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <svg width="26" height="26" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8.404 7.304a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696z" />
                    <path d="M.404 7.304a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696z" />
                  </svg>
                </button>

                <button
                  onClick={onTogglePlay}
                  style={{
                    ...btnStyle,
                    color: '#ffffff',
                    padding: '8px',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {isPlaying ? (
                    <svg width="34" height="34" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5" />
                    </svg>
                  ) : (
                    <svg width="34" height="34" viewBox="0 0 16 16" fill="currentColor" style={{ marginLeft: '3px' }}>
                      <path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => playNext()}
                  style={{
                    ...btnStyle,
                    color: iconColor,
                    padding: '8px',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <svg width="26" height="26" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M7.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696z" />
                    <path d="M15.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C8.713 12.69 8 12.345 8 11.692V4.308c0-.653.713-.998 1.233-.696z" />
                  </svg>
                </button>

                <button
                  onClick={onToggleRepeat}
                  style={{
                    ...btnStyle,
                    color: repeatMode !== 'off' ? iconActiveColor : iconInactiveColor,
                    padding: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  {repeatMode === 'one' ? (
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M11 4v1.466a.25.25 0 0 0 .41.192l2.36-1.966a.25.25 0 0 0 0-.384l-2.36-1.966a.25.25 0 0 0-.41.192V3H5a5 5 0 0 0-4.48 7.223.5.5 0 0 0 .896-.446A4 4 0 0 1 5 4zm4.48 1.777a.5.5 0 0 0-.896.446A4 4 0 0 1 11 12H5.001v-1.466a.25.25 0 0 0-.41-.192l-2.36 1.966a.25.25 0 0 0 0 .384l2.36 1.966a.25.25 0 0 0 .41-.192V13h6a5 5 0 0 0 4.48-7.223Z" />
                      <path d="M9 5.5a.5.5 0 0 0-.854-.354l-1.75 1.75a.5.5 0 1 0 .708.708L8 6.707V10.5a.5.5 0 0 0 1 0z" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m3.81.086a.5.5 0 0 1 .67.225A5 5 0 0 1 11 13H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.966a.25.25 0 0 1 .41.192V12h6a4 4 0 0 0 3.585-5.777.5.5 0 0 1 .225-.67Z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* اسلایدر ولوم صدا */}
              <div className="full-screen-player__volume" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px', marginTop: '6px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={iconInactiveColor}>
                  <path d="M7 9v6h4l5 5V4L11 9H7z" />
                </svg>
                <div style={{ flex: 1, position: 'relative', height: '16px', display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.18)',
                      borderRadius: '2px',
                    }}
                  >
                    <div
                      style={{
                        width: `${volumePercent}%`,
                        height: '100%',
                        backgroundColor: theme?.colors?.primary || '#0a84ff',
                        borderRadius: '2px',
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill={iconInactiveColor}>
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
