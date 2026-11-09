import type { CSSProperties } from 'react';

/** استایل‌های ریسپانسیو برای صفحه AllSongs */
export const responsiveStyles: Record<string, CSSProperties> = {
  container: {
    flex: 1,
    padding: 'clamp(12px, 2vw, 24px) clamp(16px, 4vw, 40px) 130px',
    overflowY: 'auto',
    overflowX: 'hidden', // جلوگیری از اسکرول افقی
  },
  headerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 'clamp(8px, 2vw, 16px)',
    marginBottom: 'clamp(16px, 3vw, 24px)',
  },
  songRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(10px, 2vw, 16px)',
    padding: 'clamp(6px, 1vw, 10px) clamp(8px, 2vw, 12px)',
    borderRadius: '12px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease',
  },
  coverImage: {
    width: 'clamp(40px, 5vw, 52px)',
    height: 'clamp(40px, 5vw, 52px)',
    borderRadius: '8px',
    objectFit: 'cover',
    boxShadow: 'none',
  },
};