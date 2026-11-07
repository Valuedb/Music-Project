import { useState, memo } from 'react';

interface ScrubberProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  primaryColor?: string;
}

const formatTime = (time: number) => {
  if (isNaN(time) || time < 0) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

/**
 * نوار پیشرفت آهنگ (Scrubber) به سبک اختصاصی iOS:
 * نمایش زمان سپری‌شده در چپ و زمان باقی‌مانده به‌صورت منفی در راست (-2:45)
 */
export const Scrubber = memo(({
  currentTime,
  duration,
  onSeek,
  primaryColor = '#0a84ff',
}: ScrubberProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<number | null>(null);

  const displayTime = dragValue !== null ? dragValue : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (displayTime / duration) * 100)) : 0;
  const remainingTime = duration > 0 ? duration - displayTime : 0;

  return (
    <div style={{ width: '100%', padding: '6px 0', userSelect: 'none' }}>
      {/* نوار کشویی */}
      <div
        style={{
          position: 'relative',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        {/* خط مسیر خالی */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: isDragging ? '7px' : '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.22)',
            borderRadius: '999px',
            transition: 'height 0.15s ease',
            overflow: 'hidden',
          }}
        >
          {/* خط پیشرفت پر شده */}
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: primaryColor,
              borderRadius: '999px',
              transition: isDragging ? 'none' : 'width 0.1s linear',
            }}
          />
        </div>

        {/* نقطه دستگیره (Thumb Knob) به سبک اپل */}
        <div
          style={{
            position: 'absolute',
            left: `calc(${progressPercent}% - ${isDragging ? 8 : 5}px)`,
            width: isDragging ? 16 : 10,
            height: isDragging ? 16 : 10,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            transition: isDragging ? 'none' : 'left 0.1s linear, transform 0.15s ease',
            transform: isDragging ? 'scale(1.2)' : 'scale(1)',
            pointerEvents: 'none',
          }}
        />

        {/* اینپوت شفاف لمسی/کلیکی */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={displayTime}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          onChange={(e) => setDragValue(Number(e.target.value))}
          onMouseUp={(e) => {
            setIsDragging(false);
            onSeek(Number((e.target as HTMLInputElement).value));
            setDragValue(null);
          }}
          onTouchEnd={() => {
            setIsDragging(false);
            if (dragValue !== null) onSeek(dragValue);
            setDragValue(null);
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
          }}
        />
      </div>

      {/* زمان‌ها به سبک اپل موزیک */}
      <div
        dir="ltr"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '2px',
          fontSize: '12px',
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.6)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.2px',
        }}
      >
        <span>{formatTime(displayTime)}</span>
        <span>-{formatTime(remainingTime)}</span>
      </div>
    </div>
  );
});

Scrubber.displayName = 'Scrubber';
