import React, { useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Sliders,
  Gauge,
  Waves,
  Headphones,
  Speaker,
  Laptop,
  RotateCcw,
  Activity,
  Volume2,
  ShieldCheck,
  Sparkles,
  Disc3,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type {
  AudioOutputProfile,
  EqualizerSettings,
  ReverbRoom,
  SoundProfileSnapshot,
  SoundSettings as SoundSettingsType,
} from '../types';
import { EqualizerControl } from '../components/EqualizerControl';
import {
  DEFAULT_EQ_SETTINGS,
  DEFAULT_SOUND_SETTINGS,
  audioEffects,
} from '../player/audioEffects';

interface SoundSettingsProps {
  soundSettings: SoundSettingsType;
  setSoundSettings: React.Dispatch<React.SetStateAction<SoundSettingsType>>;
  equalizerSettings: EqualizerSettings;
  setEqualizerSettings: (settings: EqualizerSettings) => void;
  onBack: () => void;
  theme: any;
  t: any;
  language: string;
}

const ToggleSwitch = ({
  checked,
  onChange,
  theme,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  theme: any;
  ariaLabel: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={() => onChange(!checked)}
    style={{
      position: 'relative',
      direction: 'ltr',
      width: '48px',
      height: '28px',
      borderRadius: '14px',
      backgroundColor: checked ? theme.colors.primary : theme.colors.border,
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.22s ease, scale 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
      padding: 0,
      outline: 'none',
      flexShrink: 0,
    }}
  >
    <motion.span
      initial={false}
      animate={{ left: checked ? 23 : 3 }}
      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      style={{
        position: 'absolute',
        top: '3px',
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 5px rgba(0,0,0,0.28)',
      }}
    />
  </button>
);

const RangeSlider = ({
  value,
  min,
  max,
  step,
  onChange,
  theme,
  centeredZero = false,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  theme: any;
  centeredZero?: boolean;
}) => {
  const span = max - min || 1;
  const percent = Math.max(0, Math.min(100, ((value - min) / span) * 100));

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '26px',
        display: 'flex',
        alignItems: 'center',
        direction: 'ltr',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '6px',
          borderRadius: '3px',
          backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)',
          overflow: 'hidden',
        }}
      >
        {centeredZero ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: value >= 0 ? '50%' : `${percent}%`,
              width: `${Math.abs(percent - 50)}%`,
              backgroundColor: theme.colors.primary,
              borderRadius: '3px',
            }}
          />
        ) : (
          <div
            style={{
              width: `${percent}%`,
              height: '100%',
              backgroundColor: theme.colors.primary,
              borderRadius: '3px',
            }}
          />
        )}
      </div>
      {centeredZero && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            width: '2px',
            height: '12px',
            transform: 'translateX(-50%)',
            backgroundColor: theme.colors.textSecondary,
            opacity: 0.45,
            borderRadius: '1px',
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: `calc(${percent}% - 8px)`,
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          border: `2px solid ${theme.colors.primary}`,
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer',
          margin: 0,
          zIndex: 2,
        }}
      />
    </div>
  );
};

/** نوار طیف‌سنج زنده صدا با Web Audio AnalyserNode */
const LiveSpectrumPreview = ({
  enabled,
  theme,
}: {
  enabled: boolean;
  theme: any;
}) => {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barCount = 28;

  useEffect(() => {
    if (!enabled) {
      barRefs.current.forEach((bar) => {
        if (bar) bar.style.transform = 'scaleY(0.14)';
      });
      return;
    }

    let rafId = 0;
    const bins = new Uint8Array(audioEffects.getFrequencyBinCount() || 64);

    const tick = () => {
      const ok = audioEffects.getFrequencyData(bins);
      for (let i = 0; i < barCount; i++) {
        const bar = barRefs.current[i];
        if (!bar) continue;
        if (!ok) {
          bar.style.transform = 'scaleY(0.14)';
          continue;
        }
        const binIdx = Math.min(bins.length - 1, Math.floor((i / barCount) * (bins.length * 0.72)));
        const norm = (bins[binIdx] || 0) / 255;
        const scale = Math.max(0.14, Math.min(1, norm));
        bar.style.transform = `scaleY(${scale.toFixed(3)})`;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [enabled]);

  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '4px',
        height: '38px',
        padding: '0 4px',
      }}
    >
      {Array.from({ length: barCount }).map((_, idx) => (
        <div
          key={idx}
          ref={(el) => {
            barRefs.current[idx] = el;
          }}
          style={{
            flex: 1,
            height: '100%',
            borderRadius: '3px',
            backgroundColor: theme.colors.primary,
            opacity: enabled ? 0.78 : 0.22,
            transformOrigin: 'bottom',
            transform: 'scaleY(0.14)',
            transition: enabled ? 'none' : 'transform 0.25s ease',
          }}
        />
      ))}
    </div>
  );
};

