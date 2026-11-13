import { useState, useRef, useEffect } from 'react';
import type {
  DisplaySettings as DisplaySettingsType,
  EqualizerSettings,
  SleepTimerState,
  Song,
  SoundSettings as SoundSettingsType,
} from '../types';
import {
  Upload,
  Globe,
  Music,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  FolderUp,
  Download,
  Timer,
  Volume2,
  Monitor,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_DISPLAY_SETTINGS, type PaletteType, type ThemeMode } from '../theme';
import { SoundSettings } from './SoundSettings';
import { DisplaySettings } from './DisplaySettings';
import { DEFAULT_SOUND_SETTINGS } from '../player/audioEffects';
import { extractSongsBatched } from '../utils/audioMetadata';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { withAlpha } from '../utils/color';

interface SettingsProps {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  t: any;
  language: string;
  setLanguage: (lang: 'fa' | 'en') => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colorPalette: PaletteType;
  setColorPalette: (palette: PaletteType) => void;
  equalizerSettings: EqualizerSettings;
  setEqualizerSettings: (settings: EqualizerSettings) => void;
  soundSettings?: SoundSettingsType;
  setSoundSettings?: React.Dispatch<React.SetStateAction<SoundSettingsType>>;
  displaySettings?: DisplaySettingsType;
  setDisplaySettings?: React.Dispatch<React.SetStateAction<DisplaySettingsType>>;
  theme: any;
  customBackground?: string | null;
  setCustomBackground?: (bg: string | null) => void;
  customBgBlur?: number;
  setCustomBgBlur?: (blur: number) => void;
  customBgDim?: number;
  setCustomBgDim?: (dim: number) => void;
  glassCardCovers?: boolean;
  setGlassCardCovers?: (enabled: boolean) => void;
  sleepTimer?: SleepTimerState;
  onSetSleepTimer?: (timer: SleepTimerState) => void;
}

