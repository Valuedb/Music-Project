import { memo } from 'react';
import { motion } from 'framer-motion';

interface AmbientBackgroundProps {
  coverUrl?: string;
  primaryColor?: string;
}

/**
 * پس‌زمینه زنده و داینامیک بلور به سبک Liquid Glass اپل موزیک
 */
export const AmbientBackground = memo(({ coverUrl, primaryColor = '#0a84ff' }: AmbientBackgroundProps) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        backgroundColor: '#0a0a0e',
      }}
    >
      {/* لایه تصویر کاور با بلور و اشباع رنگی عمیق */}
      {coverUrl ? (
        <motion.div
          key={coverUrl}
          initial={{ opacity: 0, scale: 1.15 }}
          animate={{ opacity: 0.65, scale: 1.25 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            inset: '-20%',
            backgroundImage: `url(${coverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(70px) saturate(200%) brightness(0.65)',
            transform: 'scale(1.25)',
          }}
        />
      ) : null}

      {/* اورب‌های نورانی رنگی متحرک (Dynamic Color Blobs) */}
      <motion.div
        animate={{
          x: [0, 25, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '55vw',
          height: '55vw',
          maxWidth: '500px',
          maxHeight: '500px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`,
          opacity: 0.35,
          filter: 'blur(50px)',
        }}
      />

      <motion.div
        animate={{
          x: [0, -30, 25, 0],
          y: [0, 25, -25, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '-10%',
          width: '60vw',
          height: '60vw',
          maxWidth: '520px',
          maxHeight: '520px',
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255, 45, 85, 0.45) 0%, transparent 70%)`,
          opacity: 0.3,
          filter: 'blur(60px)',
        }}
      />

      {/* لایه گرادینت تیره و مات نهایی برای خوانایی بی‌نقص متون و کنترل‌ها */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 30%, rgba(0,0,0,0.2) 0%, rgba(5,5,8,0.75) 75%, rgba(0,0,0,0.92) 100%)',
          backdropFilter: 'blur(30px)',
        }}
      />
    </div>
  );
});

AmbientBackground.displayName = 'AmbientBackground';