export const SoundSettings: React.FC<SoundSettingsProps> = ({
  soundSettings,
  setSoundSettings,
  equalizerSettings,
  setEqualizerSettings,
  onBack,
  theme,
  t,
  language,
}) => {
  const isRTL = language === 'fa';

  const updateSound = <K extends keyof SoundSettingsType>(
    key: K,
    value: SoundSettingsType[K]
  ) => {
    setSoundSettings((prev) => ({ ...prev, [key]: value }));
  };

  /** جابه‌جایی بین پروفایل‌های خروجی صدا (پیش‌فرض، هدفون، اسپیکر) با ذخیره خودکار تنظیمات فعلی */
  const handleSelectProfile = (targetProfile: AudioOutputProfile) => {
    if (targetProfile === soundSettings.outputProfile) return;

    const currentSnapshot: SoundProfileSnapshot = {
      eq: {
        ...equalizerSettings,
        bands: [...equalizerSettings.bands],
      },
      bands10: [...soundSettings.bands10],
      eqMode: soundSettings.eqMode,
      preampDb: soundSettings.preampDb,
      spatialSurround: soundSettings.spatialSurround,
      reverbRoom: soundSettings.reverbRoom,
      reverbMix: soundSettings.reverbMix,
    };

    const nextSnapshots = {
      ...soundSettings.profilePresets,
      [soundSettings.outputProfile]: currentSnapshot,
    };

    const targetSnapshot = nextSnapshots[targetProfile];
    if (targetSnapshot) {
      setEqualizerSettings({
        ...targetSnapshot.eq,
        bands: [...targetSnapshot.eq.bands],
      });
      setSoundSettings((prev) => ({
        ...prev,
        outputProfile: targetProfile,
        profilePresets: nextSnapshots,
        bands10: [...targetSnapshot.bands10],
        eqMode: targetSnapshot.eqMode,
        preampDb: targetSnapshot.preampDb,
        spatialSurround: targetSnapshot.spatialSurround,
        reverbRoom: targetSnapshot.reverbRoom,
        reverbMix: targetSnapshot.reverbMix,
      }));
    } else {
      setSoundSettings((prev) => ({
        ...prev,
        outputProfile: targetProfile,
        profilePresets: nextSnapshots,
      }));
    }
  };

  const handleResetAllAudio = () => {
    setEqualizerSettings({ ...DEFAULT_EQ_SETTINGS, bands: [...DEFAULT_EQ_SETTINGS.bands] });
    setSoundSettings({
      ...DEFAULT_SOUND_SETTINGS,
      bands10: [...DEFAULT_SOUND_SETTINGS.bands10],
      profilePresets: {},
    });
  };

  const applySpeedMood = (mood: 'normal' | 'slowed' | 'nightcore') => {
    if (mood === 'normal') {
      setSoundSettings((prev) => ({
        ...prev,
        playbackSpeed: 1,
        preservePitch: true,
        reverbRoom: 'off',
      }));
    } else if (mood === 'slowed') {
      setSoundSettings((prev) => ({
        ...prev,
        playbackSpeed: 0.85,
        preservePitch: false,
        reverbRoom: 'hall',
        reverbMix: prev.reverbRoom === 'off' ? 0.34 : prev.reverbMix,
      }));
    } else {
      setSoundSettings((prev) => ({
        ...prev,
        playbackSpeed: 1.25,
        preservePitch: false,
        reverbRoom: 'off',
      }));
    }
  };

  const balanceLabel =
    Math.abs(soundSettings.stereoBalance) < 0.04
      ? t.balanceCenter || 'مرکز'
      : soundSettings.stereoBalance < 0
      ? `${t.balanceLeft || 'چپ'} ${Math.round(Math.abs(soundSettings.stereoBalance) * 100)}%`
      : `${t.balanceRight || 'راست'} ${Math.round(soundSettings.stereoBalance * 100)}%`;

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '18px 24px',
    borderBottom: `1px solid ${theme.colors.border}`,
  };

  const sliderBlockStyle: React.CSSProperties = {
    padding: '18px 24px',
    borderBottom: `1px solid ${theme.colors.border}`,
  };

  const sectionHeadingStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '18px 24px 12px',
    fontSize: '13.5px',
    fontWeight: 700,
    color: theme.colors.primary,
    borderBottom: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)',
  };

  return (
    <div
      style={{
        flex: 1,
        padding: 'clamp(16px, 3.5vw, 40px)',
        paddingBottom: '140px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
      }}
    >
      {/* نوار بالای صفحه صدا */}
      <div
        style={{
          width: '100%',
          maxWidth: '1000px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '22px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: theme.radius.md || '12px',
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textPrimary,
              cursor: 'pointer',
              fontSize: '13.5px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            <span>{t.back || 'بازگشت'}</span>
          </button>

          <h1
            style={{
              fontSize: 'clamp(22px, 3vw, 30px)',
              fontWeight: 800,
              margin: 0,
              color: theme.colors.textPrimary,
            }}
          >
            {t.soundPageTitle || 'تنظیمات صدا'}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleResetAllAudio}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: theme.radius.md || '12px',
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.surface,
            color: theme.colors.textSecondary,
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          <RotateCcw size={15} />
          <span>{t.resetSoundSettings || 'بازنشانی صدا'}</span>
        </button>
      </div>

      {/* کارت اصلی تنظیمات صدا */}
      <div
        style={{
          ...theme.glass?.card,
          borderRadius: theme.radius.xl || '24px',
          width: '100%',
          maxWidth: '1000px',
          overflow: 'hidden',
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        {/* پیش‌نمایش طیف زنده صدا در بالای تنظیمات صدا */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          <LiveSpectrumPreview enabled={soundSettings.liveVisualizer} theme={theme} />
        </div>

        {/* بخش ۱: انتقال و پخش پیوسته */}
        <div style={sectionHeadingStyle}>
          <Disc3 size={17} />
          <span>{t.soundSectionTransitions || 'انتقال و پخش پیوسته'}</span>
        </div>

        <div style={sliderBlockStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '10px',
            }}
          >
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
                {t.crossfadeLabel || 'محو شدن بین آهنگ‌ها (Crossfade)'}
              </div>
              <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
                {t.crossfadeDesc || 'هم‌پوشانی نرم پایان یک آهنگ با شروع آهنگ بعدی'}
              </div>
            </div>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: soundSettings.crossfadeSeconds > 0 ? theme.colors.primary : theme.colors.textSecondary,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {soundSettings.crossfadeSeconds === 0
                ? t.off || 'خاموش'
                : `${soundSettings.crossfadeSeconds} ${t.secondsShort || 'ثانیه'}`}
            </span>
          </div>
          <RangeSlider
            value={soundSettings.crossfadeSeconds}
            min={0}
            max={12}
            step={1}
            onChange={(val) => updateSound('crossfadeSeconds', val)}
            theme={theme}
          />
        </div>

        <div style={rowStyle}>
          <div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
              {t.fadePlayPauseLabel || 'نرم‌شدن شروع و توقف'}
            </div>
            <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
              {t.fadePlayPauseDesc || 'افزایش و کاهش تدریجی صدا هنگام Play و Pause'}
            </div>
          </div>
          <ToggleSwitch
            checked={soundSettings.fadeOnPlayPause}
            onChange={(next) => updateSound('fadeOnPlayPause', next)}
            theme={theme}
            ariaLabel={t.fadePlayPauseLabel || 'Fade on Play Pause'}
          />
        </div>

        <div style={rowStyle}>
          <div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
              {t.gaplessLabel || 'پخش بدون وقفه (Gapless)'}
            </div>
            <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
              {t.gaplessDesc || 'حذف مکث و آماده‌سازی خودکار آهنگ بعدی پیش از پایان'}
            </div>
          </div>
          <ToggleSwitch
            checked={soundSettings.gaplessPlayback}
            onChange={(next) => updateSound('gaplessPlayback', next)}
            theme={theme}
            ariaLabel={t.gaplessLabel || 'Gapless Playback'}
          />
        </div>

        {/* بخش ۲: سرعت و فضای صدا */}
        <div style={sectionHeadingStyle}>
          <Gauge size={17} />
          <span>{t.soundSectionAtmosphere || 'سرعت و فضای صدا'}</span>
        </div>

        <div style={sliderBlockStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '10px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
                {t.playbackSpeedLabel || 'سرعت پخش'}
              </div>
              <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
                {t.playbackSpeedDesc || 'تنظیم سرعت اجرا (مناسب برای Slowed یا Nightcore)'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'slowed' as const, label: t.presetSlowedReverb || 'Slowed + Reverb' },
                { id: 'normal' as const, label: t.presetNormalSpeed || 'عادی 1.0x' },
                { id: 'nightcore' as const, label: t.presetNightcore || 'Nightcore' },
              ].map((presetBtn) => (
                <button
                  key={presetBtn.id}
                  type="button"
                  onClick={() => applySpeedMood(presetBtn.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: theme.radius.sm || '8px',
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.background,
                    color: theme.colors.textPrimary,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {presetBtn.label}
                </button>
              ))}
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: soundSettings.playbackSpeed !== 1 ? theme.colors.primary : theme.colors.textSecondary,
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: '48px',
                  textAlign: 'end',
                }}
              >
                {soundSettings.playbackSpeed.toFixed(2)}x
              </span>
            </div>
          </div>
          <RangeSlider
            value={soundSettings.playbackSpeed}
            min={0.5}
            max={2.0}
            step={0.05}
            onChange={(val) => updateSound('playbackSpeed', Number(val.toFixed(2)))}
            theme={theme}
          />
        </div>

        <div style={rowStyle}>
          <div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
              {t.preservePitchLabel || 'حفظ زیر و بمی صدا'}
            </div>
            <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
              {t.preservePitchDesc || 'با غیرفعال کردن، تغییر سرعت زیر و بمی صدا را نیز تغییر می‌دهد'}
            </div>
          </div>
          <ToggleSwitch
            checked={soundSettings.preservePitch}
            onChange={(next) => updateSound('preservePitch', next)}
            theme={theme}
            ariaLabel={t.preservePitchLabel || 'Preserve Pitch'}
          />
        </div>

        <div style={sliderBlockStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: soundSettings.reverbRoom !== 'off' ? '14px' : '0',
            }}
          >
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
                {t.reverbRoomLabel || 'افکت فضا و ریورب'}
              </div>
              <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
                {t.reverbRoomDesc || 'شبیه‌سازی آکوستیک محیط (استودیو، سالن یا کلیسا)'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(
                [
                  { id: 'off', label: t.reverbOff || 'خاموش' },
                  { id: 'studio', label: t.reverbStudio || 'استودیو' },
                  { id: 'hall', label: t.reverbHall || 'سالن کنسرت' },
                  { id: 'cathedral', label: t.reverbCathedral || 'کلیسا / عمیق' },
                ] as { id: ReverbRoom; label: string }[]
              ).map((room) => {
                const isActive = soundSettings.reverbRoom === room.id;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => updateSound('reverbRoom', room.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: theme.radius.sm || '8px',
                      border: `1px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
                      backgroundColor: isActive ? theme.colors.primary : theme.colors.background,
                      color: isActive ? '#ffffff' : theme.colors.textPrimary,
                      fontSize: '12.5px',
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {room.label}
                  </button>
                );
              })}
            </div>
          </div>

          {soundSettings.reverbRoom !== 'off' && (
            <div style={{ marginTop: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12.5px',
                  color: theme.colors.textSecondary,
                  marginBottom: '6px',
                }}
              >
                <span>{t.reverbMixLabel || 'شدت ریورب'}</span>
                <span style={{ fontWeight: 700, color: theme.colors.primary, fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round(soundSettings.reverbMix * 100)}%
                </span>
              </div>
              <RangeSlider
                value={Math.round(soundSettings.reverbMix * 100)}
                min={0}
                max={100}
                step={2}
                onChange={(val) => updateSound('reverbMix', val / 100)}
                theme={theme}
              />
            </div>
          )}
        </div>

        <div style={sliderBlockStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} color={theme.colors.primary} />
              <div>
                <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
                  {t.spatialSurroundLabel || 'صدای سه‌بعدی (Surround)'}
                </div>
                <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
                  {t.spatialSurroundDesc || 'گسترش صحنه استریو برای حس فراگیرتر در هدفون'}
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: soundSettings.spatialSurround > 0 ? theme.colors.primary : theme.colors.textSecondary,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {soundSettings.spatialSurround}%
            </span>
          </div>
          <RangeSlider
            value={soundSettings.spatialSurround}
            min={0}
            max={100}
            step={5}
            onChange={(val) => updateSound('spatialSurround', val)}
            theme={theme}
          />
        </div>

        {/* بخش ۳: تعادل و کیفیت خروجی */}
        <div style={sectionHeadingStyle}>
          <Waves size={17} />
          <span>{t.soundSectionDynamics || 'تعادل و کیفیت خروجی'}</span>
        </div>

        <div style={rowStyle}>
          <div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
              {t.volumeNormLabel || 'نرمال‌سازی بلندی صدا'}
            </div>
            <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
              {t.volumeNormDesc || 'یکدست‌سازی حجم صدا بین آهنگ‌های ضعیف و پرصدا با لیمیتر هوشمند'}
            </div>
          </div>
          <ToggleSwitch
            checked={soundSettings.volumeNormalization}
            onChange={(next) => updateSound('volumeNormalization', next)}
            theme={theme}
            ariaLabel={t.volumeNormLabel || 'Volume Normalization'}
          />
        </div>

        <div style={sliderBlockStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Volume2 size={18} color={theme.colors.primary} />
              <div>
                <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
                  {t.preampLabel || 'تقویت ورودی (Pre-Amp)'}
                </div>
                <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
                  {t.preampDesc || 'تنظیم سطح پایه خروجی پیش از اعمال اکولایزر'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateSound('preampDb', 0)}
              title="0 dB"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 700,
                color: soundSettings.preampDb !== 0 ? theme.colors.primary : theme.colors.textSecondary,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {soundSettings.preampDb > 0 ? `+${soundSettings.preampDb}` : soundSettings.preampDb}{' '}
              {t.db || 'dB'}
            </button>
          </div>
          <RangeSlider
            value={soundSettings.preampDb}
            min={-12}
            max={12}
            step={1}
            centeredZero
            onChange={(val) => updateSound('preampDb', val)}
            theme={theme}
          />
        </div>

        <div style={sliderBlockStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '10px',
            }}
          >
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
                {t.stereoBalanceLabel || 'بالانس چپ و راست'}
              </div>
              <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
                {t.stereoBalanceDesc || 'تنظیم تعادل صدا بین کانال چپ و راست'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateSound('stereoBalance', 0)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: '13.5px',
                fontWeight: 700,
                color: Math.abs(soundSettings.stereoBalance) >= 0.04 ? theme.colors.primary : theme.colors.textSecondary,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {balanceLabel}
            </button>
          </div>
          <RangeSlider
            value={Math.round(soundSettings.stereoBalance * 100)}
            min={-100}
            max={100}
            step={5}
            centeredZero
            onChange={(val) => updateSound('stereoBalance', val / 100)}
            theme={theme}
          />
        </div>

        <div style={rowStyle}>
          <div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
              {t.monoAudioLabel || 'حالت مونو (Mono)'}
            </div>
            <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
              {t.monoAudioDesc || 'ترکیب دو کانال در یک خروجی یکسان (مناسب تک‌گوشی)'}
            </div>
          </div>
          <ToggleSwitch
            checked={soundSettings.monoAudio}
            onChange={(next) => updateSound('monoAudio', next)}
            theme={theme}
            ariaLabel={t.monoAudioLabel || 'Mono Audio'}
          />
        </div>

        <div style={sliderBlockStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} color={theme.colors.primary} />
              <div>
                <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
                  {t.maxVolumeLimitLabel || 'سقف ایمن ولوم'}
                </div>
                <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
                  {t.maxVolumeLimitDesc || 'محدود کردن حداکثر بلندی صدا برای محافظت از شنوایی'}
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: soundSettings.maxVolumeLimit < 100 ? theme.colors.primary : theme.colors.textSecondary,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {soundSettings.maxVolumeLimit}%
            </span>
          </div>
          <RangeSlider
            value={soundSettings.maxVolumeLimit}
            min={20}
            max={100}
            step={5}
            onChange={(val) => updateSound('maxVolumeLimit', val)}
            theme={theme}
          />
        </div>

        {/* بخش ۴: پروفایل خروجی و اکولایزر پیشرفته */}
        <div style={sectionHeadingStyle}>
          <Sliders size={17} />
          <span>{t.soundSectionEqualizer || 'اکولایزر و پروفایل خروجی'}</span>
        </div>

        <div style={sliderBlockStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '18px',
            }}
          >
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
                {t.outputProfileLabel || 'پروفایل خروجی صدا'}
              </div>
              <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
                {t.outputProfileDesc || 'ذخیره تنظیمات مجزا برای هر دستگاه پخش'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(
                [
                  { id: 'default', label: t.profileDefault || 'پیش‌فرض', icon: <Laptop size={14} /> },
                  { id: 'headphones', label: t.profileHeadphones || 'هدفون', icon: <Headphones size={14} /> },
                  { id: 'speaker', label: t.profileSpeaker || 'اسپیکر', icon: <Speaker size={14} /> },
                ] as { id: AudioOutputProfile; label: string; icon: React.ReactNode }[]
              ).map((prof) => {
                const isActive = soundSettings.outputProfile === prof.id;
                return (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => handleSelectProfile(prof.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 12px',
                      borderRadius: theme.radius.sm || '8px',
                      border: `1px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
                      backgroundColor: isActive ? theme.colors.primary : theme.colors.background,
                      color: isActive ? '#ffffff' : theme.colors.textPrimary,
                      fontSize: '12.5px',
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {prof.icon}
                    <span>{prof.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <EqualizerControl
            settings={equalizerSettings}
            onChange={setEqualizerSettings}
            eqMode={soundSettings.eqMode}
            bands10={soundSettings.bands10}
            onChangeEqMode={(mode) => updateSound('eqMode', mode)}
            onChangeBands10={(bands) => updateSound('bands10', bands)}
            theme={theme}
            t={t}
            embedded
          />
        </div>

        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={18} color={theme.colors.primary} />
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
                {t.liveVisualizerLabel || 'واکنش‌گرای زنده صدا (Visualizer)'}
              </div>
              <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
                {t.liveVisualizerDesc || 'نمایش طیف فرکانسی زنده در تنظیمات صدا و پلیر تمام‌صفحه'}
              </div>
            </div>
          </div>
          <ToggleSwitch
            checked={soundSettings.liveVisualizer}
            onChange={(next) => updateSound('liveVisualizer', next)}
            theme={theme}
            ariaLabel={t.liveVisualizerLabel || 'Live Audio Visualizer'}
          />
        </div>
      </div>
    </div>
  );
};