/** یک ردیف تنظیمات: آیکون + عنوان سمت راست، محتوا سمت چپ */
/** یک ردیف تنظیمات: آیکون + عنوان سمت راست، محتوا سمت چپ */
const SettingRow = ({
  icon,
  label,
  children,
  theme,
  isLast,
  zIndex,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  theme: any;
  isLast?: boolean;
  zIndex?: number;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 24px',
      borderBottom: isLast ? 'none' : `1px solid ${theme.colors.border}`,
      position: 'relative',
      zIndex: zIndex || 1,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      {icon}
      <span
        style={{
          fontSize: '16px',
          fontWeight: '500',
          color: theme.colors.textPrimary,
        }}
      >
        {label}
      </span>
    </div>
    {children}
  </div>
);

interface DropdownOption<T> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

/** کامپوننت منوی بازشونده (Dropdown Select) زیبا با استایل بومی و انیمیشن نرم */
const DropdownSelect = <T extends string>({
  value,
  options,
  onChange,
  theme,
  minWidth = 190,
  ariaLabel,
}: {
  value: T;
  options: DropdownOption<T>[];
  onChange: (val: T) => void;
  theme: any;
  minWidth?: number;
  ariaLabel?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const hoverBg = theme.colors.surfaceHover || 'rgba(255, 255, 255, 0.08)';

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '9px 16px',
          minWidth: `${minWidth}px`,
          backgroundColor: theme.colors.background,
          color: theme.colors.textPrimary,
          border: `1.5px solid ${isOpen ? theme.colors.primary : theme.colors.border}`,
          borderRadius: theme.radius.md || '12px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: isOpen ? `0 0 0 3px ${theme.colors.primary}25` : theme.shadows.soft,
          outline: 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {selectedOption?.icon && (
            <span style={{ display: 'flex', color: theme.colors.primary }}>
              {selectedOption.icon}
            </span>
          )}
          <span>{selectedOption?.label}</span>
        </div>

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', color: theme.colors.textSecondary }}
        >
          <ChevronDown size={17} />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              insetInlineEnd: 0,
              minWidth: `${Math.max(minWidth, 200)}px`,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.md || '12px',
              border: `1px solid ${theme.colors.border}`,
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
              padding: '6px',
              zIndex: 100,
              backdropFilter: 'blur(16px)',
            }}
            role="listbox"
          >
            {options.map((option) => {
              const isSelected = option.id === value;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: theme.radius.sm || '8px',
                    border: 'none',
                    backgroundColor: isSelected ? `${theme.colors.primary}18` : 'transparent',
                    color: isSelected ? theme.colors.primary : theme.colors.textPrimary,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isSelected ? '700' : '500',
                    textAlign: 'start',
                    boxSizing: 'border-box',
                    transition: 'background-color 0.15s ease, color 0.15s ease, scale 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = hoverBg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {option.icon && (
                      <span
                        style={{
                          display: 'flex',
                          color: isSelected ? theme.colors.primary : theme.colors.textSecondary,
                        }}
                      >
                        {option.icon}
                      </span>
                    )}
                    <span>{option.label}</span>
                  </div>

                  {isSelected && (
                    <span style={{ display: 'flex', color: theme.colors.primary, marginInlineStart: '12px' }}>
                      <Check size={16} strokeWidth={2.6} />
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** دکمه‌ی انتخاب فایل صوتی (input مخفی داخل label + نمایش وضعیت بارگذاری) */
const UploadButton = ({ isLoading, label, onFilesSelected, theme }: {
  isLoading: boolean;
  label: string;
  onFilesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  theme: any;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <label
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: isLoading ? theme.colors.border : theme.colors.primary,
        color: '#fff',
        padding: '8px 16px',
        borderRadius: theme.radius.md,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        transition: 'opacity 0.18s ease, scale 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
        opacity: isLoading ? 0.7 : hovered ? 0.86 : 1,
      }}
    >
      {label}
      <input
        type="file"
        accept="audio/*"
        multiple
        disabled={isLoading}
        onChange={onFilesSelected}
        style={{ display: 'none' }}
      />
    </label>
  );
};

export const Settings = ({
  songs,
  setSongs,
  t,
  language,
  setLanguage,
  themeMode,
  setThemeMode,
  colorPalette,
  setColorPalette,
  equalizerSettings,
  setEqualizerSettings,
  soundSettings = DEFAULT_SOUND_SETTINGS,
  setSoundSettings,
  displaySettings = DEFAULT_DISPLAY_SETTINGS,
  setDisplaySettings,
  theme,
  customBackground,
  setCustomBackground,
  customBgBlur = 10,
  setCustomBgBlur,
  customBgDim = 45,
  setCustomBgDim,
  glassCardCovers = true,
  setGlassCardCovers,
  sleepTimer = { mode: 'off' },
  onSetSleepTimer,
}: SettingsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [subPage, setSubPage] = useState<'main' | 'sound' | 'display'>('main');
  const [nowTs, setNowTs] = useState(() => Date.now());
  const { isInstallable, isInstalled, install } = usePWAInstall();

  useEffect(() => {
    if (sleepTimer.mode !== 'until') return;
    setNowTs(Date.now());
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [sleepTimer]);

  const remainingSleepSeconds =
    sleepTimer.mode === 'until'
      ? Math.max(0, Math.ceil((sleepTimer.endsAt - nowTs) / 1000))
      : 0;

  const sleepStatusLabel = (() => {
    if (sleepTimer.mode === 'until') {
      const m = Math.floor(remainingSleepSeconds / 60);
      const s = remainingSleepSeconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    }
    if (sleepTimer.mode === 'songEnd') {
      return t.endOfSong || 'پایان آهنگ فعلی';
    }
    return t.sleepTimerOff || 'خاموش';
  })();

  // پردازش دسته‌ای و سریع فایل‌های انتخاب‌شده، استخراج متادیتا و افزودن به لیست آهنگ‌ها
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = input.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    try {
      const newSongs = await extractSongsBatched(Array.from(files));
      if (newSongs.length > 0) {
        setSongs((prev) => [...prev, ...newSongs]);
      }
    } finally {
      setIsLoading(false);
      // ریست input تا انتخاب مجدد همان فایل هم مجاز باشد
      input.value = '';
    }
  };

  const folderUploadProps = {
    webkitdirectory: '',
    directory: '',
  } as React.InputHTMLAttributes<HTMLInputElement>;

  const isRTL = language === 'fa';

  const soundSummaryParts: string[] = [];
  if (equalizerSettings.enabled) {
    soundSummaryParts.push(
      soundSettings.eqMode === '10band'
        ? t.eqMode10Band || '۱۰ بانده'
        : t.eqMode5Band || '۵ بانده'
    );
  }
  if (soundSettings.crossfadeSeconds > 0) {
    soundSummaryParts.push(
      `Crossfade ${soundSettings.crossfadeSeconds}${t.secondsShort || 's'}`
    );
  }
  if (soundSettings.playbackSpeed !== 1) {
    soundSummaryParts.push(`${soundSettings.playbackSpeed.toFixed(2)}x`);
  }
  if (soundSettings.reverbRoom !== 'off') {
    soundSummaryParts.push(
      soundSettings.reverbRoom === 'studio'
        ? t.reverbStudio || 'استودیو'
        : soundSettings.reverbRoom === 'hall'
        ? t.reverbHall || 'سالن'
        : t.reverbCathedral || 'کلیسا'
    );
  }
  const soundSummaryText =
    soundSummaryParts.length > 0
      ? soundSummaryParts.join(' · ')
      : t.soundMenuSubtitle || 'اکولایزر، کراس‌فید، سرعت پخش، ریورب و تعادل خروجی';

  const displayBadgeText = displaySettings.adaptiveArtworkAccent
    ? t.adaptiveAccentLabel || 'پویا'
    : theme.name;

  const soundBadgeText = equalizerSettings.enabled
    ? soundSettings.eqMode === '10band'
      ? '10-Band'
      : 'EQ'
    : soundSettings.reverbRoom !== 'off'
    ? soundSettings.reverbRoom
    : null;

  return (
    <div style={{ width: '100%', overflowX: 'clip' }}>
      <AnimatePresence mode="wait" initial={false}>
        {subPage === 'sound' && setSoundSettings ? (
          <motion.div
            key="settings-sub-sound"
            initial={{ opacity: 0, x: isRTL ? -26 : 26 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? -22 : 22 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <SoundSettings
              soundSettings={soundSettings}
              setSoundSettings={setSoundSettings}
              equalizerSettings={equalizerSettings}
              setEqualizerSettings={setEqualizerSettings}
              onBack={() => setSubPage('main')}
              theme={theme}
              t={t}
              language={language}
            />
          </motion.div>
        ) : subPage === 'display' && setDisplaySettings ? (
          <motion.div
            key="settings-sub-display"
            initial={{ opacity: 0, x: isRTL ? -26 : 26 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? -22 : 22 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <DisplaySettings
              displaySettings={displaySettings}
              setDisplaySettings={setDisplaySettings}
              themeMode={themeMode}
              setThemeMode={setThemeMode}
              colorPalette={colorPalette}
              setColorPalette={setColorPalette}
              customBackground={customBackground}
              setCustomBackground={setCustomBackground}
              customBgBlur={customBgBlur}
              setCustomBgBlur={setCustomBgBlur}
              customBgDim={customBgDim}
              setCustomBgDim={setCustomBgDim}
              glassCardCovers={glassCardCovers}
              setGlassCardCovers={setGlassCardCovers}
              onBack={() => setSubPage('main')}
              theme={theme}
              t={t}
              language={language}
            />
          </motion.div>
        ) : (
          <motion.div
            key="settings-main"
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              flex: 1,
              width: '100%',
              padding: 'clamp(16px, 3.5vw, 40px)',
              paddingBottom: '140px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxSizing: 'border-box',
            }}
          >
      <h1
        style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '30px',
          color: theme.colors.textPrimary,
          width: '100%',
          maxWidth: '1000px',
        }}
      >
        {t.settings}
      </h1>

      <div
        style={{
          ...theme.glass?.card,
          borderRadius: theme.radius.xl || '24px',
          width: '100%',
          maxWidth: '1000px',
          overflow: 'visible',
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        {/* ردیف انتخاب زبان به صورت منوی بازشونده */}
        <SettingRow
          icon={<Globe size={22} color={theme.colors.primary} />}
          label={t.language}
          theme={theme}
          zIndex={30}
        >
          <DropdownSelect
            value={language as 'fa' | 'en'}
            options={[
              {
                id: 'fa',
                label: 'فارسی',
                icon: <Globe size={18} />,
              },
              {
                id: 'en',
                label: 'English',
                icon: <Globe size={18} />,
              },
            ]}
            onChange={(lang) => setLanguage(lang)}
            theme={theme}
            minWidth={170}
            ariaLabel={t.language}
          />
        </SettingRow>

        {/* ردیف ورود به بخش جامع ظاهر و نمایش (Display) */}
        <SettingsNavEntry
          icon={<Monitor size={21} color={theme.colors.primary} />}
          title={t.displayMenuTitle || 'ظاهر و نمایش (Display)'}
          subtitle={[
            themeMode === 'system' ? t.system || 'سیستم' : themeMode === 'dark' ? t.dark : t.light,
            displaySettings.oledPureBlack && theme.isDark ? 'OLED' : null,
            displaySettings.playerBarStyle === 'docked'
              ? t.playerBarDocked || 'تمام‌عرض'
              : t.playerBarFloating || 'شناور',
          ]
            .filter(Boolean)
            .join(' · ')}
          badge={displayBadgeText}
          accent={theme.colors.primary}
          isRTL={isRTL}
          theme={theme}
          onClick={() => setSubPage('display')}
        />

        {/* ردیف ورود به بخش جامع صدا (Sound) */}
        <SettingsNavEntry
          icon={<Volume2 size={21} color={theme.colors.accent || theme.colors.primary} />}
          title={t.soundMenuTitle || 'صدا و افکت‌های صوتی'}
          subtitle={soundSummaryText}
          badge={soundBadgeText}
          accent={theme.colors.accent || theme.colors.primary}
          isRTL={isRTL}
          theme={theme}
          onClick={() => setSubPage('sound')}
        />

        {/* بخش تایمر خواب (Sleep Timer) */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Timer size={22} color={theme.colors.primary} />
            <div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: theme.colors.textPrimary,
                }}
              >
                {t.sleepTimer || 'تایمر خواب'}
              </div>
              <div
                style={{
                  fontSize: '12.5px',
                  color:
                    sleepTimer.mode !== 'off'
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                  fontWeight: sleepTimer.mode !== 'off' ? 700 : 400,
                  fontVariantNumeric: 'tabular-nums',
                  marginTop: '3px',
                }}
              >
                {sleepStatusLabel}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'off', label: t.sleepTimerOff || 'خاموش' },
              { id: '15', mins: 15, label: `15 ${t.sleepMinutes || 'دقیقه'}` },
              { id: '30', mins: 30, label: `30 ${t.sleepMinutes || 'دقیقه'}` },
              { id: '60', mins: 60, label: `60 ${t.sleepMinutes || 'دقیقه'}` },
              { id: 'songEnd', label: t.endOfSong || 'پایان آهنگ فعلی' },
            ].map((opt) => {
              const isActive =
                opt.id === 'off'
                  ? sleepTimer.mode === 'off'
                  : opt.id === 'songEnd'
                  ? sleepTimer.mode === 'songEnd'
                  : sleepTimer.mode === 'until' &&
                    sleepTimer.durationMinutes === opt.mins;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (!onSetSleepTimer) return;
                    if (opt.id === 'off') {
                      onSetSleepTimer({ mode: 'off' });
                    } else if (opt.id === 'songEnd') {
                      onSetSleepTimer({ mode: 'songEnd' });
                    } else if (opt.mins) {
                      onSetSleepTimer({
                        mode: 'until',
                        endsAt: Date.now() + opt.mins * 60 * 1000,
                        durationMinutes: opt.mins,
                      });
                    }
                  }}
                  style={{
                    padding: '7px 13px',
                    borderRadius: theme.radius.md || '10px',
                    border: `1px solid ${
                      isActive ? theme.colors.primary : theme.colors.border
                    }`,
                    backgroundColor: isActive
                      ? `${theme.colors.primary}22`
                      : theme.colors.background,
                    color: isActive
                      ? theme.colors.primary
                      : theme.colors.textPrimary,
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    fontVariantNumeric: 'tabular-nums',
                    transition: 'background-color 0.15s ease, border-color 0.15s ease, scale 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ردیف بارگذاری فایل یا پوشه صوتی */}
        <SettingRow
          icon={<Upload size={22} color={theme.colors.primary} />}
          label={t.library}
          theme={theme}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                backgroundColor: theme.colors.background,
                color: theme.colors.textPrimary,
                border: `1px solid ${theme.colors.border}`,
                padding: '8px 14px',
                borderRadius: theme.radius.md,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '13.5px',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              <FolderUp size={16} color={theme.colors.primary} />
              <span>{t.importFolder || 'وارد کردن پوشه'}</span>
              <input
                type="file"
                accept="audio/*"
                multiple
                disabled={isLoading}
                {...folderUploadProps}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>

            <UploadButton
              isLoading={isLoading}
              label={isLoading ? t.loading : t.selectFiles}
              onFilesSelected={handleFileUpload}
              theme={theme}
            />
          </div>
        </SettingRow>

        {/* ردیف نمایش تعداد آهنگ‌ها */}
        <SettingRow
          icon={<Music size={22} color={theme.colors.primary} />}
          label={t.songCount}
          theme={theme}
          isLast={!isInstallable || isInstalled}
        >
          <span
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: theme.colors.textSecondary,
            }}
          >
            {songs.length}
          </span>
        </SettingRow>

        {/* ردیف نصب برنامه روی دسکتاپ ویندوز (فقط در صورت پشتیبانی مرورگر و نصب‌نشدن نمایش داده می‌شود) */}
        {isInstallable && !isInstalled && (
          <SettingRow
            icon={<Download size={22} color={theme.colors.primary} />}
            label={t.desktopInstall || 'نصب نسخه دسکتاپ ویندوز'}
            theme={theme}
            isLast
          >
            <button
              type="button"
              onClick={install}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: theme.radius.md,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              <Download size={16} />
              <span>{t.installAppBtn || 'نصب به عنوان برنامه'}</span>
            </button>
          </SettingRow>
        )}
      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** ردیف ورودی زیبا و تعاملی برای زیرصفحه‌های تنظیمات */
const SettingsNavEntry = ({
  icon,
  title,
  subtitle,
  badge,
  accent,
  isRTL,
  theme,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string | null;
  accent: string;
  isRTL: boolean;
  theme: any;
  onClick: () => void;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '18px 24px',
        border: 'none',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: hovered
          ? `linear-gradient(${isRTL ? '270deg' : '90deg'}, ${withAlpha(
              accent,
              theme.isDark ? 0.11 : 0.08
            )} 0%, transparent 85%)`
          : 'transparent',
        cursor: 'pointer',
        textAlign: 'start',
        transition: 'background 0.22s ease, opacity 0.18s ease, scale 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', minWidth: 0 }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: withAlpha(accent, hovered ? (theme.isDark ? 0.22 : 0.16) : theme.isDark ? 0.13 : 0.1),
            border: `1px solid ${withAlpha(accent, hovered ? 0.42 : 0.2)}`,
            boxShadow: hovered ? `0 6px 16px ${withAlpha(accent, 0.22)}` : 'none',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), background 0.2s ease, border-color 0.2s ease, box-shadow 0.22s ease',
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: '15.5px',
              fontWeight: 650,
              color: theme.colors.textPrimary,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '12.5px',
              color: theme.colors.textSecondary,
              marginTop: '3px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {badge && (
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: theme.radius.sm || '8px',
              backgroundColor: withAlpha(accent, theme.isDark ? 0.16 : 0.11),
              color: accent,
              border: `1px solid ${withAlpha(accent, 0.24)}`,
              whiteSpace: 'nowrap',
            }}
          >
            {badge}
          </span>
        )}
        <div
          style={{
            color: hovered ? accent : theme.colors.textSecondary,
            display: 'flex',
            alignItems: 'center',
            transform: hovered
              ? `translateX(${isRTL ? '-4px' : '4px'})`
              : 'translateX(0)',
            transition: 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), color 0.18s ease',
          }}
        >
          {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </div>
      </div>
    </button>
  );
};