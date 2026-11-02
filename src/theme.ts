export type PaletteType = 'default' | 'ocean' | 'sunset' | 'forest' | 'lavender' | 'rose' | 'crimson' | 'midnight' | 'monochrome' | 'cyberpunk';
export type ThemeMode = 'light' | 'dark';

const baseFonts = {
  main: "'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const baseShadows = {
  soft: '0 4px 15px rgba(0,0,0,0.03)',
  hard: '0 10px 30px rgba(0,0,0,0.08)',
  glow: '0 4px 12px rgba(0, 122, 255, 0.2)',
};

const baseRadius = {
  sm: '8px', md: '12px', lg: '16px', xl: '24px', full: '9999px'
};

const baseTransitions = {
  fast: 'all 0.1s ease', normal: 'all 0.2s ease', slow: 'all 0.3s ease',
};

// # تم‌های لایت (روشن)
const lightThemes: Record<PaletteType, any> = {
  default: {
    colors: { primary: '#007aff', background: '#f5f5f7', surface: '#ececec', surfaceHover: 'rgba(0,0,0,0.05)', textPrimary: '#1d1d1f', textSecondary: '#797979', textInverse: '#ffffff', border: '#e0e0e0', danger: '#ff3b30', success: '#34c759' },
  },
  ocean: {
    colors: { primary: '#0a84ff', background: '#eef6fc', surface: '#e0f0fa', surfaceHover: 'rgba(0,0,0,0.05)', textPrimary: '#001f3f', textSecondary: '#4a6b8a', textInverse: '#ffffff', border: '#b3d4f0', danger: '#ff3b30', success: '#34c759' },
  },
  sunset: {
    colors: { primary: '#ff6b35', background: '#fef5ed', surface: '#fce6d8', surfaceHover: 'rgba(0,0,0,0.05)', textPrimary: '#3a1c0f', textSecondary: '#8a5a44', textInverse: '#ffffff', border: '#f0c8a8', danger: '#ff3b30', success: '#34c759' },
  },
  forest: {
    colors: { primary: '#2e8b57', background: '#f0faf0', surface: '#e0f5e0', surfaceHover: 'rgba(0,0,0,0.05)', textPrimary: '#1a3a1a', textSecondary: '#5a7a5a', textInverse: '#ffffff', border: '#b3d4b3', danger: '#ff3b30', success: '#34c759' },
  },
  lavender: {
    colors: { primary: '#9b59b6', background: '#f8f4fa', surface: '#f0e6f5', surfaceHover: 'rgba(0,0,0,0.05)', textPrimary: '#2c1436', textSecondary: '#7a5a8a', textInverse: '#ffffff', border: '#d4b3e0', danger: '#ff3b30', success: '#34c759' },
  },
  rose: {
    colors: { primary: '#e84393', background: '#fdf5f8', surface: '#fce8f0', surfaceHover: 'rgba(0,0,0,0.05)', textPrimary: '#3a0f1f', textSecondary: '#8a4a6a', textInverse: '#ffffff', border: '#f0b3c8', danger: '#ff3b30', success: '#34c759' },
  },
  crimson: {
    colors: { primary: '#dc143c', background: '#fcf5f5', surface: '#fce8e8', surfaceHover: 'rgba(0,0,0,0.05)', textPrimary: '#3a0a0f', textSecondary: '#8a4a50', textInverse: '#ffffff', border: '#f0b3b8', danger: '#ff3b30', success: '#34c759' },
  },
  midnight: {
    colors: { primary: '#2c3e50', background: '#f0f2f5', surface: '#e0e4e8', surfaceHover: 'rgba(0,0,0,0.05)', textPrimary: '#0a0f14', textSecondary: '#5a6a7a', textInverse: '#ffffff', border: '#b3c0cc', danger: '#ff3b30', success: '#34c759' },
  },
  monochrome: {
    colors: { primary: '#333333', background: '#f5f5f5', surface: '#eeeeee', surfaceHover: 'rgba(0,0,0,0.05)', textPrimary: '#000000', textSecondary: '#666666', textInverse: '#ffffff', border: '#dddddd', danger: '#ff3b30', success: '#34c759' },
  },
  cyberpunk: {
    colors: { primary: '#f1c40f', background: '#fdfbed', surface: '#fcf5cc', surfaceHover: 'rgba(0,0,0,0.05)', textPrimary: '#1a1a00', textSecondary: '#7a7a00', textInverse: '#000000', border: '#e0d68a', danger: '#ff3b30', success: '#34c759' },
  }
};

