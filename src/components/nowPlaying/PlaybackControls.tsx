import { memo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import type { RepeatMode } from '../../types';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: RepeatMode;
  onToggleRepeat: () => void;
  primaryColor?: string;
}

/**
 * دکمه‌های کنترل پخش موزیک (Play, Pause, Next, Prev, Shuffle, Repeat)
 * با حس کلیک نرم و فیزیک لمسی iOS
 */
export const PlaybackControls = memo(({
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
  primaryColor = '#0a84ff',
}: PlaybackControlsProps) => {
  return (
    <div
      dir="ltr"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '360px',
        margin: '12px auto',
        padding: '0 8px',
      }}
    >
      {/* دکمه شافل (Shuffle) */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onToggleShuffle}
        title="Shuffle"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isShuffle ? primaryColor : 'rgba(255, 255, 255, 0.45)',
          position: 'relative',
          transition: 'color 0.2s',
        }}
      >
        <Shuffle size={20} strokeWidth={2.2} />
        {isShuffle && (
          <span
            style={{
              position: 'absolute',
              bottom: '4px',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: primaryColor,
            }}
          />
        )}
      </motion.button>

      {/* آهنگ قبلی (Previous) */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onPrev}
        title="Previous"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
        }}
      >
        <SkipBack size={32} fill="#ffffff" strokeWidth={1} />
      </motion.button>

      {/* دکمه اصلی پخش / توقف (Play/Pause) به سبک اپل موزیک */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={onTogglePlay}
        title={isPlaying ? 'Pause' : 'Play'}
        style={{
          width: '68px',
          height: '68px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          color: '#000000',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
          transition: 'box-shadow 0.2s ease',
        }}
      >
        {isPlaying ? (
          <Pause size={32} fill="#000000" strokeWidth={0} />
        ) : (
          <Play size={32} fill="#000000" strokeWidth={0} style={{ marginLeft: '3px' }} />
        )}
      </motion.button>

      {/* آهنگ بعدی (Next) */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onNext}
        title="Next"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
        }}
      >
        <SkipForward size={32} fill="#ffffff" strokeWidth={1} />
      </motion.button>

      {/* دکمه تکرار (Repeat) */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onToggleRepeat}
        title="Repeat"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: repeatMode !== 'off' ? primaryColor : 'rgba(255, 255, 255, 0.45)',
          position: 'relative',
          transition: 'color 0.2s',
        }}
      >
        {repeatMode === 'one' ? (
          <Repeat1 size={22} strokeWidth={2.4} />
        ) : (
          <Repeat size={20} strokeWidth={2.2} />
        )}
        {repeatMode !== 'off' && (
          <span
            style={{
              position: 'absolute',
              bottom: '4px',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: primaryColor,
            }}
          />
        )}
      </motion.button>
    </div>
  );
});

PlaybackControls.displayName = 'PlaybackControls';
