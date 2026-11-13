import React, { useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Disc3,
  Eye,
  Image as ImageIcon,
  Layers,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  RotateCcw,
  Sliders,
  Smartphone,
  Sparkles,
  Sun,
  Type,
  Upload,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type {
  ArtworkStyle,
  CornerStyle,
  DisplaySettings as DisplaySettingsType,
  FontChoice,
  ListDensity,
  PlayerBarStyle,
  VisualizerStyle,
} from '../types';
import { DEFAULT_DISPLAY_SETTINGS, type PaletteType, type ThemeMode } from '../theme';

interface DisplaySettingsProps {
  displaySettings: DisplaySettingsType;
  setDisplaySettings: React.Dispatch<React.SetStateAction<DisplaySettingsType>>;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colorPalette: PaletteType;
  setColorPalette: (palette: PaletteType) => void;
  customBackground?: string | null;
  setCustomBackground?: (bg: string | null) => void;
  customBgBlur?: number;
  setCustomBgBlur?: (blur: number) => void;
  customBgDim?: number;
  setCustomBgDim?: (dim: number) => void;
  glassCardCovers?: boolean;
  setGlassCardCovers?: (enabled: boolean) => void;
  onBack: () => void;
  theme: any;
  t: any;
  language: string;
}

const PALETTES: { id: PaletteType; labelFa: string; labelEn: string; color: string; secondaryColor: string }[] = [
  { id: 'classic-blue', labelFa: 'آبی کلاسیک', labelEn: 'Classic Blue', color: '#0066FF', secondaryColor: '#38BDF8' },
  { id: 'classic-red', labelFa: 'قرمز کلاسیک', labelEn: 'Classic Red', color: '#DC2626', secondaryColor: '#EF4444' },
  { id: 'nordic', labelFa: 'نوردیک استیل', labelEn: 'Nordic Steel', color: '#57707A', secondaryColor: '#C5BAC4' },
  { id: 'glacier', labelFa: 'اقیانوس و قطب', labelEn: 'Glacier', color: '#4A5C6A', secondaryColor: '#CCD0CF' },
  { id: 'amethyst', labelFa: 'آمیتیست بنفش', labelEn: 'Amethyst', color: '#8B7CC7', secondaryColor: '#5A3B8C' },
  { id: 'sapphire', labelFa: 'یاقوت کبود', labelEn: 'Sapphire', color: '#3B82F6', secondaryColor: '#1C2541' },
  { id: 'amber', labelFa: 'قهوه و موکا', labelEn: 'Amber Mocha', color: '#C6601F', secondaryColor: '#A88462' },
  { id: 'sunset', labelFa: 'غروب نارنجی', labelEn: 'Sunset', color: '#FF7A00', secondaryColor: '#FFA94D' },
  { id: 'emerald', labelFa: 'زمرد و بیشه', labelEn: 'Emerald', color: '#48BB78', secondaryColor: '#163832' },
  { id: 'teal', labelFa: 'تالاب دریایی', labelEn: 'Teal', color: '#14B8A6', secondaryColor: '#7FB3B8' },
  { id: 'synthwave', labelFa: 'نئون سایبر', labelEn: 'Synthwave', color: '#FF6B6B', secondaryColor: '#D6598F' },
  { id: 'mauve', labelFa: 'مخملی بنفش', labelEn: 'Mauve', color: '#D946EF', secondaryColor: '#DFB6B2' },
  { id: 'mint', labelFa: 'فیروزه و نعنا', labelEn: 'Mint', color: '#2DD4BF', secondaryColor: '#99F6E4' },
];

const WALLPAPER_PRESETS = [
  { id: 'nebula', labelFa: 'کیهان و ستاره‌ها', labelEn: 'Cosmos', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80' },
  { id: 'mountain', labelFa: 'کوهستان برفی', labelEn: 'Alpine', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&auto=format&fit=crop&q=80' },
  { id: 'cyber', labelFa: 'افق نئونی شب', labelEn: 'Neon Skyline', url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1600&auto=format&fit=crop&q=80' },
  { id: 'ocean', labelFa: 'امواج اقیانوس', labelEn: 'Ocean', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80' },
  { id: 'gradient', labelFa: 'گرادیان ارغوانی', labelEn: 'Violet Flow', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80' },
];

const ToggleSwitch = ({
  checked,
  onChange,
  theme,
  ariaLabel,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  theme: any;
  ariaLabel: string;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    style={{
      position: 'relative',
      direction: 'ltr',
      width: '48px',
      height: '28px',
      borderRadius: '14px',
      backgroundColor: checked ? theme.colors.primary : theme.colors.border,
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transition: 'background-color 0.22s ease, opacity 0.2s ease, scale 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
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
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  theme: any;
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
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            backgroundColor: theme.colors.primary,
            borderRadius: '3px',
          }}
        />
      </div>
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

export const DisplaySettings: React.FC<DisplaySettingsProps> = ({
  displaySettings,
  setDisplaySettings,
  themeMode,
  setThemeMode,
  colorPalette,
  setColorPalette,
  customBackground,
  setCustomBackground,
  customBgBlur = 10,
  setCustomBgBlur,
  customBgDim = 45,
  setCustomBgDim,
  glassCardCovers = true,
  setGlassCardCovers,
  onBack,
  theme,
  t,
  language,
}) => {
  const isRTL = language === 'fa';
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  const updateDisplay = <K extends keyof DisplaySettingsType>(
    key: K,
    value: DisplaySettingsType[K]
  ) => {
    setDisplaySettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setCustomBackground?.(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleResetAllDisplay = () => {
    setDisplaySettings({ ...DEFAULT_DISPLAY_SETTINGS });
    setThemeMode('system');
    setColorPalette('classic-blue');
    setCustomBackground?.(null);
    setCustomBgBlur?.(10);
    setCustomBgDim?.(45);
    setGlassCardCovers?.(true);
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '18px 24px',
    borderBottom: `1px solid ${theme.colors.border}`,
  };

  const blockStyle: React.CSSProperties = {
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

  const segmentedBtn = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    borderRadius: theme.radius.sm || '8px',
    border: `1px solid ${active ? theme.colors.primary : theme.colors.border}`,
    backgroundColor: active ? theme.colors.primary : theme.colors.background,
    color: active ? '#ffffff' : theme.colors.textPrimary,
    fontSize: '12.5px',
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  });

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
      {/* هدر بالا */}
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
            {t.displayPageTitle || 'ظاهر و نمایش'}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleResetAllDisplay}
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
          <span>{t.resetDisplaySettings || 'بازنشانی ظاهر'}</span>
        </button>
      </div>

      {/* کارت اصلی تنظیمات ظاهر */}
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
        {/* پیش‌نمایش زنده سبک ظاهری فعلی */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius:
                  displaySettings.artworkStyle === 'vinyl'
                    ? '50%'
                    : theme.radius.md || '12px',
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent || theme.colors.secondary})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: `0 6px 18px ${theme.colors.primary}44`,
                flexShrink: 0,
              }}
            >
              <Disc3 size={22} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: theme.colors.textPrimary }}>
                {theme.name || (theme.isDark ? t.dark : t.light)}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: theme.colors.textSecondary,
                  marginTop: '3px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {[
                  themeMode === 'system' ? t.system || 'سیستم' : theme.isDark ? t.dark : t.light,
                  displaySettings.oledPureBlack && theme.isDark ? 'OLED' : null,
                  `${Math.round(displaySettings.fontScale * 100)}%`,
                  displaySettings.playerBarStyle === 'docked'
                    ? t.playerBarDocked || 'تمام‌عرض'
                    : t.playerBarFloating || 'شناور',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '76px',
                height: '12px',
                borderRadius: theme.radius.sm || '6px',
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '62%',
                  height: '100%',
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.radius.sm || '6px',
                }}
              />
            </div>
          </div>
        </div>

        {/* بخش ۱: تم و رنگ‌بندی هوشمند */}
        <div style={sectionHeadingStyle}>
          <Palette size={17} />
          <span>{t.displaySectionTheme || 'تم و رنگ‌بندی هوشمند'}</span>
        </div>

        <div style={{ ...blockStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
              {t.theme || 'تم برنامه'}
            </div>
            <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
              {themeMode === 'system' ? t.system || 'پیش‌فرض سیستم' : themeMode === 'dark' ? t.dark : t.light}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(
              [
                { id: 'system', label: t.system || 'سیستم', icon: <Smartphone size={14} /> },
                { id: 'light', label: t.light || 'روشن', icon: <Sun size={14} /> },
                { id: 'dark', label: t.dark || 'تیره', icon: <Moon size={14} /> },
              ] as { id: ThemeMode; label: string; icon: React.ReactNode }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setThemeMode(opt.id)}
                style={segmentedBtn(themeMode === opt.id)}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={rowStyle}>
          <div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
              {t.oledPureBlackLabel || 'حالت مشکی مطلق (OLED)'}
            </div>
            <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
              {t.oledPureBlackDesc || 'استفاده از پس‌زمینه تمام‌مشکی در تم تیره برای کنتراست بیشتر'}
            </div>
          </div>
          <ToggleSwitch
            checked={displaySettings.oledPureBlack}
            onChange={(next) => updateDisplay('oledPureBlack', next)}
            theme={theme}
            ariaLabel={t.oledPureBlackLabel || 'Pure Black OLED'}
          />
        </div>

        <div style={blockStyle}>
          <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary, marginBottom: '12px' }}>
            {t.colorPalette || 'پالت رنگی'}
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {PALETTES.map((palette) => {
              const selected =
                colorPalette === palette.id ||
                (colorPalette === 'default' && palette.id === 'classic-blue');
              return (
                <button
                  key={palette.id}
                  type="button"
                  onClick={() => setColorPalette(palette.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 12px',
                    borderRadius: theme.radius.md || '14px',
                    border: selected
                      ? `2px solid ${palette.color}`
                      : `1px solid ${theme.colors.border}`,
                    backgroundColor: selected ? `${palette.color}20` : theme.colors.background,
                    boxShadow: selected ? `0 0 12px ${palette.color}44` : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${palette.color} 50%, ${palette.secondaryColor} 50%)`,
                      border: '1.5px solid rgba(255, 255, 255, 0.4)',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12.5px',
                      fontWeight: selected ? 700 : 500,
                      color: selected ? theme.colors.textPrimary : theme.colors.textSecondary,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isRTL ? palette.labelFa : palette.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={rowStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} color={theme.colors.primary} />
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
                {t.adaptiveAccentLabel || 'رنگ تاکیدی هوشمند از کاور'}
              </div>
              <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
                {t.adaptiveAccentDesc || 'استخراج خودکار رنگ غالب کاور آهنگ فعلی برای دکمه‌ها و نوار پخش'}
              </div>
            </div>
          </div>
          <ToggleSwitch
            checked={displaySettings.adaptiveArtworkAccent}
            onChange={(next) => updateDisplay('adaptiveArtworkAccent', next)}
            theme={theme}
            ariaLabel={t.adaptiveAccentLabel || 'Adaptive Artwork Accent'}
          />
        </div>

        <div style={rowStyle}>
          <div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
              {t.ambientGlowLabel || 'هاله‌های نورانی پس‌زمینه'}
            </div>
            <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
              {t.ambientGlowDesc || 'نمایش گرادیان‌های رنگی نرم در پشت صفحات برنامه'}
            </div>
          </div>
          <ToggleSwitch
            checked={displaySettings.ambientGlow}
            onChange={(next) => updateDisplay('ambientGlow', next)}
            theme={theme}
            ariaLabel={t.ambientGlowLabel || 'Ambient Glow'}
          />
        </div>

        {/* بخش ۲: پس‌زمینه و متریال شیشه‌ای */}
        <div style={sectionHeadingStyle}>
          <ImageIcon size={17} />
          <span>{t.displaySectionBackdrop || 'پس‌زمینه و متریال شیشه‌ای'}</span>
        </div>

        <div style={rowStyle}>
          <div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
              {t.adaptiveWallpaperLabel || 'والپیپر پویا با کاور آهنگ'}
            </div>
            <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
              {t.adaptiveWallpaperDesc || 'تبدیل خودکار کاور تار شده آهنگ فعلی به پس‌زمینه کل برنامه'}
            </div>
          </div>
          <ToggleSwitch
            checked={displaySettings.adaptiveArtworkWallpaper}
            onChange={(next) => updateDisplay('adaptiveArtworkWallpaper', next)}
            theme={theme}
            ariaLabel={t.adaptiveWallpaperLabel || 'Dynamic Artwork Wallpaper'}
          />
        </div>

        <div style={blockStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
                {t.customBackground || 'پس‌زمینه دلخواه برنامه'}
              </div>
              <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
                {t.selectWallpaperHint || 'تصویر دلخواه خود را برای بک‌گراند شیشه‌ای برنامه تنظیم کنید.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {customBackground && (
                <button
                  type="button"
                  onClick={() => setCustomBackground?.(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 12px',
                    borderRadius: theme.radius.sm || '10px',
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.background,
                    color: theme.colors.textSecondary,
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <RefreshCw size={14} />
                  <span>{t.resetWallpaper || 'پیش‌فرض'}</span>
                </button>
              )}

              <input
                ref={wallpaperInputRef}
                type="file"
                accept="image/*"
                onChange={handleWallpaperUpload}
                style={{ display: 'none' }}
              />

              <button
                type="button"
                onClick={() => wallpaperInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: theme.radius.sm || '10px',
                  border: 'none',
                  backgroundColor: theme.colors.primary,
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: 600,
                }}
              >
                <Upload size={14} />
                <span>{t.uploadWallpaper || 'انتخاب تصویر دلخواه'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            {WALLPAPER_PRESETS.map((preset) => {
              const isSelected = customBackground === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setCustomBackground?.(preset.url)}
                  title={isRTL ? preset.labelFa : preset.labelEn}
                  style={{
                    position: 'relative',
                    width: '74px',
                    height: '52px',
                    borderRadius: theme.radius.sm || '10px',
                    overflow: 'hidden',
                    border: isSelected
                      ? `2.5px solid ${theme.colors.primary}`
                      : `1px solid ${theme.colors.border}`,
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={preset.url}
                    alt={isRTL ? preset.labelFa : preset.labelEn}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: `${theme.colors.primary}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={18} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {(customBackground || displaySettings.adaptiveArtworkWallpaper) && (
            <div
              style={{
                marginTop: '14px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12.5px',
                    color: theme.colors.textSecondary,
                    marginBottom: '4px',
                  }}
                >
                  <span>{t.wallpaperBlur || 'میزان تاری تصویر (Blur)'}</span>
                  <span style={{ fontWeight: 700, color: theme.colors.primary, fontVariantNumeric: 'tabular-nums' }}>
                    {customBgBlur}px
                  </span>
                </div>
                <RangeSlider
                  value={customBgBlur}
                  min={0}
                  max={36}
                  step={1}
                  onChange={(val) => setCustomBgBlur?.(val)}
                  theme={theme}
                />
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12.5px',
                    color: theme.colors.textSecondary,
                    marginBottom: '4px',
                  }}
                >
                  <span>{t.wallpaperDim || 'تیرگی لایه محافظ'}</span>
                  <span style={{ fontWeight: 700, color: theme.colors.primary, fontVariantNumeric: 'tabular-nums' }}>
                    {customBgDim}%
                  </span>
                </div>
                <RangeSlider
                  value={customBgDim}
                  min={10}
                  max={85}
                  step={1}
                  onChange={(val) => setCustomBgDim?.(val)}
                  theme={theme}
                />
              </div>
            </div>
          )}
        </div>

        <div style={rowStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={18} color={theme.colors.primary} />
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
                {t.glassCardCovers || 'کاور شیشه‌ای روی کارت آهنگ‌ها'}
              </div>
              <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
                {t.glassCardCoversDesc || 'نمایش تصویر کاور هر آهنگ به صورت پس‌زمینه شیشه‌ای روی کارت آن'}
              </div>
            </div>
          </div>
          <ToggleSwitch
            checked={glassCardCovers}
            onChange={(next) => setGlassCardCovers?.(next)}
            theme={theme}
            ariaLabel={t.glassCardCovers || 'Glass Card Covers'}
          />
        </div>

        <div style={blockStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: theme.colors.textPrimary }}>
                    {t.glassOpacityLabel || 'شفافیت لایه‌های شیشه‌ای'}
                  </div>
                  <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>
                    {t.glassOpacityDesc || 'تنظیم میزان ماتی یا شفافیت کارت‌ها و پنل‌ها'}
                  </div>
                </div>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: theme.colors.primary, fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round(displaySettings.glassOpacity * 100)}%
                </span>
              </div>
              <RangeSlider
                value={Math.round(displaySettings.glassOpacity * 100)}
                min={25}
                max={95}
                step={5}
                onChange={(val) => updateDisplay('glassOpacity', val / 100)}
                theme={theme}
              />
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: theme.colors.textPrimary }}>
                    {t.glassBlurLabel || 'میزان بلور شیشه'}
                  </div>
                  <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>
                    {t.glassBlurDesc || 'تنظیم شدت محوشدگی پس‌زمینه پشت کارت‌های شیشه‌ای'}
                  </div>
                </div>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: theme.colors.primary, fontVariantNumeric: 'tabular-nums' }}>
                  {displaySettings.glassBlur}px
                </span>
              </div>
              <RangeSlider
                value={displaySettings.glassBlur}
                min={0}
                max={36}
                step={2}
                onChange={(val) => updateDisplay('glassBlur', val)}
                theme={theme}
              />
            </div>
          </div>
        </div>

        {/* بخش ۳: فونت، چیدمان و انیمیشن */}
        <div style={sectionHeadingStyle}>
          <Type size={17} />
          <span>{t.displaySectionTypography || 'فونت، چیدمان و انیمیشن'}</span>
        </div>

        <div style={{ ...blockStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
              {t.fontFamilyLabel || 'فونت برنامه'}
            </div>
            <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
              {t.fontFamilyDesc || 'انتخاب سبک تایپوگرافی در سراسر رابط کاربری'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(
              [
                { id: 'vazirmatn', label: t.fontVazirmatn || 'وزیرمتن' },
                { id: 'system', label: t.fontSystem || 'فونت سیستم' },
                { id: 'editorial', label: t.fontEditorial || 'ادیتوریال' },
              ] as { id: FontChoice; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateDisplay('fontFamily', opt.id)}
                style={segmentedBtn(displaySettings.fontFamily === opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={blockStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
                {t.fontScaleLabel || 'مقیاس و اندازه متن'}
              </div>
              <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
                {t.fontScaleDesc || 'بزرگ یا کوچک کردن متون و اجزای رابط کاربری'}
              </div>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: theme.colors.primary, fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(displaySettings.fontScale * 100)}%
            </span>
          </div>
          <RangeSlider
            value={Math.round(displaySettings.fontScale * 100)}
            min={85}
            max={115}
            step={5}
            onChange={(val) => updateDisplay('fontScale', val / 100)}
            theme={theme}
          />
        </div>

        <div style={{ ...blockStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
              {t.cornerStyleLabel || 'فرم گوشه‌ها'}
            </div>
            <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
              {t.cornerStyleDesc || 'میزان گردی کارت‌ها، دکمه‌ها و کاورها'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(
              [
                { id: 'sharp', label: t.cornerSharp || 'تیز' },
                { id: 'balanced', label: t.cornerBalanced || 'متعادل' },
                { id: 'pill', label: t.cornerPill || 'بسیار گرد' },
              ] as { id: CornerStyle; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateDisplay('cornerStyle', opt.id)}
                style={segmentedBtn(displaySettings.cornerStyle === opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...blockStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
              {t.listDensityLabel || 'تراکم و فاصله لیست‌ها'}
            </div>
            <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
              {t.listDensityDesc || 'تنظیم فضای بین ردیف‌ها و کارت‌های موسیقی'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(
              [
                { id: 'compact', label: t.densityCompact || 'فشرده' },
                { id: 'comfortable', label: t.densityComfortable || 'استاندارد' },
                { id: 'spacious', label: t.densitySpacious || 'باز و راحت' },
              ] as { id: ListDensity; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateDisplay('listDensity', opt.id)}
                style={segmentedBtn(displaySettings.listDensity === opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={rowStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Eye size={18} color={theme.colors.primary} />
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
                {t.reduceMotionLabel || 'کاهش انیمیشن‌ها'}
              </div>
              <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
                {t.reduceMotionDesc || 'جابه‌جایی فوری و کاهش حرکت‌های گرافیکی برای سرعت بیشتر'}
              </div>
            </div>
          </div>
          <ToggleSwitch
            checked={displaySettings.reduceMotion}
            onChange={(next) => updateDisplay('reduceMotion', next)}
            theme={theme}
            ariaLabel={t.reduceMotionLabel || 'Reduce Motion'}
          />
        </div>

        {/* بخش ۴: ظاهر پخش‌کننده و تمام‌صفحه */}
        <div style={sectionHeadingStyle}>
          <Monitor size={17} />
          <span>{t.displaySectionPlayer || 'ظاهر پخش‌کننده و تمام‌صفحه'}</span>
        </div>

        <div style={{ ...blockStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
              {t.playerBarStyleLabel || 'استایل نوار پلیر پایین'}
            </div>
            <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
              {t.playerBarStyleDesc || 'انتخاب بین نوار شناور کپسولی یا نوار چسبیده تمام‌عرض'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(
              [
                { id: 'floating', label: t.playerBarFloating || 'شناور' },
                { id: 'docked', label: t.playerBarDocked || 'تمام‌عرض' },
              ] as { id: PlayerBarStyle; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateDisplay('playerBarStyle', opt.id)}
                style={segmentedBtn(displaySettings.playerBarStyle === opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...blockStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
              {t.artworkStyleLabel || 'سبک کاور در تمام‌صفحه'}
            </div>
            <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
              {t.artworkStyleDesc || 'نمایش کاور کلاسیک یا دیسک وینیل چرخان هنگام پخش'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(
              [
                { id: 'classic', label: t.artworkClassic || 'کلاسیک مربعی' },
                { id: 'vinyl', label: t.artworkVinyl || 'صفحه وینیل' },
              ] as { id: ArtworkStyle; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateDisplay('artworkStyle', opt.id)}
                style={segmentedBtn(displaySettings.artworkStyle === opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...blockStyle, borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={18} color={theme.colors.primary} />
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: 600, color: theme.colors.textPrimary }}>
                {t.visualizerStyleLabel || 'استایل ویژوالایزر'}
              </div>
              <div style={{ fontSize: '12.5px', color: theme.colors.textSecondary, marginTop: '2px' }}>
                {t.visualizerStyleDesc || 'نوع نمایش ریتم و طیف زنده در پخش تمام‌صفحه'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(
              [
                { id: 'bars', label: t.vizBars || 'میله‌ای' },
                { id: 'wave', label: t.vizWave || 'موج نرم' },
                { id: 'ring', label: t.vizRing || 'هاله دور کاور' },
              ] as { id: VisualizerStyle; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateDisplay('visualizerStyle', opt.id)}
                style={segmentedBtn(displaySettings.visualizerStyle === opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
