import { memo } from 'react';
import { motion } from 'framer-motion';
import { Music } from 'lucide-react';
import type { Song } from '../../types';

interface ArtworkViewProps {
  song: Song | null;
  isPlaying: boolean;
  primaryColor?: string;
}

/**
 * نمایش کاور بزرگ آلبوم به سبک iOS:
 * در حالت پخش: ابعاد کامل (Scale 1) با سایه و نور هماهنگ
 * در حالت توقف: مقیاس کمی کوچک‌تر (Scale 0.88) به همراه انیمیشن نرم
 */
export const ArtworkView = memo(({ song, isPlaying, primaryColor = '#0a84ff' }: ArtworkViewProps) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '380px',
        margin: '0 auto',
        padding: '10px 0',
      }}
    >
      <motion.div
        animate={{
          scale: isPlaying ? 1 : 0.88,
          boxShadow: isPlaying
            ? `0 24px 65px rgba(0,0,0,0.65), 0 0 40px ${primaryColor}40`
            : '0 12px 30px rgba(0,0,0,0.4)',
        }}
        transition={{
          type: 'spring',
          stiffness: 220,
          damping: 24,
        }}
        style={{
          width: 'min(78vw, 340px)',
          height: 'min(78vw, 340px)',
          borderRadius: '24px',
          overflow: 'hidden',
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.14)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {song?.cover ? (
          <img
            src={song.cover}
            alt={song.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            <Music size={64} strokeWidth={1.5} />
          </div>
        )}
      </motion.div>
    </div>
  );
});

ArtworkView.displayName = 'ArtworkView';