// # تم‌های دارک (تیره)
const darkThemes: Record<PaletteType, any> = {
  default: {
    colors: { primary: '#0a84ff', background: '#121212', surface: '#1c1c1e', surfaceHover: 'rgba(255,255,255,0.08)', textPrimary: '#ffffff', textSecondary: '#a1a1a6', textInverse: '#000000', border: '#333333', danger: '#ff453a', success: '#30d158' },
  },
  ocean: {
    colors: { primary: '#64d2ff', background: '#0a192f', surface: '#112240', surfaceHover: 'rgba(255,255,255,0.08)', textPrimary: '#e6f1ff', textSecondary: '#8892b0', textInverse: '#000000', border: '#233554', danger: '#ff453a', success: '#30d158' },
  },
  sunset: {
    colors: { primary: '#ff9f0a', background: '#1c1014', surface: '#2c1a20', surfaceHover: 'rgba(255,255,255,0.08)', textPrimary: '#ffeee6', textSecondary: '#b88a7a', textInverse: '#000000', border: '#4a2a30', danger: '#ff453a', success: '#30d158' },
  },
  forest: {
    colors: { primary: '#30d158', background: '#0d1a0d', surface: '#1a2e1a', surfaceHover: 'rgba(255,255,255,0.08)', textPrimary: '#e0f5e0', textSecondary: '#7a9a7a', textInverse: '#000000', border: '#2e4a2e', danger: '#ff453a', success: '#30d158' },
  },
  lavender: {
    colors: { primary: '#c39bd3', background: '#1a0f1f', surface: '#2a1a30', surfaceHover: 'rgba(255,255,255,0.08)', textPrimary: '#f5e6fa', textSecondary: '#a08ab0', textInverse: '#000000', border: '#4a2a50', danger: '#ff453a', success: '#30d158' },
  },
  rose: {
    colors: { primary: '#fd79a8', background: '#1f0f14', surface: '#301a20', surfaceHover: 'rgba(255,255,255,0.08)', textPrimary: '#fae6ed', textSecondary: '#b08a9a', textInverse: '#000000', border: '#502a30', danger: '#ff453a', success: '#30d158' },
  },
  crimson: {
    colors: { primary: '#e74c3c', background: '#1a0a0a', surface: '#2a1010', surfaceHover: 'rgba(255,255,255,0.08)', textPrimary: '#fae6e6', textSecondary: '#b08a8a', textInverse: '#000000', border: '#4a2020', danger: '#ff453a', success: '#30d158' },
  },
  midnight: {
    colors: { primary: '#5d8aa8', background: '#0a1015', surface: '#15202a', surfaceHover: 'rgba(255,255,255,0.08)', textPrimary: '#e6f0f5', textSecondary: '#8aa0b0', textInverse: '#000000', border: '#2a3a4a', danger: '#ff453a', success: '#30d158' },
  },
  monochrome: {
    colors: { primary: '#aaaaaa', background: '#111111', surface: '#222222', surfaceHover: 'rgba(255,255,255,0.08)', textPrimary: '#ffffff', textSecondary: '#888888', textInverse: '#000000', border: '#444444', danger: '#ff453a', success: '#30d158' },
  },
  cyberpunk: {
    colors: { primary: '#f1c40f', background: '#111100', surface: '#222200', surfaceHover: 'rgba(255,255,255,0.08)', textPrimary: '#ffffcc', textSecondary: '#aaaa66', textInverse: '#000000', border: '#444400', danger: '#ff453a', success: '#30d158' },
  }
};

export const getTheme = (mode: ThemeMode, palette: PaletteType) => {
  const theme = mode === 'light' ? lightThemes[palette] : darkThemes[palette];
  return {
    ...theme,
    fonts: baseFonts,
    shadows: baseShadows,
    radius: baseRadius,
    transitions: baseTransitions,
  };
};