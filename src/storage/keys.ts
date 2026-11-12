/** کلیدهای localStorage. مقدارها نباید عوض بشن، وگرنه داده‌ی قبلی کاربر گم می‌شه */
export const STORAGE_KEYS = {
  library: 'musicLibrary',
  playlists: 'playlists',
  equalizer: 'equalizerSettings',
  recentSearches: 'recentSearches',
  palette: 'appColorPalette',
  customBg: 'appCustomBackground',
  customBgBlur: 'appCustomBgBlur',
  customBgDim: 'appCustomBgDim',
  glassCardCovers: 'appGlassCardCovers',
  folders: 'musicFolders',
  volume: 'playerVolume',
  repeatMode: 'playerRepeatMode',
  shuffle: 'playerShuffle',
  lastPlayback: 'playerLastPlayback',
} as const;
