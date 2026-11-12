import { useState, useRef, useEffect } from 'react';
import type { EqualizerSettings, Song } from '../types';
import { 
  Upload, 
  Globe, 
  Music, 
  Palette, 
  Sun, 
  Moon, 
  Smartphone, 
  ChevronDown, 
  Check,
  Image as ImageIcon,
  RefreshCw,
  Layers,
  FolderUp,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PaletteType, ThemeMode } from '../theme';
import { EqualizerControl } from '../components/EqualizerControl';
import { extractSongsBatched } from '../utils/audioMetadata';
import { usePWAInstall } from '../hooks/usePWAInstall';

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
  theme: any;
  customBackground?: string | null;
  setCustomBackground?: (bg: string | null) => void;
  customBgBlur?: number;
  setCustomBgBlur?: (blur: number) => void;
  customBgDim?: number;
  setCustomBgDim?: (dim: number) => void;
  glassCardCovers?: boolean;
  setGlassCardCovers?: (enabled: boolean) => void;
}

/** لیست پالت‌های رنگی قابل انتخاب در تنظیمات (با اولویت پالت‌های دو رنگی ساده سفید-آبی و سفید-قرمز) */
const PALETTES: { id: PaletteType; label: string; color: string; secondaryColor: string }[] = [
  { id: 'classic-blue', label: 'آبی کلاسیک (سفید آبی / مشکی آبی)', color: '#0066FF', secondaryColor: '#38BDF8' },
  { id: 'classic-red', label: 'قرمز کلاسیک (سفید قرمز / مشکی قرمز)', color: '#DC2626', secondaryColor: '#EF4444' },
  { id: 'nordic', label: 'نوردیک استیل', color: '#57707A', secondaryColor: '#C5BAC4' },
  { id: 'glacier', label: 'اقیانوس و قطب', color: '#4A5C6A', secondaryColor: '#CCD0CF' },
  { id: 'amethyst', label: 'آمیتیست بنفش', color: '#8B7CC7', secondaryColor: '#5A3B8C' },
  { id: 'sapphire', label: 'یاقوت کبود', color: '#3B82F6', secondaryColor: '#1C2541' },
  { id: 'amber', label: 'قهوه و موکا', color: '#C6601F', secondaryColor: '#A88462' },
  { id: 'sunset', label: 'غروب نارنجی', color: '#FF7A00', secondaryColor: '#FFA94D' },
  { id: 'emerald', label: 'زمرد و بیشه', color: '#48BB78', secondaryColor: '#163832' },
  { id: 'teal', label: 'تالاب دریایی', color: '#14B8A6', secondaryColor: '#7FB3B8' },
  { id: 'synthwave', label: 'نئون سایبر', color: '#FF6B6B', secondaryColor: '#D6598F' },
  { id: 'mauve', label: 'مخملی بنفش', color: '#D946EF', secondaryColor: '#DFB6B2' },
  { id: 'mint', label: 'فیروزه و نعنا', color: '#2DD4BF', secondaryColor: '#99F6E4' },
];

