import { useState, useRef, useEffect } from 'react';
import type { EqualizerSettings, Song } from '../types';
import { parseBlob } from 'music-metadata';
import { Upload, Globe, Music, Palette, Sun, Moon, Smartphone, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PaletteType, ThemeMode } from '../theme';
import { EqualizerControl } from '../components/EqualizerControl';

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
}

/** لیست پالت‌های رنگی قابل انتخاب در تنظیمات (برگرفته از عکس‌های ارسالی کاربر) */
const PALETTES: { id: PaletteType; label: string; color: string; secondaryColor: string }[] = [
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

/** استخراج متادیتا و ساخت آبجکت Song از یک فایل صوتی */
/** استخراج متادیتا و ساخت آبجکت Song از یک فایل صوتی */
const extractSongFromFile = async (file: File): Promise<Song | null> => {
  try {
    const metadata = await parseBlob(file);
    let coverUrl = 'https://picsum.photos/seed/default/200';

    const picture = metadata.common.picture?.[0];
    if (picture) {
      const blob = new Blob([picture.data as any], { type: picture.format });
      coverUrl = URL.createObjectURL(blob);
    }

    // خواندن مدت زمان واقعی آهنگ
    let duration = metadata.format.duration || 0;
    
    // اگر متادیتا زمان نداشت، به صورت دستی محاسبه می‌کنیم
    if (duration === 0) {
      duration = await new Promise<number>((resolve) => {
        const audio = new Audio(URL.createObjectURL(file));
        audio.onloadedmetadata = () => resolve(audio.duration);
        audio.onerror = () => resolve(0);
      });
    }

    return {
      id: crypto.randomUUID(),
      name: metadata.common.title || file.name.replace('.mp3', ''),
      artist: metadata.common.artist || 'Unknown',
      cover: coverUrl,
      fileUrl: URL.createObjectURL(file),
      playCount: 0,
      addedAt: Date.now(),
      duration: duration, // <--- ذخیره مدت زمان
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

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
}: SettingsProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // پردازش فایل‌های انتخاب‌شده، استخراج متادیتا و افزودن به لیست آهنگ‌ها
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = input.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);

    const newSongs: Song[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.includes('audio') && !file.name.endsWith('.mp3')) continue;
      const song = await extractSongFromFile(file);
      if (song) newSongs.push(song);
    }

    setSongs((prev) => [...prev, ...newSongs]);
    setIsLoading(false);

    // ریست input تا انتخاب مجدد همان فایل هم مجاز باشد
    input.value = '';
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
                selected={colorPalette === palette.id || (colorPalette === 'default' && palette.id === 'nordic')}
                onClick={() => setColorPalette(palette.id)}
                theme={theme}
              />
            ))}
          </div>
        </div>

        {/* بخش اکولایزر ۵ بانده و تقویت باس */}
        <EqualizerControl
          settings={equalizerSettings}
          onChange={setEqualizerSettings}
          theme={theme}
          t={t}
        />

        {/* ردیف بارگذاری فایل صوتی */}
        <SettingRow
          icon={<Upload size={22} color={theme.colors.primary} />}
          label={t.library}
          theme={theme}
        >
          <UploadButton
            isLoading={isLoading}
            label={isLoading ? t.loading : t.selectFiles}
            onFilesSelected={handleFileUpload}
            theme={theme}
          />
        </SettingRow>

        {/* ردیف نمایش تعداد آهنگ‌ها */}
        <SettingRow
          icon={<Music size={22} color={theme.colors.primary} />}
          label={t.songCount}
          theme={theme}
          isLast
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
      </div>
    </div>
  );
};