import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Heart, ListMusic, Disc } from 'lucide-react';
import { AmbientBackground } from './AmbientBackground';
import { ArtworkView } from './ArtworkView';
import { Scrubber } from './Scrubber';
import { PlaybackControls } from './PlaybackControls';
import { VolumeSlider } from './VolumeSlider';
import { QueueList } from './QueueList';
import type { RepeatMode, Song } from '../../types';

interface NowPlayingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (val: number) => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: RepeatMode;
  onToggleRepeat: () => void;
  queue: Song[];
  onRemoveFromQueue: (index: number) => void;
  t: any;
  theme: any;
}

/**
 * صفحه تمام‌صفحه و مدال بازشونده پخش موسیقی مشابه طراحی اختصاصی Apple Music در iOS
 */
export const NowPlayingSheet = memo(({
  isOpen,
  onClose,
  currentSong,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
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
  onRemoveFromQueue,
  t,
  theme,
}: NowPlayingSheetProps) => {
  const [activeTab, setActiveTab] = useState<'artwork' | 'queue'>('artwork');
  const [isFavorite, setIsFavorite] = useState(false);

  const primaryColor = theme?.colors?.primary || '#0a84ff';

  return (
    <AnimatePresence>
      {isOpen && currentSong && (
        <motion.div
          key="now-playing-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{
            type: 'spring',
            damping: 30,
            stiffness: 300,
            mass: 0.8,
          }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.05, bottom: 0.6 }}
          onDragEnd={(_, info) => {
            // بستن خودکار با سوایپ به سمت پایین
            if (info.offset.y > 100 || info.velocity.y > 350) {
              onClose();
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0c0c12',
            color: '#ffffff',
            overflow: 'hidden',
            touchAction: 'none',
          }}
        >
          {/* پس‌زمینه داینامیک شیشه‌ای با افکت رنگی کاور */}
          <AmbientBackground
            coverUrl={currentSong.cover}
            primaryColor={primaryColor}
          />

          {/* محتوای رویی با چیدمان و حاشیه‌های واکنش‌گرا */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              width: '100%',
              maxWidth: '520px',
              margin: '0 auto',
              padding: 'clamp(12px, 3vh, 24px) clamp(16px, 5vw, 28px)',
              boxSizing: 'border-box',
              justifyContent: 'space-between',
            }}
          >
            {/* هدر: دستگیره سوایپ، دکمه بستن و عنوان */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                position: 'relative',
              }}
            >
              {/* دستگیره سوایپ به پایین (iOS Drag Pill) */}
              <div
                style={{
                  width: '40px',
                  height: '5px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.35)',
                  marginBottom: '10px',
                  cursor: 'grab',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '4px 0',
                }}
              >
                <button
                  onClick={onClose}
                  title={t.closeNowPlaying || 'بستن'}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    cursor: 'pointer',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    transition: 'background-color 0.2s, scale 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
                >
                  <ChevronDown size={22} />
                </button>

                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: 'rgba(255, 255, 255, 0.55)',
                      fontWeight: '600',
                    }}
                  >
                    {t.playingFrom || 'در حال پخش از'}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#ffffff',
                      marginTop: '1px',
                      maxWidth: '220px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentSong.album || t.home || 'کتابخانه'}
                  </div>
                </div>

                <div style={{ width: '36px' }} />
              </div>
            </div>

            {/* بخش میانی: کاور بزرگ یا لیست صف بر اساس تب انتخابی */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: 0,
                padding: '8px 0',
              }}
            >
              {activeTab === 'artwork' ? (
                <ArtworkView
                  song={currentSong}
                  isPlaying={isPlaying}
                  primaryColor={primaryColor}
                />
              ) : (
                <QueueList
                  queue={queue}
                  onRemoveFromQueue={onRemoveFromQueue}
                  t={t}
                  primaryColor={primaryColor}
                />
              )}
            </div>

            {/* مشخصات ترَک (عنوان، نام خواننده و دکمه علاقه‌مندی) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '6px 0',
              }}
            >
              <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                <div
                  style={{
                    fontSize: 'clamp(18px, 4vw, 24px)',
                    fontWeight: '800',
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    letterSpacing: '-0.3px',
                  }}
                >
                  {currentSong.name}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(14px, 3vw, 17px)',
                    color: 'rgba(255, 255, 255, 0.72)',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: '3px',
                  }}
                >
                  {currentSong.artist}
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => setIsFavorite(!isFavorite)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  color: isFavorite ? '#ff3b30' : 'rgba(255, 255, 255, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                }}
              >
                <Heart
                  size={24}
                  fill={isFavorite ? '#ff3b30' : 'none'}
                  strokeWidth={2}
                />
              </motion.button>
            </div>

            {/* نوار اسکرابر پیشرفت زمان */}
            <Scrubber
              currentTime={currentTime}
              duration={duration}
              onSeek={onSeek}
              primaryColor={primaryColor}
            />

            {/* دکمه‌های کنترل پخش */}
            <PlaybackControls
              isPlaying={isPlaying}
              onTogglePlay={onTogglePlay}
              onNext={onNext}
              onPrev={onPrev}
              isShuffle={isShuffle}
              onToggleShuffle={onToggleShuffle}
              repeatMode={repeatMode}
              onToggleRepeat={onToggleRepeat}
              primaryColor={primaryColor}
            />

            {/* اسلایدر میزان صدا */}
            <VolumeSlider
              volume={volume}
              onVolumeChange={onVolumeChange}
              primaryColor={primaryColor}
            />

            {/* نوار سوییچ پایین: جابجایی بین نمای کاور و صف پخش */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                marginTop: '12px',
                paddingTop: '6px',
              }}
            >
              <button
                onClick={() => setActiveTab('artwork')}
                title="Artwork"
                style={{
                  background: activeTab === 'artwork' ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: activeTab === 'artwork' ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
              >
                <Disc size={17} />
                <span>{t.nowPlaying || 'کاور'}</span>
              </button>

              <button
                onClick={() => setActiveTab('queue')}
                title={t.queue}
                style={{
                  background: activeTab === 'queue' ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: activeTab === 'queue' ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
              >
                <ListMusic size={17} />
                <span>{t.queue || 'صف پخش'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

NowPlayingSheet.displayName = 'NowPlayingSheet';