/** پیش‌فرض‌های والپیپر انتخابی و باکیفیت برای بک‌گراند */
const WALLPAPER_PRESETS = [
  { id: 'nebula', label: 'کیهان و ستاره‌ها', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80' },
  { id: 'mountain', label: 'کوهستان برفی', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&auto=format&fit=crop&q=80' },
  { id: 'cyber', label: 'افق نئونی شب', url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1600&auto=format&fit=crop&q=80' },
  { id: 'ocean', label: 'امواج اقیانوس', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80' },
  { id: 'gradient', label: 'گرادیان ارغوانی', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80' },
];

/** پیش‌فرض‌های والپیپر انتخابی و باکیفیت برای بک‌گراند */

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
                    transition: 'background-color 0.15s ease, color 0.15s ease',
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

/** دایره/کپسول انتخاب یک پالت رنگی */
const PaletteSwatch = ({
  palette,
  selected,
  onClick,
  theme,
}: {
  palette: (typeof PALETTES)[number];
  selected: boolean;
  onClick: () => void;
  theme: any;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={palette.label}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '7px 12px',
      borderRadius: '20px',
      border: selected
        ? `2px solid ${palette.color}`
        : `1px solid ${theme.colors.border}`,
      backgroundColor: selected ? `${palette.color}20` : 'rgba(255, 255, 255, 0.04)',
      boxShadow: selected ? `0 0 14px ${palette.color}55` : 'none',
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
      outline: 'none',
    }}
  >
    <div
      style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${palette.color} 50%, ${palette.secondaryColor} 50%)`,
        border: '1.5px solid rgba(255, 255, 255, 0.4)',
        boxShadow: `0 2px 6px ${palette.color}66`,
        flexShrink: 0,
      }}
    />
    <span
      style={{
        fontSize: '13px',
        fontWeight: selected ? '700' : '500',
        color: selected ? theme.colors.textPrimary : theme.colors.textSecondary,
        whiteSpace: 'nowrap',
      }}
    >
      {palette.label}
    </span>
  </button>
);

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
        transition: 'transform 0.2s',
        transform: hovered && !isLoading ? 'scale(1.05)' : 'scale(1)',
        opacity: isLoading ? 0.7 : 1,
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
  theme,
  customBackground,
  setCustomBackground,
  customBgBlur = 10,
  setCustomBgBlur,
  customBgDim = 45,
  setCustomBgDim,
  glassCardCovers = true,
  setGlassCardCovers,
}: SettingsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const { isInstallable, isInstalled, install } = usePWAInstall();

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

        {/* ردیف انتخاب تم برنامه (سیستم / روشن / تیره) به صورت منوی بازشونده */}
        <SettingRow
          icon={
            themeMode === 'system'
              ? <Smartphone size={22} color={theme.colors.primary} />
              : themeMode === 'light'
              ? <Sun size={22} color={theme.colors.primary} />
              : <Moon size={22} color={theme.colors.primary} />
          }
          label={t.theme}
          theme={theme}
          zIndex={20}
        >
          <DropdownSelect
            value={themeMode}
            options={[
              {
                id: 'system',
                label: t.system || 'پیش‌فرض سیستم / گوشی',
                icon: <Smartphone size={18} />,
              },
              {
                id: 'light',
                label: t.light || 'روشن',
                icon: <Sun size={18} />,
              },
              {
                id: 'dark',
                label: t.dark || 'تیره',
                icon: <Moon size={18} />,
              },
            ]}
            onChange={(mode) => setThemeMode(mode)}
            theme={theme}
            minWidth={200}
            ariaLabel={t.theme}
          />
        </SettingRow>

        {/* ردیف انتخاب پالت رنگی با پیش‌نمایش کپسولی شیشه‌ای */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '15px',
            }}
          >
            <Palette size={22} color={theme.colors.primary} />
            <span
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: theme.colors.textPrimary,
              }}
            >
              {t.colorPalette}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {PALETTES.map((palette) => (
              <PaletteSwatch
                key={palette.id}
                palette={palette}
                selected={colorPalette === palette.id || (colorPalette === 'default' && palette.id === 'classic-blue')}
                onClick={() => setColorPalette(palette.id)}
                theme={theme}
              />
            ))}
          </div>
        </div>

        {/* ردیف جلوه کاور شیشه‌ای روی کارت آهنگ‌ها (مطابق عکس ارسالی کاربر) */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Layers size={22} color={theme.colors.primary} />
            <div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: theme.colors.textPrimary,
                }}
              >
                {t.glassCardCovers || 'کاور شیشه‌ای روی کارت آهنگ‌ها'}
              </div>
              <div
                style={{
                  fontSize: '12.5px',
                  color: theme.colors.textSecondary,
                  marginTop: '3px',
                }}
              >
                {t.glassCardCoversDesc || 'نمایش تصویر کاور هر آهنگ به صورت پس‌زمینه شیشه‌ای روی کارت آن'}
              </div>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={glassCardCovers}
            onClick={() => setGlassCardCovers?.(!glassCardCovers)}
            style={{
              position: 'relative',
              direction: 'ltr',
              width: '48px',
              height: '28px',
              borderRadius: '14px',
              backgroundColor: glassCardCovers
                ? theme.colors.primary
                : theme.colors.border,
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.25s ease',
              padding: 0,
              outline: 'none',
              flexShrink: 0,
            }}
          >
            <motion.span
              initial={false}
              animate={{
                left: glassCardCovers ? 23 : 3,
              }}
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
        </div>

        {/* بخش پس‌زمینه دلخواه برنامه (Custom Wallpaper) */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <ImageIcon size={22} color={theme.colors.primary} />
              <div>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: theme.colors.textPrimary,
                    display: 'block',
                  }}
                >
                  {t.customBackground || 'پس‌زمینه دلخواه برنامه'}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: theme.colors.textSecondary,
                    marginTop: '2px',
                    display: 'block',
                  }}
                >
                  {t.selectWallpaperHint || 'تصویر دلخواه خود را برای بک‌گراند شیشه‌ای برنامه تنظیم کنید.'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {customBackground && (
                <button
                  type="button"
                  onClick={() => setCustomBackground?.(null)}
                  title={t.resetWallpaper || 'بازگشت به پیش‌فرض'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 12px',
                    borderRadius: '12px',
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
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
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: theme.colors.primary,
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  boxShadow: `0 3px 10px ${theme.colors.primary}44`,
                }}
              >
                <Upload size={14} />
                <span>{t.uploadWallpaper || 'انتخاب عکس از دستگاه'}</span>
              </button>
            </div>
          </div>

          {/* پیش‌فرض‌های برگزیده والپیپر */}
          <div style={{ marginTop: '14px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: theme.colors.textSecondary,
                marginBottom: '8px',
              }}
            >
              {t.wallpaperPresets || 'پیش‌فرض‌های برگزیده'}:
            </div>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {WALLPAPER_PRESETS.map((preset) => {
                const isSelected = customBackground === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setCustomBackground?.(preset.url)}
                    style={{
                      position: 'relative',
                      width: '74px',
                      height: '52px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: isSelected
                        ? `2.5px solid ${theme.colors.primary}`
                        : `1px solid ${theme.colors.border}`,
                      boxShadow: isSelected ? `0 0 12px ${theme.colors.primary}66` : 'none',
                      cursor: 'pointer',
                      padding: 0,
                      flexShrink: 0,
                      outline: 'none',
                    }}
                    title={preset.label}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
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
          </div>

          {/* کنترل‌های اسلایدر بلور و تیرگی در صورت فعال بودن والپیپر */}
          {customBackground && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: theme.colors.textSecondary,
                    marginBottom: '6px',
                  }}
                >
                  <span>{t.wallpaperBlur || 'میزان تاری (Blur)'}</span>
                  <span style={{ fontWeight: 700, color: theme.colors.textPrimary }}>
                    {customBgBlur}px
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={customBgBlur}
                  onChange={(e) => setCustomBgBlur?.(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: theme.colors.primary,
                    cursor: 'pointer',
                  }}
                />
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: theme.colors.textSecondary,
                    marginBottom: '6px',
                  }}
                >
                  <span>{t.wallpaperDim || 'تیرگی لایه محافظ'}</span>
                  <span style={{ fontWeight: 700, color: theme.colors.textPrimary }}>
                    {customBgDim}%
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={85}
                  step={1}
                  value={customBgDim}
                  onChange={(e) => setCustomBgDim?.(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: theme.colors.primary,
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* بخش اکولایزر ۵ بانده و تقویت باس */}
        <EqualizerControl
          settings={equalizerSettings}
          onChange={setEqualizerSettings}
          theme={theme}
          t={t}
        />

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
    </div>
  );
};