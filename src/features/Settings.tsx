import { useState } from 'react';
import type { EqualizerSettings, Song } from '../types';
import { parseBlob } from 'music-metadata';
import { Upload, Globe, Music, Palette, Sun, Moon } from 'lucide-react';
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

/** لیست پالت‌های رنگی قابل انتخاب در تنظیمات */
const PALETTES: { id: PaletteType; color: string }[] = [
  { id: 'default', color: '#007aff' },
  { id: 'ocean', color: '#0a84ff' },
  { id: 'sunset', color: '#ff6b35' },
  { id: 'forest', color: '#2e8b57' },
  { id: 'lavender', color: '#9b59b6' },
  { id: 'rose', color: '#e84393' },
  { id: 'crimson', color: '#dc143c' },
  { id: 'midnight', color: '#2c3e50' },
  { id: 'monochrome', color: '#333333' },
  { id: 'cyberpunk', color: '#f1c40f' },
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
const SettingRow = ({ icon, label, children, theme, isLast }: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  theme: any;
  isLast?: boolean;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 24px',
      borderBottom: isLast ? 'none' : `1px solid ${theme.colors.border}`,
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

/** کانتینر گروه دکمه‌های toggle (سگمنت انتخاب) */
const ToggleGroup = ({ children, theme }: {
  children: React.ReactNode;
  theme: any;
}) => (
  <div
    style={{
      display: 'flex',
      gap: '8px',
      backgroundColor: theme.colors.background,
      padding: '4px',
      borderRadius: theme.radius.md,
    }}
  >
    {children}
  </div>
);

/** یک دکمه‌ی toggle که حالت active/inactive دارد */
const ToggleButton = ({ active, onClick, children, theme }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  theme: any;
}) => (
  <button
    onClick={onClick}
    style={{
      padding: '6px 16px',
      borderRadius: theme.radius.sm,
      border: 'none',
      cursor: 'pointer',
      backgroundColor: active ? theme.colors.surface : 'transparent',
      color: active ? theme.colors.primary : theme.colors.textSecondary,
      fontWeight: active ? 'bold' : 'normal',
      boxShadow: active ? theme.shadows.soft : 'none',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
    }}
  >
    {children}
  </button>
);

/** دایره‌ی انتخاب یک پالت رنگی */
const PaletteSwatch = ({ color, selected, onClick, theme }: {
  color: string;
  selected: boolean;
  onClick: () => void;
  theme: any;
}) => (
  <button
    onClick={onClick}
    style={{
      width: '35px',
      height: '35px',
      borderRadius: '50%',
      border: selected
        ? `3px solid ${theme.colors.primary}`
        : `2px solid ${theme.colors.border}`,
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: color,
    }}
  />
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
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          border: `1px solid ${theme.colors.border}`,
          width: '100%',
          maxWidth: '1000px',
          overflow: 'hidden',
        }}
      >
        {/* ردیف انتخاب زبان */}
        <SettingRow
          icon={<Globe size={22} color={theme.colors.primary} />}
          label={t.language}
          theme={theme}
        >
          <ToggleGroup theme={theme}>
            <ToggleButton
              active={language === 'fa'}
              onClick={() => setLanguage('fa')}
              theme={theme}
            >
              فارسی
            </ToggleButton>
            <ToggleButton
              active={language === 'en'}
              onClick={() => setLanguage('en')}
              theme={theme}
            >
              English
            </ToggleButton>
          </ToggleGroup>
        </SettingRow>

        {/* ردیف انتخاب تم روشن/تاریک */}
        <SettingRow
          icon={
            themeMode === 'light'
              ? <Sun size={22} color={theme.colors.primary} />
              : <Moon size={22} color={theme.colors.primary} />
          }
          label={t.theme}
          theme={theme}
        >
          <ToggleGroup theme={theme}>
            <ToggleButton
              active={themeMode === 'light'}
              onClick={() => setThemeMode('light')}
              theme={theme}
            >
              <Sun size={16} /> {t.light}
            </ToggleButton>
            <ToggleButton
              active={themeMode === 'dark'}
              onClick={() => setThemeMode('dark')}
              theme={theme}
            >
              <Moon size={16} /> {t.dark}
            </ToggleButton>
          </ToggleGroup>
        </SettingRow>

        {/* ردیف انتخاب پالت رنگی */}
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
                fontWeight: '500',
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
                color={palette.color}
                selected={colorPalette === palette.id}
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