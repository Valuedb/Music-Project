import { memo } from 'react';
import { Volume1, Volume2, VolumeX } from 'lucide-react';

interface VolumeSliderProps {
  volume: number;
  onVolumeChange: (val: number) => void;
  primaryColor?: string;
}

/**
 * اسلایدر ولوم افقی با آیکون‌های استاندارد iOS و پشتیبانی از Mute سریع
 */
export const VolumeSlider = memo(({
  volume,
  onVolumeChange,
  primaryColor = '#0a84ff',
}: VolumeSliderProps) => {
  const isMuted = volume === 0;
  const volumePercent = volume * 100;

  const toggleMute = () => {
    onVolumeChange(isMuted ? 0.7 : 0);
  };

  return (
    <div
      dir="ltr"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        maxWidth: '340px',
        margin: '10px auto 0',
        padding: '0 8px',
      }}
    >
      <button
        onClick={toggleMute}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: isMuted ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.7)',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.2s',
        }}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume1 size={18} />}
      </button>

      <div
        style={{
          flex: 1,
          position: 'relative',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '999px',
            overflow: 'hidden',
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
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
          }}
        />
      </div>

      <button
        onClick={() => onVolumeChange(1)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: 'rgba(255, 255, 255, 0.7)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Volume2 size={18} />
      </button>
    </div>
  );
});

VolumeSlider.displayName = 'VolumeSlider';
